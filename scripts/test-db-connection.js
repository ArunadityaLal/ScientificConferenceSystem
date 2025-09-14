// scripts/test-db-connection.js
require('dotenv').config({ path: '.env.local' })
const { testConnection } = require('../src/lib/database/connection.ts')

async function test() {
  console.log('🔄 Testing new PostgreSQL connection...')
  const success = await testConnection()
  console.log(success ? '✅ Success!' : '❌ Failed!')
  process.exit(0)
}

test()