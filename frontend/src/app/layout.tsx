import type { Metadata } from "next";
import { Black_Han_Sans, IBM_Plex_Mono, IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";

const blackHanSans = Black_Han_Sans({
  variable: "--font-black-han-sans",
  weight: "400",
  preload: false,
});

const plexSansKr = IBM_Plex_Sans_KR({
  variable: "--font-plex-sans-kr",
  weight: ["400", "600"],
  preload: false,
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: "500",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "콘서트 모아보기",
  description: "다가오는 콘서트를 한곳에서",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${blackHanSans.variable} ${plexSansKr.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
