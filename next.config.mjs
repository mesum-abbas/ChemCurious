/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors now fail the build (the codebase type-checks cleanly), so a broken
  // change can't silently ship to Vercel.
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Sequelize + mysql2 must stay as Node externals (not bundled) for Turbopack/Vercel functions.
  serverExternalPackages: ["sequelize", "mysql2"],
  async headers() {
    return [
      {
        // The service worker must always be revalidated, or browsers can keep running an old
        // worker (and its caching rules) after a deploy.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
