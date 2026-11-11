import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Movie Memory — The films that stay with you",
  description: "Your favorite film, with a new story to discover.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
