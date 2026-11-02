import type { Metadata } from "next";
import { Fraunces, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";
import { getLocale } from "@/lib/session";
import { vi } from "@/i18n/vi";
import { en } from "@/i18n/en";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "vietnamese"],
  style: ["italic", "normal"],
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lò · Ovenfloor portfolio",
  description: "Demo batch planning for a fictional HCMC bakery kitchen.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const dict = locale === "en" ? en : vi;

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${beVietnam.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink antialiased">
        <SiteHeader dict={dict} locale={locale} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
        <DisclaimerFooter locale={locale} />
      </body>
    </html>
  );
}
