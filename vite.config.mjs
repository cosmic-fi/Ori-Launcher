import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: './',
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-ui': ['svelte'],
          'vendor-utils': ['electron'],
          // App chunks
          'components': [
            './src/app/components/layouts/MainContent.svelte',
            './src/app/components/model/AccountAdder.svelte',
            './src/app/components/ui/AccountManager.svelte',
            './src/app/components/ui/Launch.svelte',
            './src/app/components/ui/SkinViewer.svelte'
          ],
          'stores': [
            './src/app/stores/account.js',
            './src/app/stores/ui.js'
          ],
          'utils': [
            './src/app/utils/bootUpManager.js',
            './src/app/utils/discordRPCManager.js'
          ]
        }
      }
    }
  }
})
