import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: { default: "دوري المدرسة", template: "%s | دوري المدرسة" },
  description: "نتائج وترتيب دوري المدرسة - كرة القدم والكرة الطائرة",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f1b4d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="py-8 text-center text-xs text-slate-400">دوري المدرسة © {new Date().getFullYear()}</footer>
      </body>
    </html>
  );
}
