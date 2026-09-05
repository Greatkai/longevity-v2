/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // 支持通过环境变量自定义构建输出目录（默认 .next）
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  experimental: {
    // Next 14：让 pg 作为服务端外部包，避免被打包进浏览器 bundle
    serverComponentsExternalPackages: ["pg"],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { pg: "commonjs pg" }];
    return config;
  },
};

export default nextConfig;
