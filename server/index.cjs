const express = require('express')
const cors = require('cors')

const PORT = process.env.PORT || 3000

const products = {
  meepo: { users: 0 },
  kenangan: { users: 0 },
  quantumbyte: { users: 0 },
  nexius: { users: 0 },
}

const clients = new Set()

const app = express()
app.use(cors())
app.use(express.json())

const serializeUsers = () =>
  Object.fromEntries(Object.entries(products).map(([id, value]) => [id, value.users]))

const broadcast = (event) => {
  const payload = JSON.stringify(event)
  for (const res of clients) {
    res.write(`data: ${payload}\n\n`)
  }
}

app.get('/api/state', (req, res) => {
  res.json({ users: serializeUsers() })
})

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  res.write(`data: ${JSON.stringify({ type: 'snapshot', users: serializeUsers(), timestamp: Date.now() })}\n\n`)

  clients.add(res)

  req.on('close', () => {
    clients.delete(res)
    res.end()
  })
})

app.post('/api/products/:id/hit', (req, res) => {
  const { id } = req.params
  const product = products[id]
  if (!product) {
    res.status(404).json({ error: 'Unknown product' })
    return
  }

  product.users += 1
  const event = { type: 'increment', productId: id, users: product.users, timestamp: Date.now() }
  broadcast(event)
  res.json(event)
})

app.post('/api/reset', (req, res) => {
  for (const product of Object.values(products)) {
    product.users = 0
  }
  const snapshot = { type: 'snapshot', users: serializeUsers(), timestamp: Date.now() }
  broadcast(snapshot)
  res.json(snapshot)
})

app.get('/', (req, res) => {
  res.json({ status: 'ok', products: serializeUsers() })
})

app.listen(PORT, () => {
  console.log(`Mock sales server listening on http://localhost:${PORT}`)
})
