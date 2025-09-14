// src/lib/database/connection.ts
import { Pool, PoolClient } from 'pg'
 
// Parse the connection string to add better timeout settings
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Create connection pool with better timeout settings
const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10, // Reduced max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout to 10 seconds
  statement_timeout: 30000,       // 30 second statement timeout
  query_timeout: 30000,          // 30 second query timeout
})

// Better connection event handling
pool.on('connect', (client) => {
  console.log('✅ New database client connected')
})

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message)
})

pool.on('acquire', () => {
  console.log('🔄 Database client acquired from pool')
})

pool.on('release', () => {
  console.log('🔌 Database client released back to pool')
})

// Export the pool
const db = pool;
export { db }

/**
 * Execute a query with better error handling
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  let client: PoolClient | null = null
  
  try {
    // Get client from pool with timeout
    client = await pool.connect()
    
    // Execute query
    const res = await client.query(text, params)
    const duration = Date.now() - start
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Query executed successfully:', {
        query: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
        duration: `${duration}ms`,
        rows: res.rowCount
      })
    }
    
    return res
  } catch (error) {
    const duration = Date.now() - start
    console.error('❌ Database query error:', {
      query: text.slice(0, 100),
      params: params ? 'present' : 'none',
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  } finally {
    // Always release client back to pool
    if (client) {
      client.release()
    }
  }
}

/**
 * Test database connection with retry
 */
export async function testConnection(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Testing database connection (attempt ${i + 1}/${retries})...`)
      
      const result = await query('SELECT NOW() as current_time, version() as pg_version')
      
      console.log('✅ Database connection test successful:', {
        time: result.rows[0].current_time,
        version: result.rows[0].pg_version.split(' ')[0]
      })
      
      return true
    } catch (error) {
      console.error(`❌ Database connection test failed (attempt ${i + 1}):`, 
        error instanceof Error ? error.message : 'Unknown error')
      
      if (i < retries - 1) {
        console.log(`⏳ Retrying in 2 seconds...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }
  
  return false
}

/**
 * Transaction helper
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    console.log('✅ Transaction committed successfully')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Transaction rolled back:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Close all connections (for cleanup)
 */
export async function closeConnections(): Promise<void> {
  try {
    await pool.end()
    console.log('🔌 All database connections closed')
  } catch (error) {
    console.error('❌ Error closing connections:', error instanceof Error ? error.message : 'Unknown error')
  }
}

// Test connection on module load (but don't block)
if (process.env.NODE_ENV !== 'test') {
  testConnection(1).catch(() => {
    console.warn('⚠️ Initial database connection test failed - will retry on first query')
  })
}  
// Add this export at the end of the file
export const prisma = {
  query,
  db,
  transaction,
  testConnection,
  closeConnections
};
