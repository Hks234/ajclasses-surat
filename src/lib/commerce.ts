import Razorpay from "razorpay";
import { all, insert, one, run, transaction } from "./db";
import { queueTemplate } from "./email";
import { demoCheckoutAllowed, readIntegrations, razorpayReady } from "./secrets";
import { hmac, id, inr, now, pageUrl, safeEqual, sha256 } from "./utils";

export type CheckoutType = "batch" | "test_series" | "book";

export type ShippingAddress = {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

export function readShipping(input: Record<string, unknown> | undefined): { shipping: ShippingAddress } | { error: string } {
  const shipping: ShippingAddress = {
    name: String(input?.name || "").trim(),
    phone: String(input?.phone || "").replace(/\s+/g, ""),
    line1: String(input?.line1 || "").trim(),
    line2: String(input?.line2 || "").trim(),
    city: String(input?.city || "").trim(),
    state: String(input?.state || "").trim(),
    pincode: String(input?.pincode || "").trim(),
  };
  if (!shipping.name || !shipping.phone || !shipping.line1 || !shipping.city || !shipping.state || !/^\d{6}$/.test(shipping.pincode)) {
    return { error: "Enter a complete shipping address with a 6-digit PIN code. Books are sent by physical delivery." };
  }
  return { shipping };
}

export async function quoteProduct(type: CheckoutType, itemId: string, userId: string, couponCode?: string) {
  const product = await loadProduct(type, itemId);
  if (!product) return { error: "This item is not available." as const };
  if (product.price_paise <= 0) return { error: "A selling price has not been published for this item yet." as const };
  if (type === "book" && Number(product.stock) <= 0) return { error: "This book is out of stock." as const };
  if (type !== "book") {
    const existing = await activeEnrollment(userId, type, itemId);
    if (existing) return { error: "You already have access to this programme." as const };
  }
  if (type === "batch" && product.seats > 0 && product.seats_sold >= product.seats) return { error: "This batch has no seats left." as const };
  let discount = 0;
  let coupon: any = null;
  if (couponCode) {
    const applied = await evaluateCoupon(couponCode, userId, product.price_paise, itemId);
    if (applied.error) return { error: applied.error };
    discount = applied.discount;
    coupon = applied.coupon;
  }
  const payable = Math.max(0, product.price_paise - discount);
  return { product, discount, payable, coupon };
}

async function loadProduct(type: string, itemId: string) {
  if (type === "book") {
    return one<any>("SELECT * FROM books WHERE id = ? AND deleted_at IS NULL AND status = 'published'", [itemId]);
  }
  if (type === "batch") {
    return one<any>(
      `SELECT b.*, c.name AS course_name FROM batches b JOIN courses c ON c.id = b.course_id
       WHERE b.id = ? AND b.deleted_at IS NULL AND b.status = 'published' AND c.status = 'published'`,
      [itemId],
    );
  }
  return one<any>("SELECT * FROM test_series WHERE id = ? AND deleted_at IS NULL AND status = 'published'", [itemId]);
}

async function activeEnrollment(userId: string, type: string, itemId: string) {
  const column = type === "batch" ? "batch_id" : "test_series_id";
  const row = await one<any>(`SELECT * FROM enrollments WHERE user_id = ? AND ${column} = ? AND status = 'active'`, [userId, itemId]);
  if (!row) return null;
  if (row.expires_at && row.expires_at < now()) return null;
  return row;
}

export async function evaluateCoupon(code: string, userId: string, amount: number, itemId: string) {
  const coupon = await one<any>("SELECT * FROM coupons WHERE lower(code) = ? AND active = 1", [code.trim().toLowerCase()]);
  if (!coupon) return { error: "Coupon is not valid." as const, discount: 0, coupon: null };
  if (coupon.expires_at && coupon.expires_at < now()) return { error: "Coupon has expired." as const, discount: 0, coupon: null };
  if (amount < Number(coupon.min_order_paise || 0)) return { error: "Order amount is below the coupon minimum." as const, discount: 0, coupon: null };
  let applicable: string[] = [];
  try { applicable = JSON.parse(coupon.applicable_json || "[]"); } catch { applicable = []; }
  if (applicable.length && !applicable.includes("all") && !applicable.includes(itemId)) {
    return { error: "Coupon does not apply to this programme." as const, discount: 0, coupon: null };
  }
  if (Number(coupon.usage_limit) > 0) {
    const used = await one<any>("SELECT COUNT(*) AS c FROM coupon_usage WHERE coupon_id = ?", [coupon.id]);
    if (Number(used?.c || 0) >= Number(coupon.usage_limit)) return { error: "Coupon usage limit has been reached." as const, discount: 0, coupon: null };
  }
  const mine = await one<any>("SELECT COUNT(*) AS c FROM coupon_usage WHERE coupon_id = ? AND user_id = ?", [coupon.id, userId]);
  if (Number(mine?.c || 0) >= Number(coupon.per_user_limit || 1)) return { error: "You have already used this coupon." as const, discount: 0, coupon: null };
  let discount = coupon.discount_type === "percent" ? Math.round(amount * Number(coupon.discount_value) / 100) : Number(coupon.discount_value);
  if (coupon.max_discount_paise) discount = Math.min(discount, Number(coupon.max_discount_paise));
  discount = Math.max(0, Math.min(discount, amount));
  return { discount, coupon, error: null };
}

export async function createCheckout(userId: string, type: CheckoutType, itemId: string, couponCode?: string, shipping?: ShippingAddress) {
  if (type === "book" && !shipping) return { error: "A delivery address is required for book orders." };
  const quote = await quoteProduct(type, itemId, userId, couponCode);
  if ("error" in quote && quote.error) return { error: quote.error };
  const { product, payable, coupon } = quote as any;
  const title = type === "batch" ? `${product.course_name} · ${product.name}` : type === "book" ? product.title : product.title;
  const purchaseId = id();
  const paymentId = id();
  const stamp = now();
  await transaction(async () => {
    await insert("purchases", {
      id: purchaseId,
      user_id: userId,
      total_paise: payable,
      status: "pending",
      coupon_id: coupon?.id || null,
      shipping_json: shipping ? JSON.stringify(shipping) : null,
      created_at: stamp,
    });
    await insert("purchase_items", {
      id: id(),
      purchase_id: purchaseId,
      item_type: type,
      item_id: itemId,
      title,
      price_paise: payable,
    });
    await insert("payments", {
      id: paymentId,
      purchase_id: purchaseId,
      user_id: userId,
      provider: payable === 0 ? "free" : razorpayReady() ? "razorpay" : "demo",
      razorpay_order_id: null,
      razorpay_payment_id: null,
      amount_paise: payable,
      currency: "INR",
      status: payable === 0 ? "created" : "created",
      method: null,
      signature_verified: 0,
      demo_token_hash: null,
      raw_json: null,
      created_at: stamp,
      updated_at: stamp,
    });
  });

  if (payable === 0) {
    await fulfillPayment(paymentId, { method: "free" });
    return { mode: "free" as const, paymentId, amount: 0 };
  }

  if (razorpayReady()) {
    const cfg = readIntegrations();
    const rz = new Razorpay({ key_id: cfg.razorpayKeyId, key_secret: cfg.razorpayKeySecret });
    const order = await rz.orders.create({
      amount: payable,
      currency: "INR",
      receipt: paymentId.slice(0, 40),
      notes: { paymentId, purchaseId, userId },
    });
    await run("UPDATE payments SET razorpay_order_id = ?, raw_json = ?, updated_at = ? WHERE id = ?", [order.id, JSON.stringify(order), now(), paymentId]);
    return {
      mode: "razorpay" as const,
      paymentId,
      keyId: cfg.razorpayKeyId,
      orderId: order.id,
      amount: payable,
      currency: "INR",
      name: "AJ Classes",
      description: title,
    };
  }

  if (!demoCheckoutAllowed()) return { error: "Razorpay is not configured. Add the keys in Admin → Security." };
  const demoToken = id() + id();
  await run("UPDATE payments SET provider = 'demo', demo_token_hash = ?, updated_at = ? WHERE id = ?", [sha256(demoToken), now(), paymentId]);
  return { mode: "demo" as const, paymentId, demoToken, amount: payable, description: title };
}

export async function verifyRazorpay(paymentId: string, orderId: string, razorpayPaymentId: string, signature: string) {
  const cfg = readIntegrations();
  const expected = hmac(`${orderId}|${razorpayPaymentId}`, cfg.razorpayKeySecret);
  if (!safeEqual(expected, signature)) return { error: "Payment signature did not match." };
  const payment = await one<any>("SELECT * FROM payments WHERE id = ?", [paymentId]);
  if (!payment || payment.razorpay_order_id !== orderId) return { error: "Payment order was not found." };
  if (payment.amount_paise <= 0) return { error: "Payment amount is invalid." };
  await run("UPDATE payments SET razorpay_payment_id = ?, signature_verified = 1, updated_at = ? WHERE id = ?", [razorpayPaymentId, now(), paymentId]);
  await fulfillPayment(paymentId, { method: "razorpay", razorpayPaymentId });
  return { ok: true };
}

export async function verifyDemo(paymentId: string, demoToken: string, userId: string) {
  if (!demoCheckoutAllowed()) return { error: "Demo checkout is disabled." };
  const payment = await one<any>("SELECT * FROM payments WHERE id = ? AND user_id = ?", [paymentId, userId]);
  if (!payment || payment.provider !== "demo") return { error: "Demo payment was not found." };
  if (!payment.demo_token_hash || !safeEqual(payment.demo_token_hash, sha256(demoToken))) return { error: "Demo confirmation token did not match." };
  await fulfillPayment(paymentId, { method: "demo" });
  return { ok: true };
}

export async function fulfillPayment(paymentId: string, extra: { method?: string; razorpayPaymentId?: string } = {}) {
  const payment = await one<any>("SELECT * FROM payments WHERE id = ?", [paymentId]);
  if (!payment || payment.status === "paid") return;
  const purchase = await one<any>("SELECT * FROM purchases WHERE id = ?", [payment.purchase_id]);
  const items = await all<any>("SELECT * FROM purchase_items WHERE purchase_id = ?", [payment.purchase_id]);
  const user = await one<any>("SELECT * FROM users WHERE id = ?", [payment.user_id]);
  const stamp = now();
  await transaction(async () => {
    const current = await one<any>("SELECT status FROM payments WHERE id = ?", [paymentId]);
    if (!current || current.status === "paid") return;
    await run("UPDATE payments SET status = 'paid', method = ?, razorpay_payment_id = COALESCE(?, razorpay_payment_id), updated_at = ? WHERE id = ?", [extra.method || payment.provider, extra.razorpayPaymentId || null, stamp, paymentId]);
    await run("UPDATE purchases SET status = 'paid' WHERE id = ?", [payment.purchase_id]);
    for (const item of items) {
      if (item.item_type === "book") {
        const book = await one<any>("SELECT stock FROM books WHERE id = ?", [item.item_id]);
        let shipping: Partial<ShippingAddress> = {};
        try { shipping = JSON.parse(purchase.shipping_json || "{}"); } catch { shipping = {}; }
        const existingShip = await one("SELECT id FROM book_shipments WHERE purchase_id = ? AND book_id = ?", [purchase.id, item.item_id]);
        if (!existingShip) {
          await insert("book_shipments", {
            id: id(),
            purchase_id: purchase.id,
            book_id: item.item_id,
            title: item.title,
            buyer_name: shipping.name || user?.full_name || "Student",
            phone: shipping.phone || user?.mobile || "",
            line1: shipping.line1 || "",
            line2: shipping.line2 || "",
            city: shipping.city || "",
            state: shipping.state || "",
            pincode: shipping.pincode || "",
            status: Number(book?.stock) > 0 ? "pending" : "awaiting_stock",
            tracking: "",
            notes: "",
            created_at: stamp,
          });
        }
        if (Number(book?.stock) > 0) await run("UPDATE books SET stock = CASE WHEN stock > 0 THEN stock - 1 ELSE 0 END WHERE id = ?", [item.item_id]);
        continue;
      }
      const column = item.item_type === "batch" ? "batch_id" : "test_series_id";
      const found = await one<any>(`SELECT id FROM enrollments WHERE user_id = ? AND ${column} = ? AND status = 'active'`, [payment.user_id, item.item_id]);
      if (found) continue;
      const product = item.item_type === "batch"
        ? await one<any>("SELECT validity_days FROM batches WHERE id = ?", [item.item_id])
        : await one<any>("SELECT validity_days FROM test_series WHERE id = ?", [item.item_id]);
      const days = Number(product?.validity_days || 365);
      const expires = new Date(Date.now() + days * 86400000).toISOString();
      await insert("enrollments", {
        id: id(),
        user_id: payment.user_id,
        batch_id: item.item_type === "batch" ? item.item_id : null,
        test_series_id: item.item_type === "test_series" ? item.item_id : null,
        purchase_id: purchase.id,
        status: "active",
        expires_at: expires,
        created_at: stamp,
      });
      if (item.item_type === "batch") await run("UPDATE batches SET seats_sold = seats_sold + 1 WHERE id = ?", [item.item_id]);
    }
    if (purchase.coupon_id) {
      const used = await one("SELECT id FROM coupon_usage WHERE payment_id = ?", [paymentId]);
      if (!used) {
        await insert("coupon_usage", { id: id(), coupon_id: purchase.coupon_id, user_id: payment.user_id, payment_id: paymentId, created_at: stamp });
      }
    }
    await insert("notifications", {
      id: id(),
      user_id: payment.user_id,
      title: "Purchase confirmed",
      body: items.map((item: any) => item.title).join(", "),
      href: "/student/my-purchases",
      read_at: null,
      created_at: stamp,
    });
  });
  if (user) {
    await queueTemplate("purchase_confirmation", user.email, {
      student_name: user.full_name,
      course_name: items[0]?.title || "AJ Classes programme",
      batch_name: items[0]?.title || "",
      amount: inr(payment.amount_paise),
      status: "Paid",
      transaction_id: extra.razorpayPaymentId || paymentId,
      purchase_date: stamp.slice(0, 10),
      portal_link: pageUrl("/student/dashboard"),
    });
  }
}

export async function handleWebhook(raw: string, signature: string | null) {
  const cfg = readIntegrations();
  if (!cfg.razorpayWebhookSecret || !signature) return { error: "Webhook secret is not configured." };
  const expected = hmac(raw, cfg.razorpayWebhookSecret);
  if (!safeEqual(expected, signature)) return { error: "Invalid webhook signature." };
  const event = JSON.parse(raw);
  const eventId = event.id || id();
  const existing = await one("SELECT id FROM payment_webhooks WHERE event_id = ?", [eventId]);
  if (existing) return { ok: true };
  await insert("payment_webhooks", { id: id(), event_id: eventId, payload: raw, processed: 0, created_at: now() });
  const paymentEntity = event.payload?.payment?.entity;
  if (event.event === "payment.captured" && paymentEntity?.order_id) {
    const payment = await one<any>("SELECT * FROM payments WHERE razorpay_order_id = ?", [paymentEntity.order_id]);
    if (payment && Number(paymentEntity.amount) === Number(payment.amount_paise)) {
      await run("UPDATE payments SET razorpay_payment_id = ?, updated_at = ? WHERE id = ?", [paymentEntity.id, now(), payment.id]);
      await fulfillPayment(payment.id, { method: paymentEntity.method || "razorpay", razorpayPaymentId: paymentEntity.id });
    }
  }
  if (event.event === "payment.failed" && paymentEntity?.order_id) {
    await run("UPDATE payments SET status = 'failed', updated_at = ? WHERE razorpay_order_id = ? AND status = 'created'", [now(), paymentEntity.order_id]);
    await run("UPDATE purchases SET status = 'failed' WHERE id IN (SELECT purchase_id FROM payments WHERE razorpay_order_id = ?) AND status = 'pending'", [paymentEntity.order_id]);
  }
  await run("UPDATE payment_webhooks SET processed = 1 WHERE event_id = ?", [eventId]);
  return { ok: true };
}

export async function refundPayment(paymentId: string, amountPaise: number, reason: string, adminId: string) {
  const payment = await one<any>("SELECT * FROM payments WHERE id = ?", [paymentId]);
  if (!payment || payment.status !== "paid") return { error: "Only a successful payment can be refunded." };
  if (amountPaise <= 0 || amountPaise > Number(payment.amount_paise)) return { error: "Refund amount is invalid." };
  let razorpayRefundId = "";
  if (payment.provider === "razorpay" && payment.razorpay_payment_id && razorpayReady()) {
    const cfg = readIntegrations();
    const rz = new Razorpay({ key_id: cfg.razorpayKeyId, key_secret: cfg.razorpayKeySecret });
    const refund = await rz.payments.refund(payment.razorpay_payment_id, { amount: amountPaise, notes: { reason } });
    razorpayRefundId = refund.id;
  }
  await insert("refunds", {
    id: id(),
    payment_id: paymentId,
    amount_paise: amountPaise,
    status: "processed",
    reason,
    razorpay_refund_id: razorpayRefundId || null,
    created_by: adminId,
    created_at: now(),
  });
  if (amountPaise >= Number(payment.amount_paise)) {
    await run("UPDATE payments SET status = 'refunded', updated_at = ? WHERE id = ?", [now(), paymentId]);
    await run("UPDATE purchases SET status = 'refunded' WHERE id = ?", [payment.purchase_id]);
    await run("UPDATE enrollments SET status = 'revoked' WHERE purchase_id = ?", [payment.purchase_id]);
  }
  return { ok: true };
}
