import "./globals.css";
import localFont from "next/font/local";
import SiteErrorReporter from "@/components/SiteErrorReporter";
import SessionKeeper from "@/components/SessionKeeper";
import AppToaster from "@/components/AppToaster";

const inter = localFont({
  src: [
    {
      path: "../../public/fonts/Inter-VariableFont_opsz,wght.ttf",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export const metadata = {
  title: "AI Bot for NCLEX Prep",
  description: "AI Bot for NCLEX Prep",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <SiteErrorReporter />
        <SessionKeeper />
        <AppToaster />
        {children}
      </body>
    </html>
  );
}
