import { createServer } from 'vite'
import { devServerPlugin } from './devServerPlugin.js'

createServer({
  plugins: [devServerPlugin()]
})
