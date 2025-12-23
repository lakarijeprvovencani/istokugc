import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { DemoProvider } from "@/context/DemoContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DemoSwitcher from "@/components/DemoSwitcher";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "UGC Select - Pronađi savršene UGC kreatore",
  description: "Platforma koja povezuje brendove sa talentovanim UGC kreatorima. Pretražujte, kontaktirajte i sarađujte.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr">
      <body className={`${outfit.className} antialiased`} suppressHydrationWarning>
        <DemoProvider>
          <Header />
          <main className="pt-20 min-h-screen">
            {children}
          </main>
          <Footer />
          <DemoSwitcher />
        </DemoProvider>
      </body>
    </html>
  );
}
