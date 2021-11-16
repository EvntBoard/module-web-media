import path from 'path'
import legacy from '@vitejs/plugin-legacy'

export default {
  server: {
    port: 5010
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  build: {
    outDir: path.join(__dirname, "dist", "module"),
  }
}