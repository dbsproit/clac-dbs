/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prisma's custom-output client (src/generated/prisma) ships its own query
  // engine binary; Next's serverless file tracing doesn't always pick that up
  // automatically, so it's included explicitly to avoid it going missing in
  // deployed API routes (each route hits Prisma via src/lib/prisma.ts).
  outputFileTracingIncludes: {
    "/api/**/*": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;
