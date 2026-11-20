import { PageHero } from "@/components/page-hero";
import { ShopGrid } from "@/components/shop-grid";
import { getCourses, getSettings, getShopItems } from "@/lib/content";
import { ready } from "@/lib/db";
import { publicBatchSubtitle, publicBatchTitle } from "@/lib/site-defaults";

export const metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  await ready();
  const [items, courses, settings] = await Promise.all([getShopItems(), getCourses(), getSettings()]);
  return (
    <>
      <PageHero kicker="Our Batches" title={publicBatchTitle(settings.shop_title)} text={publicBatchSubtitle(settings.shop_subtitle)} />
      <section className="bg-plum py-12">
        <div className="container-aj">
          <ShopGrid items={items} courses={courses} />
        </div>
      </section>
    </>
  );
}
