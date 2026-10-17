import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "페스티벌 모아보기",
  description: "다가오는 국내 페스티벌을 한곳에서",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
