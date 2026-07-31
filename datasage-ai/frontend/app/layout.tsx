import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataSage AI — Chat with your data. Get insights in seconds.",
  description:
    "Upload a spreadsheet and get instant dashboards, AI-generated insights, and a natural-language analyst you can chat with.",
};

// Runs before paint to avoid a light/dark flash — reads the saved
// preference (or system default) and sets the class on <html>.
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('datasage-theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root { --font-display: 'Space Grotesk', sans-serif; --font-body: 'Inter', sans-serif; --font-mono: 'JetBrains Mono', monospace; }
        `}</style>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
