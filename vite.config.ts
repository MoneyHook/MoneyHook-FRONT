import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'firebase',
              test: /node_modules[\\/](?:@firebase|firebase)[\\/]/,
              priority: 10,
            },
            {
              name: 'react-platform',
              test:
                /node_modules[\\/](?:@tanstack|react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
              priority: 5,
            },
            {
              name: 'ui',
              test:
                /node_modules[\\/](?:@radix-ui|lucide-react|next-themes|radix-ui|sonner)[\\/]/,
              priority: 4,
            },
          ],
        },
      },
    },
  },
})
