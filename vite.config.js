import legacy from '@vitejs/plugin-legacy'

export default {
  server: {
    port: 5010
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ]
}