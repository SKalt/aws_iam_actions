import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AWS IAM actions",
  description: "Search for AWS IAM actions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="justify-between p-1 sticky top-0">
          <Link className="m-1" href="/">
            Home
          </Link>
          <Link className="m-1" href="/about">
            About
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
