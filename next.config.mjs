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
};

export default nextConfig;
