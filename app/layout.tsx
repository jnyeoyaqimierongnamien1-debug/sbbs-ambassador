import type { Metadata, Viewport } from "next";
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
  title: "SBBS Ambassador",
  description: "Plateforme de gestion du réseau ambassadeurs SBBS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SBBS Ambassador",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "SBBS Ambassador",
    title: "SBBS Ambassador",
    description: "Plateforme de gestion du réseau ambassadeurs SBBS",
  },
};

export const viewport: Viewport = {
  themeColor: "#1A3A6C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SBBS Ambassador" />
        <link rel="apple-touch-icon" href="/LOGO%20SBBS%20PNG.webp" />
        <meta name="msapplication-TileColor" content="#1A3A6C" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW enregistré:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('SW erreur:', error);
                    });
                });
              }
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
