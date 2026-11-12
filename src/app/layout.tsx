import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { copy } from "@/content/copy";
import { identity } from "@/content/resume";
import { siteUrl } from "@/content/site";
import "./globals.css";

// Self-hosted at build time, Latin subset only (§9.1).
const GeistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const GeistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const ogImage = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  alt: `${identity.name} — ${identity.headline}`,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: copy.siteTitle,
  description: copy.metaDescription,
  applicationName: identity.name,
  authors: [{ name: identity.name, url: `${siteUrl}/` }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    url: "/",
    siteName: identity.name,
    title: copy.siteTitle,
    description: copy.metaDescription,
    locale: "en_US",
    firstName: "Jugal",
    lastName: "Kakkat",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: copy.siteTitle,
    description: copy.metaDescription,
    images: [ogImage],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#06080C",
  colorScheme: "dark",
};

/**
 * Before first paint: applies a saved "Pause animations" choice, so CSS motion never starts,
 * and skips the boot screen on repeat visits within the same tab session.
 */
const motionBootstrap = `try{var d=document.documentElement.dataset;if(localStorage.getItem("jk:motion-paused")==="1")d.motion="paused";if(sessionStorage.getItem("jk:intro"))d.intro="off";else sessionStorage.setItem("jk:intro","1")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionBootstrap }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
