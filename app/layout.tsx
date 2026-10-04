import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { THEME_COLOR } from "@/lib/brand/tokens";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";
import "./globals.css";

/**
 * One family: Poppins (UI-UX.md §3).
 * 400 body · 600 label/heading · 700 heading · 800 display.
 * Italic is loaded for 800 (the display style, matching the wordmark) and for
 * 400/600/700 so emphasis inside body copy stays in-family rather than being
 * synthesised by the browser. Arial is the documented fallback.
 */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-poppins",
  fallback: ["Arial", "Helvetica", "sans-serif"],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  /* Makes every relative URL in metadata resolve against the right origin,
     so preview deploys do not advertise production URLs. */
  metadataBase: new URL(siteUrl()),
  title: {
    default: "OSP Tech — Turning Ideas Into Digital Solutions.",
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_TZ",
    title: "OSP Tech — Turning Ideas Into Digital Solutions.",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "OSP Tech — Turning Ideas Into Digital Solutions.",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/brand/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon/favicon-32x32.png", sizes: "32x32" },
      { url: "/brand/favicon/favicon-16x16.png", sizes: "16x16" },
    ],
    shortcut: "/brand/favicon/favicon.ico",
    apple: "/brand/favicon/apple-touch-icon.png",
  },
  manifest: "/brand/favicon/site.webmanifest",
};

export const viewport: Viewport = {
  // PWA/theme colour per UI-UX.md §2.1. The literal lives in lib/brand/tokens
  // because a <meta> tag cannot read a CSS custom property.
  themeColor: THEME_COLOR,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
