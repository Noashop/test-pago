import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { USER_ROLES, UserRole, ADMIN_PERMISSIONS } from '@/constants'
import { connectToDatabase } from './mongodb'
import User from '@/models/User'

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string
    email: string
    name: string
    role: UserRole
    isApproved?: boolean
    permissions?: string[]
  }
}

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error('Authentication required')
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as UserRole,
      isApproved: session.user.isApproved
    }
  }
}

export async function requireRole(request: NextRequest, allowedRoles: UserRole[]) {
  const { user } = await requireAuth(request)
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions')
  }

  return { user }
}

export async function requireApprovedSupplier(request: NextRequest) {
  const { user } = await requireAuth(request)
  
  if (user.role !== USER_ROLES.SUPPLIER) {
    throw new Error('Supplier access required')
  }

  if (!user.isApproved) {
    throw new Error('Supplier account not approved')
  }

  return { user }
}

export async function requireAdmin(request: NextRequest) {
  return requireRole(request, [USER_ROLES.ADMIN])
}

export async function requireSupplierOrAdmin(request: NextRequest) {
  return requireRole(request, [USER_ROLES.SUPPLIER, USER_ROLES.ADMIN])
}

// Normalize permission aliases between legacy and new constants
function normalizePermission(p?: string) {
  if (!p) return ''
  const map: Record<string, string> = {
    users: 'customers',
    clients: 'customers',
    promos: 'promotions',
    coupons: 'coupons',
    products: 'products',
    orders: 'orders',
    support: 'support',
    suppliers: 'suppliers',
    reports: 'reports',
    settings: 'settings',
    wheel: 'wheel',
    customers: 'customers',
  }
  return map[p] || p
}

export async function requirePermission(request: NextRequest, required: string | string[]) {
  const { user } = await requireAuth(request)
  // Admin bypass
  if (user.role === USER_ROLES.ADMIN) return { user }

  const requiredList = Array.isArray(required) ? required : [required]
  await connectToDatabase()
  const dbUser = await User.findById(user.id).select('permissions role').lean()
  const userPerms: string[] = ((dbUser as any)?.permissions || []).map((p: string) => normalizePermission(p))

  const ok = requiredList.some((req) => userPerms.includes(normalizePermission(req)))
  if (!ok) {
    throw new Error('Insufficient permissions')
  }
  return { user }
}

export async function requireRoleOrPermission(request: NextRequest, roles: UserRole[], perms: string[]) {
  try {
    return await requireRole(request, roles)
  } catch {
    return await requirePermission(request, perms)
  }
}

export function createAuthenticatedHandler(
  handler: (request: NextRequest, context: { user: any, params?: any }) => Promise<Response>,
  requiredRoles?: UserRole[],
  requireApproval?: boolean,
  requiredPermissions?: string[]
) {
  return async (request: NextRequest, context: { params?: any } = { params: {} }) => {
    try {
      let authResult

      if (requireApproval && requiredRoles?.includes(USER_ROLES.SUPPLIER)) {
        authResult = await requireApprovedSupplier(request)
      } else if (requiredRoles && requiredPermissions && requiredPermissions.length > 0) {
        authResult = await requireRoleOrPermission(request, requiredRoles, requiredPermissions)
      } else if (requiredRoles) {
        authResult = await requireRole(request, requiredRoles)
      } else if (requiredPermissions && requiredPermissions.length > 0) {
        authResult = await requirePermission(request, requiredPermissions)
      } else {
        authResult = await requireAuth(request)
      }

      return await handler(request, { ...authResult, params: context?.params })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed'

      if (message === 'Authentication required') {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (message === 'Insufficient permissions') {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (message === 'Supplier account not approved') {
        return new Response(
          JSON.stringify({ error: 'Tu cuenta debe estar aprobada para acceder a esta función' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}

// Función para Next.js 15 - compatible con la nueva firma de rutas

// Función para Next.js 15 - con firma correcta
