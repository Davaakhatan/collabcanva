import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/database'],
          'konva-vendor': ['konva', 'react-konva'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1000 KB to suppress warnings for now
  },
})
