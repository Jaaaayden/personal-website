import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import Nav from "@/components/nav/Nav";
import Footer from "@/components/footer/Footer";
import DeskScene from "@/components/desk/DeskScene";
import CosmeticsEffects from "@/components/effects/CosmeticsEffects";
import LoadingScreen from "@/components/loading/LoadingScreen";
import "./globals.css";

/** Runs before paint so a saved light-mode choice never flashes dark. */
const themeInitScript = `try{if(localStorage.getItem("jl-theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jayden Le",
  description:
    "just a place for me to yap about random stuff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the theme init script sets data-theme on
    // <html> before hydration, which the server render can't know about.
    <html
      lang="en"
      className={jetbrainsMono.variable}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <LoadingScreen />
        <Suspense fallback={null}>
          <Nav />
        </Suspense>
        {children}
        <Footer />
        <DeskScene />
        <CosmeticsEffects />
      </body>
    </html>
  );
}
