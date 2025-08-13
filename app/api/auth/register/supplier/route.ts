import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { USER_ROLES } from '@/constants'
import { sendVerificationCodeEmail } from '@/lib/email'
import { withAuthRateLimit } from '@/lib/rate-limit'

export const POST = withAuthRateLimit(async (request: NextRequest) => {
  try {
    await connectToDatabase()

    const { 
      name, 
      email, 
      password, 
      businessInfo 
    } = await request.json()

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validate business info
    if (!businessInfo || !businessInfo.businessName || !businessInfo.taxId) {
      return NextResponse.json(
        { error: 'La información del negocio es requerida' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este email' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create supplier user
    const supplier = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: USER_ROLES.SUPPLIER,
      isActive: true,
      isEmailVerified: false,
      businessInfo,
      isApproved: false, // Suppliers need approval
      approvalDate: null,
      approvedBy: null,
      preferences: {
        notifications: true,
        marketing: false,
        language: 'es'
      }
    })

    // Generate OTP and send verification email (best-effort)
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      const hash = await bcrypt.hash(code, 10)
      supplier.emailVerificationCode = hash as any
      supplier.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000)
      await supplier.save()
      await sendVerificationCodeEmail(supplier.email, code)
    } catch (e) {
      console.warn('Could not send supplier verification email:', e)
    }

    // Remove password from response
    const { password: _, ...supplierWithoutPassword } = supplier.toObject()

    return NextResponse.json(
      { 
        message: 'Solicitud de proveedor enviada exitosamente. Será revisada por nuestro equipo.',
        supplier: supplierWithoutPassword
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}) 