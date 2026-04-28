import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

function removeConsolePlugin() {
  return {
    name: 'remove-console',
    apply: 'build',
    transform(code, id) {
      if (!id.match(/\.js$/)) return
      if (id.includes('node_modules')) return

      code = code.replace(/console\.(log|warn|error|info|debug)\s*\(([^)]*)\)/g, 'void 0')

      return code
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    removeConsolePlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false
      }
    }
  }
})