import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import CookieConsent from "@/components/ui/CookieConsent";

export const metadata: Metadata = {
  title: {
    default: "Brain Circuit – NEET & JEE Exam Simulator",
    template: "%s | Brain Circuit",
  },
  description:
    "Practice NEET & JEE with realistic mock tests, instant analytics, and live leaderboards. Crack your exam with Brain Circuit.",
  keywords: ["NEET", "JEE", "exam prep", "quiz", "mock test", "Brain Circuit"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Brain Circuit",
  },
  openGraph: {
    title: "Brain Circuit – NEET & JEE Exam Simulator",
    description: "Practice NEET & JEE with realistic mock tests.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#7e22ce",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
          <CookieConsent />
        </QueryProvider>
      </body>
    </html>
  );
}
