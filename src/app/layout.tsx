import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { DemoBar } from "@/components/demo/DemoBar";
import { DemoLeadGate } from "@/components/demo/DemoLeadGate";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QDX One — hiring built for restaurants",
  description:
    "Post your roles, let every applicant take a short assessment, and get a ranked shortlist — for part-time crew and full-time staff alike.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The demo strip + lead gate ride on every demo.qdx.one page.
  const isDemo = (await headers()).get("x-org-slug") === "demo";
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[color:var(--brand-cream)] text-[color:var(--brand-ink)]">
        {/* Keep the demo (fake data) out of search engines. */}
        {isDemo && <meta name="robots" content="noindex, nofollow" />}
        {isDemo && <DemoBar />}
        {children}
        {isDemo && <DemoLeadGate />}
      </body>
    </html>
  );
}
