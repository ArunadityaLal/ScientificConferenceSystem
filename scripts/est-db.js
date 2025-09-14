// scripts/test-db.js
// Run this with: node scripts/test-db.js

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully!')
    
    // Test query
    const userCount = await prisma.user.count()
    console.log(`📊 Total users in database: ${userCount}`)
    
    // Test create operation
    console.log('🧪 Testing user creation...')
    
    await prisma.$disconnect()
    console.log('✅ Database test completed successfully!')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message
    })
    
    // Specific error handling
    if (error.message.includes("Can't reach database server")) {
      console.log('💡 Suggestions:')
      console.log('1. Check if DATABASE_URL is correct in .env file')
      console.log('2. Verify Neon database is running')
      console.log('3. Check network connection')
      console.log('4. Try running: npx prisma db push')
    }
  }
}

testConnection()