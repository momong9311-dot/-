import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MERCI MOMONG — Self Check-In",
  description: "MERCI MOMONG 셀프 체크인 키오스크와 직원 현황판",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Montserrat:wght@400;500&family=Noto+Sans+KR:wght@300;400;500;700&family=Noto+Serif+KR:wght@300;400&display=swap"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
