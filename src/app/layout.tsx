import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const displayFont = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const bodyFont = Inter({ subsets: ["latin"], variable: "--font-body" });
const monoFont = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "InboxOS — An AI command center for every inbox you run",
  description:
    "InboxOS scans every Gmail inbox you run, finds the deadlines buried inside them, and surfaces opportunities worth your attention.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            theme="dark"
            toastOptions={{
              style: { background: "#121C2E", color: "#EDEFF4", border: "1px solid #1F2B40" },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
