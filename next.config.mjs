/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Docker image copies `.next/standalone`, which only exists with this on.
  output: 'standalone',
  reactStrictMode: true,
  // This repo keeps its own docs - do not scaffold AGENTS.md/CLAUDE.md.
  agentRules: false,
  // Keeps the dev-mode overlay badge out of captured screenshots.
  devIndicators: false
};

export default nextConfig;
