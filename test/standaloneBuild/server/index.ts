import express from 'express'
import { renderPage } from 'vike/server'
import { telefunc } from 'telefunc'
import { root } from './root'

// Caught before / after server start
// foo;

startServer()

// setTimeout(() => {
//   throw new Error("I'm caught")
// }, 2000)
// setTimeout(() => {
//   ;(async () => {
//     throw new Error("I'm caught as well")
//   })()
// }, 2000)

async function startServer() {
  const app = express()

  if (import.meta.env.PROD) {
    app.use(express.static(`${root}/client`))
  }

  app.use(express.text()) // Parse & make HTTP request body available at `req.body`
  app.all('/_telefunc', async (req, res) => {
    const context = {}
    const httpResponse = await telefunc({ url: req.originalUrl, method: req.method, body: req.body, context })
    const { body, statusCode, contentType } = httpResponse
    res.status(statusCode).type(contentType).send(body)
  })

  app.get('*', async (req, res, next) => {
    // Caught as well
    // foo;

    const pageContextInit = {
      urlOriginal: req.originalUrl
    }
    const pageContext = await renderPage(pageContextInit)
    const { httpResponse } = pageContext
    if (!httpResponse) {
      return next()
    } else {
      const { statusCode, headers } = httpResponse
      headers.forEach(([name, value]) => res.setHeader(name, value))
      res.status(statusCode)
      httpResponse.pipe(res)
    }
  })

  const port = process.env.PORT || 3000
  app.listen(port)
  console.log(`Server running at http://localhost:${port}`)
}
