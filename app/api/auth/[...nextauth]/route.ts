import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimiters } from '@/lib/rate-limit'
import type { NextRequest } from 'next/server'

const handler = NextAuth(authOptions)

export async function GET(request: NextRequest, ctx: any) {
  const limited = rateLimiters.auth.middleware(request)
  if (limited) return limited
  return handler(request, ctx)
}

export async function POST(request: NextRequest, ctx: any) {
  const limited = rateLimiters.auth.middleware(request)
  if (limited) return limited
  return handler(request, ctx)
}
