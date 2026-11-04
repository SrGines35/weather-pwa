export default function manifest() {
  return {
    name: "WeatherApp PWA",
    short_name: "WeatherPWA",
    description: "Pronóstico del clima PWA en Next.js",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#38bdf8",
    icons: [
      {
        src: "/icons/clima-72x72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "/icons/clima-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/icons/clima-128x128.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "/icons/clima-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "/icons/clima-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        src: "/icons/clima-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/clima-384x384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/icons/clima-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
