import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { CheckoutBox } from "@/components/checkout-box";
import { getSession } from "@/lib/auth";
import { getSellable } from "@/lib/content";
import { ready } from "@/lib/db";
import { inr } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

export default async function CheckoutPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  await ready();
  const { type, id } = await params;
  const kind = type === "test_series" ? "test_series" : type === "book" ? "book" : "batch";
  const item = await getSellable(kind, id);
  if (!item || Number(item.price_paise) <= 0) notFound();
  const session = await getSession();
  const title = kind === "batch" ? `${item.course_name} · ${item.name}` : item.title;
  return (
    <>
      <PageHero kicker="Checkout" title="Confirm your purchase" text={kind === "book" ? "Printed books are packed and sent to the delivery address you enter. This is a physical shipment, not an online download." : "Pay for a published batch or test series. Access opens in the student portal after payment."} />
      <section className="bg-paper py-16">
        <div className="container-aj max-w-xl">
          <article className="card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange">{kind === "book" ? "Physical shipping" : item.category_name || item.course_name || "AJ Classes"}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-plum">{title}</h2>
            {item.faculty_name ? <p className="mt-1 text-sm text-slate-500">{item.faculty_name}</p> : null}
            {kind === "book" ? <p className="mt-2 text-sm text-slate-600">{Number(item.stock) > 0 ? `${item.stock} copies in stock. Courier delivery after payment.` : "This book is out of stock."}</p> : null}
            {item.compare_at_paise > item.price_paise ? <p className="mt-3 text-sm text-slate-400 line-through">{inr(item.compare_at_paise)}</p> : null}
            {kind === "book" && Number(item.stock) <= 0 ? <Link href="/books" className="btn-line mt-6">Back to books</Link> : <CheckoutBox type={kind} itemId={item.id} title={title} listPrice={Number(item.price_paise)} signedIn={session?.role === "student"} />}
            <p className="mt-4 text-sm"><Link className="font-semibold text-purple" href={kind === "book" ? "/books" : "/shop"}>{kind === "book" ? "Back to books" : "Back to our batches"}</Link></p>
          </article>
        </div>
      </section>
    </>
  );
}
