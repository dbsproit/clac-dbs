/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Prisma's custom-output client (src/generated/prisma) ships its own
    // query engine binary; Next 14's serverless file tracing doesn't pick
    // that up automatically, so it's included explicitly. (This option is
    // stable/top-level in Next 15, but still experimental-only in Next 14.)
    outputFileTracingIncludes: {
      "/api/**/*": ["./src/generated/prisma/**/*"],
    },
  },
};

export default nextConfig;
