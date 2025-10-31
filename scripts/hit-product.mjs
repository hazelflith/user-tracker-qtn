import http from 'node:http'
import https from 'node:https'
import { URL } from 'node:url'

const BASE = process.env.API_BASE ?? 'http://localhost:3000'
const PRODUCT = process.argv[2]
const COUNT = Number(process.argv[3] ?? '1')

if (!PRODUCT) {
  console.error('Usage: node scripts/hit-product.mjs <productId> [count=1]')
  process.exit(1)
}

const url = new URL(`/api/products/${PRODUCT}/hit`, BASE)
const client = url.protocol === 'https:' ? https : http

const hitOnce = () =>
  new Promise((resolve, reject) => {
    const req = client.request(
      {
        method: 'POST',
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        protocol: url.protocol,
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(Buffer.concat(chunks).toString('utf-8'))
          } else {
            reject(new Error(`Request failed with status ${res.statusCode}: ${Buffer.concat(chunks).toString('utf-8')}`))
          }
        })
      },
    )

    req.on('error', reject)
    req.write('')
    req.end()
  })

for (let i = 0; i < COUNT; i += 1) {
  try {
    const result = await hitOnce()
    console.log(`[${i + 1}/${COUNT}]`, result)
  } catch (error) {
    console.error(`[${i + 1}/${COUNT}]`, error.message)
    process.exit(1)
  }
}

