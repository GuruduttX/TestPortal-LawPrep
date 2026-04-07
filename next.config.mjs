import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Large native deps: keep external so dev compile stays lighter
  serverExternalPackages: ['mongoose'],

  turbopack: {
    // If you use `npm run dev:turbo`, pin root so Next never treats $HOME as the app (can freeze macOS from file watching).
    root: projectRoot,
  },

  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/.turbo/**',
        ],
        aggregateTimeout: 500,
        followSymlinks: false,
      };
    }
    return config;
  },
};

export default nextConfig;
