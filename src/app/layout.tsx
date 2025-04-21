import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.scss";
import Link from "next/link";
import QueryProvider from "@/providers/QueryProvider"; // Import the provider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Match Stats - Futball mérkőzés előrejelzések",
  description:
    "Európai futballligák soron következő mérkőzéseinek gól és nyerési esélyei",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='hu'>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header className='app-header'>
          <div className='container'>
            <div className='flex justify-between items-center'>
              <Link href='/'>
                <h1 className='logo'>Match Stats</h1>
              </Link>
              <nav>
                <ul className='nav-links'>
                  <li>
                    <Link href='/'>Közelgő meccsek</Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </header>
        <main className='container'>
          <QueryProvider>{children}</QueryProvider>
        </main>
        <footer className='app-footer'>
          <div className='container'>
            <p>
              © {new Date().getFullYear()} Match Stats | Az adatok forrása:{" "}
              <a
                href='https://www.football-data.org/'
                target='_blank'
                rel='noopener noreferrer'
              >
                Football-Data.org
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
