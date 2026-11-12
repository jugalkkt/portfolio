import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { copy } from "@/content/copy";
import "./globals.css";

export const metadata: Metadata = {
  title: copy.siteTitle,
  description: copy.metaDescription,
};

export const viewport: Viewport = {
  themeColor: "#06080C",
  colorScheme: "dark",
};

/** Applies a saved "Pause animations" choice before first paint, so CSS motion never starts. */
const motionBootstrap = `try{if(localStorage.getItem("jk:motion-paused")==="1")document.documentElement.dataset.motion="paused"}catch(e){}`;

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
