import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vinticode",
    template: "%s · Vinticode",
  },
  description:
    "Build real intuition for data structures and algorithms, and code your way to mastery.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1015" },
  ],
};

/*
  Applies the persisted theme before first paint. Without this the page
  renders with the server default, then snaps to the user's theme once
  React hydrates — a visible white flash for dark-mode users on every
  navigation. Kept inline and dependency-free so it runs render-blocking.
*/
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("vinticode-theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="google-site-verification"
          content="L63uGSjv-ig202O9O7OB6XKbgHRQHhHyiKmkxhoJjNw"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              // Toasts previously used hardcoded #161b22, so they stayed
              // dark on a light page. Tokens keep them theme-aware.
              className:
                "!bg-popover !text-popover-foreground !border !border-border !shadow-md !rounded-lg !text-sm",
              duration: 3500,
              success: { iconTheme: { primary: "var(--success)", secondary: "var(--popover)" } },
              error: { iconTheme: { primary: "var(--destructive)", secondary: "var(--popover)" } },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
