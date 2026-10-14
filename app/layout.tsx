import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TOP SPORTS · Club-Cockpit",
  description: "Die zentrale Startseite für unsere Clubs. Tools und Vertragszahlen an einem Ort.",
  robots: { index: false, follow: false },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
