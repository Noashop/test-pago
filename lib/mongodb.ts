import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

let cached: any = null

async function dbConnect() {
  if (cached) {
    return cached
  }

  const opts = {
    // Habilitamos bufferCommands para evitar errores "before initial connection is complete"
    // cuando múltiples requests concurrentes llegan al iniciar el server.
    bufferCommands: true,
  }

  try {
    cached = await mongoose.connect(MONGODB_URI, opts)
    return cached
  } catch (e) {
    cached = null
    throw e
  }
}

// Export both for compatibility
export default dbConnect
export const connectToDatabase = dbConnect
