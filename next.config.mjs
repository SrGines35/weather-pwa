import withPWAInit from "@ducanh2912/next-pwa";

// @ducanh2912/next-pwa genera el Service Worker con un plugin de webpack.
// En Next.js 16 `next build` usa Turbopack por defecto, así que el script
// "build" de package.json usa `next build --webpack` para que el SW se genere.
// En la v10 del paquete, `skipWaiting` va dentro de `workboxOptions`.
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Opciones generadas por create-next-app (se conservan).
  cacheComponents: true,
  partialPrefetching: true,
  // Tailwind se procesa con PostCSS (postcss.config.mjs), que funciona igual
  // con Turbopack (dev) y con webpack (build de producción).
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "openweathermap.org",
      },
    ],
  },
};

export default withPWA(nextConfig);
