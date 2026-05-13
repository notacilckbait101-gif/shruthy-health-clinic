import mongoose from 'mongoose'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

declare global {
  var __mongooseConnection:
    | {
        conn: typeof mongoose | null
        promise: Promise<typeof mongoose> | null
      }
    | undefined
}

const cached = global.__mongooseConnection ?? {
  conn: null,
  promise: null,
}

global.__mongooseConnection = cached

export async function connectToDatabase() {
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    process.env.MONGO_URI ||
    ''

  if (!mongoUri) {
    throw new Error('MongoDB connection string is missing. Set MONGODB_URI or DATABASE_URL in .env.')
  }

  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      autoIndex: true,
      dbName: process.env.MONGODB_DB || 'homeopathy_emr',
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
