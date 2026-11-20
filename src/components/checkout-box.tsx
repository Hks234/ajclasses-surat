"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { inr } from "@/lib/utils";

declare global { interface Window { Razorpay?: any } }

export function CheckoutBox({ type, itemId, title, listPrice, signedIn }: { type: "batch" | "test_series" | "book"; itemId: string; title: string; listPrice: number; signedIn: boolean }) {
  const router = useRouter();
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<any>({ amount: listPrice, discount: 0, title });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [shipping, setShipping] = useState({ name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" });

  async function call(body: Record<string, unknown>) {
    const res = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, itemId, coupon, ...(type === "book" ? shipping : {}), ...body }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Checkout failed");
    return data;
  }

  useEffect(() => {
    if (!signedIn) return;
    void call({ action: "quote" }).then(setQuote).catch(() => undefined);
    // Initial payable amount only; coupon apply has its own submit handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, itemId, type]);

  async function onQuote(event: FormEvent) {
    event.preventDefault();
    setError("");
    try { setQuote(await call({ action: "quote" })); } catch (err) { setError(err instanceof Error ? err.message : "Could not apply coupon"); }
  }

  async function pay() {
    setError(""); setInfo("");
    if (type === "book" && (!shipping.name || !shipping.phone || !shipping.line1 || !shipping.city || !shipping.state || !/^\d{6}$/.test(shipping.pincode))) {
      setError("Enter the full delivery address and a 6-digit PIN code. Books are sent by physical shipping.");
      return;
    }
    const checkoutPath = type === "test_series" ? "test_series" : type;
    if (!signedIn) { router.push(`/login?next=/checkout/${checkoutPath}/${itemId}`); return; }
    try {
      const data = await call({ action: "create" });
      if (data.mode === "free") { router.push("/student/my-purchases"); return; }
      if (data.mode === "demo") {
        setInfo("Demo checkout is active because Razorpay keys are not configured. No real money is collected. Confirming on the server…");
        await call({ action: "verify-demo", paymentId: data.paymentId, demoToken: data.demoToken });
        router.push("/student/my-purchases");
        return;
      }
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Razorpay could not load"));
        document.body.appendChild(script);
      });
      const checkout = new window.Razorpay({
        key: data.keyId, amount: data.amount, currency: "INR", name: "AJ Classes", description: data.description, order_id: data.orderId,
        handler: async (response: any) => {
          await call({ action: "verify-razorpay", paymentId: data.paymentId, orderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, signature: response.razorpay_signature });
          router.push("/student/my-purchases");
        },
      });
      checkout.open();
    } catch (err) { setError(err instanceof Error ? err.message : "Payment failed"); }
  }

  return (
    <div className="mt-6">
      <p className="font-display text-3xl font-bold text-orange">{inr(quote?.amount ?? listPrice)}</p>
      {quote?.discount ? <p className="text-sm text-slate-500">Discount {inr(quote.discount)}</p> : null}
      {type === "book" ? (
        <div className="mt-6 grid gap-3">
          <p className="text-sm font-semibold text-plum">Delivery address</p>
          <input className="field" placeholder="Full name" value={shipping.name} onChange={(event) => setShipping({ ...shipping, name: event.target.value })} />
          <input className="field" placeholder="Mobile number" value={shipping.phone} onChange={(event) => setShipping({ ...shipping, phone: event.target.value })} />
          <input className="field" placeholder="Address line 1" value={shipping.line1} onChange={(event) => setShipping({ ...shipping, line1: event.target.value })} />
          <input className="field" placeholder="Address line 2 (optional)" value={shipping.line2} onChange={(event) => setShipping({ ...shipping, line2: event.target.value })} />
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="field" placeholder="City" value={shipping.city} onChange={(event) => setShipping({ ...shipping, city: event.target.value })} />
            <input className="field" placeholder="State" value={shipping.state} onChange={(event) => setShipping({ ...shipping, state: event.target.value })} />
            <input className="field" placeholder="PIN code" value={shipping.pincode} onChange={(event) => setShipping({ ...shipping, pincode: event.target.value })} />
          </div>
        </div>
      ) : null}
      <form onSubmit={onQuote} className="mt-6 flex gap-2"><input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Coupon code" className="field" /><button className="btn-line">Apply</button></form>
      {error ? <p className="mt-4 text-sm font-semibold text-red-700">{error}</p> : null}
      {info ? <p className="mt-4 text-sm font-semibold text-plum">{info}</p> : null}
      {!signedIn ? <p className="mt-4 text-sm">Sign in as a student to complete this purchase.</p> : null}
      <button onClick={pay} className="btn-orange mt-6">{signedIn ? (type === "book" ? "Pay and ship" : "Buy Now") : "Sign in to buy"}</button>
    </div>
  );
}
