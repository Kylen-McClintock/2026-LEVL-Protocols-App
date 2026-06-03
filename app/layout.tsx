import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/navigation/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LEVL Protocols",
  description: "Longevity protocol engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen pb-16 md:pb-0 md:flex`}>
        {/* Desktop Sidebar Stub */}
        <aside className="hidden md:flex flex-col w-64 border-r border-levl-border p-4 h-screen sticky top-0">
          <div className="text-xl font-bold mb-8 tracking-wider text-white">LEVL</div>
          <nav className="space-y-4 text-levl-text-secondary">
            <a href="/today" className="block hover:text-white transition-colors">Today</a>
            <a href="/weekly" className="block hover:text-white transition-colors">Weekly</a>
            <a href="/bench" className="block hover:text-white transition-colors">Bench</a>
            <a href="/explore" className="block hover:text-white transition-colors">Explore</a>
            <a href="/settings" className="block hover:text-white transition-colors">Settings</a>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-screen">
          {children}
        </main>

        <BottomNav />
      </body>
    </html>
  );
}
