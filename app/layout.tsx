import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/navigation/BottomNav";
import InstallAppBanner from "@/components/ui/InstallAppBanner";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthModal from "@/components/modals/AuthModal";
import AuthStatusBadge from "@/components/navigation/AuthStatusBadge";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "LEVL Protocols",
    template: "%s | LEVL Protocols",
  },
  description: "Longevity Protocol Engine & Multi-System Biological Optimization",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LEVL",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/apple-touch-icon-120x120.png", sizes: "120x120", type: "image/png" },
    ],
    shortcut: "/icons/icon-192x192.png",
  },
};

import TopStickyHeader from "@/components/navigation/TopStickyHeader";
import { TopPhotonProgressBar } from "@/components/ui/TopPhotonProgressBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen pb-16 md:pb-0 md:flex relative`} suppressHydrationWarning>
        <AuthProvider>
          <TopPhotonProgressBar />
          {/* Background Glowing Orbs */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] bg-sky-500/20 blur-[100px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] h-[80vw] max-w-[1000px] max-h-[1000px] bg-blue-600/15 blur-[120px] rounded-full" />
          </div>

          {/* Desktop Sidebar */}
          <aside className="hidden md:flex flex-col w-64 border-r border-levl-border p-4 h-screen sticky top-0 bg-slate-950/60 backdrop-blur-md z-40">
            <div className="mb-6 pt-1 px-1 flex items-center justify-between">
              <img 
                src="/logo.png" 
                alt="LEVL Protocols" 
                className="h-8 w-auto object-contain"
              />
              <AuthStatusBadge />
            </div>
            <nav className="space-y-4 text-levl-text-secondary flex-1">
              <a href="/today" className="block hover:text-white transition-colors">Today</a>
              <a href="/schedule" className="block hover:text-white transition-colors">Schedule</a>
              <a href="/bench" className="block hover:text-white transition-colors">Bench</a>
              <a href="/aging" className="block hover:text-white transition-colors flex items-center gap-1.5"><span className="text-levl-accent">⚡</span> Biological Aging</a>
              <a href="/tracking" className="block hover:text-white transition-colors">Tracking</a>
              <a href="/coach" className="block hover:text-white transition-colors text-levl-accent font-medium flex items-center"><span className="mr-2">✦</span> Coach</a>
              <a href="/explore" className="block hover:text-white transition-colors">Explore</a>
              <a href="/settings" className="block hover:text-white transition-colors">Profile</a>
            </nav>
          </aside>

          {/* Dynamic Mobile Top Header */}
          <TopStickyHeader />

          {/* Main Content Area */}
          <main className="flex-1 min-h-screen min-w-0 w-full overflow-x-hidden pt-[calc(env(safe-area-inset-top,0px)+52px)] md:pt-0">
            {children}
          </main>

          <InstallAppBanner />
          <AuthModal />
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
