import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
const API_PROXY_TARGET = process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8787';

export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/kimi': {
        target: 'https://api.kimi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kimi/, ''),
        headers: {
          'User-Agent': 'claude-code/1.0.0',
        },
      },
      '/ollama': {
        target: 'https://ollama.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama/, ''),
      },
      '/mistral': {
        target: 'https://api.mistral.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mistral/, ''),
      },
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
});
