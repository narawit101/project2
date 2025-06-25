// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api-sport-hub.up.railway.app/:path*", // backend Railway
      },
    ];
  },
};

module.exports = nextConfig;
