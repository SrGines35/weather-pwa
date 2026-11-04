import "./globals.css";

// El manifest se genera desde app/manifest.js y Next.js inserta
// automáticamente <link rel="manifest" href="/manifest.webmanifest">,
// por eso no se repite aquí.
export const metadata = {
  title: "WeatherPWA",
  description:
    "Consulta el clima en tiempo real por ciudad o con tu ubicación actual. Aplicación web progresiva instalable.",
  applicationName: "WeatherPWA",
  appleWebApp: {
    capable: true,
    title: "WeatherPWA",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/clima-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/clima-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/clima-152x152.png", sizes: "152x152", type: "image/png" }],
  },
};

export const viewport = {
  themeColor: "#38bdf8",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-slate-900 text-slate-100">{children}</body>
    </html>
  );
}
