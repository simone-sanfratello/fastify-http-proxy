'use strict'

const t = require('tap')
const { once } = require('node:events')

const Fastify = require('fastify')
const fastifyWebSocket = require('@fastify/websocket')
const proxy = require('..')
const WebSocket = require('ws')
const got = require('got')
const { convertUrlToWebSocket } = require('../utils')

const level = 'warn'

async function proxyServer (t, backendURL, backendPath, proxyOptions, wrapperOptions) {
  const frontend = Fastify({ logger: { level } })
  const registerProxy = async fastify => {
    fastify.register(proxy, {
      upstream: backendURL + backendPath,
      http: true,
      ...proxyOptions
    })
  }

  t.comment('starting proxy to ' + backendURL + backendPath)

  if (wrapperOptions) {
    await frontend.register(registerProxy, wrapperOptions)
  } else {
    await registerProxy(frontend)
  }

  return [frontend, await frontend.listen({ port: 0, host: '127.0.0.1' })]
}

async function processRequest (t, frontendURL, path, expected) {
  const url = new URL(path, frontendURL)
  t.comment('ws connecting to ' + url.toString())
  const wsUrl = convertUrlToWebSocket(url.href)
  const ws = new WebSocket(wsUrl)
  let wsResult, gotResult

  try {
    await once(ws, 'open')
    t.pass('socket connected')

    const [buf] = await Promise.race([once(ws, 'message'), once(ws, 'close')])
    if (buf instanceof Buffer) {
      wsResult = buf.toString()
    } else {
      t.comment('websocket closed')
      wsResult = 'error'
    }
  } catch {
    wsResult = 'error'
    ws.terminate()
  }

  try {
    const result = await got(url)
    gotResult = result.body
  } catch {
    gotResult = 'error'
  }

  t.equal(wsResult, expected)
  t.equal(gotResult, expected)
}

async function handleProxy (info, { backendPath, proxyOptions, wrapperOptions }, expected, ...paths) {
  t.test(info, async function (t) {
    const backend = Fastify({ logger: { level } })
    await backend.register(fastifyWebSocket)

    backend.get('/*', {
      handler: (req, reply) => {
        reply.send(req.url)
      },
      wsHandler: (socket, req) => {
        socket.send(req.url)

        socket.once('message', () => {
          socket.close()
        })
      }
    })

    t.teardown(async () => {
      await backend.close()
      t.comment('backend closed')
    })

    const backendURL = await backend.listen({ port: 0, host: '127.0.0.1' })

    const [frontend, frontendURL] = await proxyServer(t, backendURL, backendPath, proxyOptions, wrapperOptions)

    t.teardown(async () => {
      await frontend.close()
      t.comment('frontend closed')
    })

    for (const path of paths) {
      await processRequest(t, frontendURL, path, expected(path))
    }

    t.end()
  })
}

handleProxy(
  'no prefix to `/`',
  {
    backendPath: '/',
    proxyOptions: { websocket: true }
  },
  path => path,
  '/',
  '/pub',
  '/pub/'
)

handleProxy(
  '`/pub/` to `/`',
  {
    backendPath: '/',
    proxyOptions: { websocket: true, prefix: '/pub/' }
  },
  path => path.startsWith('/pub/') ? path.replace('/pub/', '/') : 'error',
  '/',
  '/pub/',
  '/pub/test'
)

handleProxy(
  '`/pub/` to `/public/`',
  {
    backendPath: '/public/',
    proxyOptions: { websocket: true, prefix: '/pub/' }
  },
  path => path.startsWith('/pub/') ? path.replace('/pub/', '/public/') : 'error',
  '/',
  '/pub/',
  '/pub/test'
)

handleProxy(
  'wrapped `/pub/` to `/public/`',
  {
    backendPath: '/public/',
    proxyOptions: { websocket: true },
    wrapperOptions: { prefix: '/pub/' }
  },
  path => path.startsWith('/pub/') ? path.replace('/pub/', '/public/') : 'error',
  '/',
  '/pub/',
  '/pub/test'
)
