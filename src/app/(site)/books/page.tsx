import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { getBooks } from "@/lib/content";
import { ready } from "@/lib/db";
import { inr } from "@/lib/utils";

export const metadata = { title: "Books" };
export const dynamic = "force-dynamic";

export default async function BooksPage() {
  await ready();
  const books = await getBooks();
  return (
    <>
      <PageHero kicker="Books" title="Study books" text="Printed books from AJ Classes for CA, CS and CMA. Each order is packed and sent to your address by physical shipping." />
      <section className="bg-paper py-12">
        <div className="container-aj grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {books.length ? books.map((book) => (
            <article key={book.id} className="card overflow-hidden">
              {book.image_url ? <img src={book.image_url} alt="" className="h-52 w-full object-cover" /> : <div className="flex h-40 items-center justify-center bg-plum font-display text-2xl font-semibold text-white">AJ Classes</div>}
              <div className="p-5">
                <h2 className="font-display text-xl font-semibold text-plum">{book.title}</h2>
                {book.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{book.description}</p> : null}
                <p className="mt-2 text-sm text-slate-500">{Number(book.stock) > 0 ? `${book.stock} copies ready to ship` : "Out of stock"}</p>
                {book.compare_at_paise > book.price_paise ? <p className="mt-3 text-sm text-slate-400 line-through">{inr(book.compare_at_paise)}</p> : null}
                <p className="text-2xl font-bold text-orange">{inr(book.price_paise)}</p>
                {Number(book.stock) > 0 ? <Link href={`/checkout/book/${book.id}`} className="btn-orange mt-4 inline-flex">Buy and ship</Link> : <Link href={`/enquiry?course=${encodeURIComponent(book.title)}`} className="btn-line mt-4 inline-flex">Enquire</Link>}
              </div>
            </article>
          )) : (
            <p className="card p-6 font-semibold text-ink md:col-span-2 xl:col-span-3">Books appear here after a title, price and stock are published from Admin → Books (sell). Delivery is by physical shipping.</p>
          )}
        </div>
      </section>
    </>
  );
}
