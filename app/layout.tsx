import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./focus-controls.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const deploymentUrl =
  process.env.SITE_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.VERCEL_URL;

const metadataBase = new URL(
  deploymentUrl
    ? deploymentUrl.startsWith("http")
      ? deploymentUrl
      : `https://${deploymentUrl}`
    : "http://localhost:3000",
);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Lenshift — See the world through different eyes",
    template: "%s — Lenshift",
  },
  description:
    "Explore how myopia, hyperopia, and astigmatism can change the way the world looks in an interactive vision simulator.",
  applicationName: "Lenshift",
  keywords: [
    "vision simulator",
    "myopia simulator",
    "hyperopia simulator",
    "astigmatism simulator",
    "eyesight",
    "prescription lenses",
  ],
  category: "education",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Lenshift",
    title: "Lenshift — Same world. Different reality.",
    description:
      "Borrow another pair of eyes and explore how different prescriptions can reshape the same scene.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lenshift — Same world. Different reality.",
    description:
      "Borrow another pair of eyes and explore how different prescriptions can reshape the same scene.",
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
