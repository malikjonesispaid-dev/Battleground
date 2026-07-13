import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Viral Content Studio",
  description: "Idea-to-post content pipeline for pages you manage.",
};

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/clients", label: "Clients & Pages" },
  { href: "/compose", label: "Compose" },
  { href: "/posts", label: "Posts" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 dark:border-white/10">
          <nav className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-4 text-sm">
            <span className="font-semibold">Viral Content Studio</span>
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="opacity-70 hover:opacity-100">
                {link.label}
              </a>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
