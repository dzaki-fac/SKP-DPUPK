import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { SKPProvider } from "@/lib/store";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", weight: ["400","500","600"] });
const roobert = Inter_Tight({ subsets: ["latin"], variable: "--font-roobert", display: "swap", weight: ["400"] });

export const metadata: Metadata = {
  title: "SKP — Manajemen Sasaran Kinerja Pegawai",
  description: "Sistem cascading kinerja hierarkis — Seline Analytics editorial language on warm stone canvas",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} ${roobert.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#fafaf9]"><SKPProvider>{children}</SKPProvider></body>
    </html>
  );
}
