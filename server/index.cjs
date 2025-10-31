const express = require('express')
const cors = require('cors')
const { MongoClient } = require('mongodb')

const PORT = process.env.PORT || 3000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017'
const MONGO_DB = process.env.MONGO_DB || 'user-tracker'
const COLLECTION_NAME = process.env.MONGO_COLLECTION || 'products'

const PRODUCT_IDS = ['meepo', 'kenangan', 'quantumbyte', 'nexius']

const clients = new Set()
let collection

const normalizeUserValue = (value) => {
  if (value == null) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    try {
      return value.toNumber()
    } catch (error) {
      return Number.parseInt(value, 10) || 0
    }
  }
  if (typeof value === 'string') return Number.parseInt(value, 10) || 0
  return 0
}

const serializeUsers = async () => {
  const docs = await collection
    .find({ _id: { $in: PRODUCT_IDS } }, { projection: { users: 1 } })
    .toArray()

  const map = Object.fromEntries(PRODUCT_IDS.map((id) => [id, 0]))
  for (const doc of docs) {
    map[doc._id] = normalizeUserValue(doc.users)
  }
  return map
}

const broadcast = (event) => {
  const payload = `data: ${JSON.stringify(event)}\n\n`
  for (const res of clients) {
    res.write(payload)
  }
}

async function ensureSeedData() {
  const bulkOps = PRODUCT_IDS.map((id) => ({
    updateOne: {
      filter: { _id: id },
      update: { $setOnInsert: { users: 0 } },
      upsert: true,
    },
  }))
  if (bulkOps.length) {
    await collection.bulkWrite(bulkOps)
  }
}

async function main() {
  const client = new MongoClient(MONGO_URI)
  await client.connect()
  const db = client.db(MONGO_DB)
  collection = db.collection(COLLECTION_NAME)
  await ensureSeedData()

  const app = express()
  app.use(cors())
  app.use(express.json())

  app.get('/api/state', async (req, res) => {
    try {
      const users = await serializeUsers()
      res.json({ users })
    } catch (error) {
      console.error('Failed to fetch state', error)
      res.status(500).json({ error: 'Failed to fetch state' })
    }
  })

  app.get('/api/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders?.()

    try {
      const snapshot = await serializeUsers()
      res.write(`data: ${JSON.stringify({ type: 'snapshot', users: snapshot, timestamp: Date.now() })}\n\n`)
    } catch (error) {
      console.error('Failed to send snapshot', error)
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Unable to load snapshot' })}\n\n`)
    }

    clients.add(res)

    req.on('close', () => {
      clients.delete(res)
      res.end()
    })
  })

  app.post('/api/products/:id/hit', async (req, res) => {
    const { id } = req.params
    if (!PRODUCT_IDS.includes(id)) {
      res.status(404).json({ error: 'Unknown product' })
      return
    }

    try {
      const result = await collection.findOneAndUpdate(
        { _id: id },
        { $inc: { users: 1 } },
        { returnDocument: 'after', upsert: true },
      )

      if (!result.value) {
        const fallback = await collection.findOne({ _id: id })
        if (!fallback) {
          res.status(500).json({ error: 'Product could not be incremented' })
          return
        }
        result.value = fallback
      }

      const event = {
        type: 'increment',
        productId: id,
        users: normalizeUserValue(result.value.users),
        timestamp: Date.now(),
      }
      broadcast(event)
      res.json(event)
    } catch (error) {
      console.error('Failed to increment product', error)
      res.status(500).json({ error: 'Failed to increment product' })
    }
  })

  app.post('/api/reset', async (req, res) => {
    try {
      await collection.updateMany({ _id: { $in: PRODUCT_IDS } }, { $set: { users: 0 } })
      const snapshot = { type: 'snapshot', users: await serializeUsers(), timestamp: Date.now() }
      broadcast(snapshot)
      res.json(snapshot)
    } catch (error) {
      console.error('Failed to reset products', error)
      res.status(500).json({ error: 'Failed to reset products' })
    }
  })

  app.get('/', async (req, res) => {
    try {
      const users = await serializeUsers()
      res.json({ status: 'ok', users })
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch status' })
    }
  })

  app.listen(PORT, () => {
    console.log(`Mock sales server listening on http://localhost:${PORT}`)
  })

  process.on('SIGINT', async () => {
    await client.close()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await client.close()
    process.exit(0)
  })
}

main().catch((error) => {
  console.error('Fatal server error', error)
  process.exit(1)
})
