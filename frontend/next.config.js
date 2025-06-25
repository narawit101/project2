/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api-sport-hub.up.railway.app/:path*", // <-- เป๊ะ
      },
    ];
  },
};

module.exports = nextConfig;
