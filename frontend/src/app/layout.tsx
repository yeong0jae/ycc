import type { Metadata } from "next";
import { Archivo_Black, Noto_Sans_KR, Nunito } from "next/font/google";
import { AccountSync } from "@/components/account-sync";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  weight: ["400", "500", "700"],
  preload: false,
});

const nunito = Nunito({
  variable: "--font-nunito",
  weight: ["800", "900"],
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "슬램",
  description: "다가오는 페스티벌과 콘서트를 한곳에서",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${nunito.variable} ${archivoBlack.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <AccountSync />
      </body>
    </html>
  );
}
