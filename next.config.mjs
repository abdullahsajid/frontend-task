/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    config.externals.push({ canvas: 'commonjs canvas' })
    return config
  },
  //   images: {
  //     remotePatterns: [
  //       {
  //         protocol: "https",
  //         hostname: "example.com",
  //         port: "",
  //         pathname: "/account123/**",
  //       },
  //     ],
  //   },
};

export default nextConfig;
