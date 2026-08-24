import type { Metadata } from "next";
import { Inter, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SKPProvider } from "@/lib/store";

const inter = Inter({ subsets: ["latin"], variable: "--font-sofia-pro", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-p22-mackinac-pro", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400","500","600"], variable: "--font-ibm-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: "SKP — Manajemen Sasaran Kinerja Pegawai",
  description: "Sistem cascading kinerja hierarkis — User Interviews visual language on warm paper",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} ${sourceSerif.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f2f8f7]"><SKPProvider>{children}</SKPProvider></body>
    </html>
  );
}
