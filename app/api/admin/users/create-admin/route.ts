import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'
import { jsonOk, jsonError } from '@/lib/api-response'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { email, name, password, phone, role } = await request.json()

    // Validar campos requeridos
    if (!email || !name || !password) {
      return jsonError('Email, nombre y contraseña son requeridos', 400)
    }

    // Validar formato de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError('Formato de email inválido', 400)
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return jsonError('La contraseña debe tener al menos 6 caracteres', 400)
    }

    // Validar rol de administrador
    const validAdminRoles = [
      'admin',
      'admin-users', 
      'admin-products',
      'admin-orders',
      'admin-supports',
      'admin-promos'
    ]
    
    const adminRole = role || 'admin'
    if (!validAdminRoles.includes(adminRole)) {
      return jsonError('Tipo de administrador inválido', 400)
    }

    // Verificar que el email no esté registrado
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return jsonError('El email ya está registrado', 409)
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear nuevo administrador
    const newAdmin = await User.create({
      email: email.toLowerCase(),
      name: name.trim(),
      phone: phone?.trim() || '',
      password: hashedPassword,
      role: adminRole,
      isActive: true,
      isEmailVerified: true,
      isApproved: true,
      createdBy: user.id,
      createdAt: new Date()
    })

    return jsonOk({
      message: 'Administrador creado exitosamente',
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        name: newAdmin.name,
        phone: newAdmin.phone,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create admin error:', error)
    return jsonError('Error interno del servidor', 500)
  }
}