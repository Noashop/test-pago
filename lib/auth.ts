import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@next-auth/mongodb-adapter'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from './mongodb'
import User from '@/models/User'

const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = client.connect()

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          await connectToDatabase()
          
          const user = await User.findOne({ 
            email: credentials.email.toLowerCase() 
          }).select('+password')

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          // Check if user is active
          if (!user.isActive) {
            throw new Error('Account is deactivated')
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            isApproved: user.isApproved,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn() {
      // Only credentials are supported; allow sign-in if authorize passed
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.isApproved = user.isApproved
      }
      
      // Refresh user data from database
      if (token.email) {
        try {
          await connectToDatabase()
          const dbUser = await User.findOne({ 
            email: token.email.toLowerCase() 
          })
          
          if (dbUser) {
            token.role = dbUser.role
            token.name = dbUser.name
            token.picture = dbUser.image
            token.isApproved = dbUser.isApproved
          }
        } catch (error) {
          console.error('Error refreshing user data:', error)
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.isApproved = token.isApproved as boolean
        // Ensure the image is passed through to the session for avatar rendering
        if (typeof token.picture === 'string') {
          session.user.image = token.picture
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
  debug: process.env.NODE_ENV === 'development'
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      role: string
      isApproved?: boolean
    }
  }

  interface User {
    role: string
    isApproved?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    isApproved?: boolean
  }
}
