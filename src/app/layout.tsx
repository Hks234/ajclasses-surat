import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import { ready } from "@/lib/db";
import { getBranding, getSettings, getTheme } from "@/lib/content";
import { pageUrl } from "@/lib/utils";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    await ready();
    const settings = await getSettings();
    const branding = await getBranding();
    return {
      metadataBase: new URL(pageUrl()),
      title: { default: settings.seo_title || "AJ Classes", template: "%s · AJ Classes" },
      description: settings.seo_description,
      icons: { icon: branding.favicon || "/icon.svg" },
      openGraph: { title: settings.seo_title || "AJ Classes", description: settings.seo_description, url: pageUrl(), siteName: "AJ Classes", type: "website" },
      alternates: { canonical: pageUrl() },
    };
  } catch {
    return { title: "AJ Classes", description: "AJ Classes" };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let theme = {
    plum: "#071A36",
    purple: "#1A4BCC",
    orange: "#EE8F22",
    plumRgb: "7 26 54",
    purpleRgb: "26 75 204",
    orangeRgb: "238 143 34",
  };
  try {
    await ready();
    theme = await getTheme();
  } catch {}
  return (
    <html lang="en" className={`${poppins.variable} ${montserrat.variable}`} data-scroll-behavior="smooth">
      <body
        className={`${montserrat.className} ${poppins.variable} antialiased`}
        style={{
          ["--plum" as string]: theme.plum,
          ["--purple" as string]: theme.purple,
          ["--orange" as string]: theme.orange,
          ["--plum-rgb" as string]: theme.plumRgb,
          ["--purple-rgb" as string]: theme.purpleRgb,
          ["--orange-rgb" as string]: theme.orangeRgb,
        }}
      >
        {children}
      </body>
    </html>
  );
}
