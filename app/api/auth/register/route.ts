import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '@/lib/mongodb'
import User from '@/models/User'
import { USER_ROLES } from '@/constants'
import { withAuthRateLimit } from '@/lib/rate-limit'
import { sendVerificationCodeEmail } from '@/lib/email'

export const POST = withAuthRateLimit(async (request: NextRequest) => {
  try {
    await connectToDatabase()

    const { 
      name, 
      email, 
      password, 
      role = USER_ROLES.CLIENT,
      businessInfo,
      profileImage,
      phone,
      address,
      acceptTerms
    } = await request.json()

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validate terms acceptance
    if (acceptTerms !== true) {
      return NextResponse.json(
        { error: 'Debes aceptar los términos y condiciones y la política de privacidad' },
        { status: 400 }
      )
    }

    // Validate role
    if (!Object.values(USER_ROLES).includes(role)) {
      return NextResponse.json(
        { error: 'Rol no válido' },
        { status: 400 }
      )
    }

    // Validate business info for suppliers
    if (role === USER_ROLES.SUPPLIER && !businessInfo) {
      return NextResponse.json(
        { error: 'La información del negocio es requerida para proveedores' },
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

    // Create user data
    const userData: any = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      isActive: true,
      // Mark email as verified by default for clients
      isEmailVerified: role === USER_ROLES.CLIENT,
      preferences: {
        notifications: true,
        marketing: false,
        language: 'es'
      },
      // Add phone and address fields if available
      ...(phone && { phone }),
      ...(address && { address })
    }

    // Add profile image if provided
    if (profileImage) {
      userData.image = profileImage
    }

    // Add supplier-specific fields
    if (role === USER_ROLES.SUPPLIER) {
      userData.businessInfo = {
        ...businessInfo,
        // Ensure address and opening hours are included
        address: businessInfo.address || address || {},
        openingHours: businessInfo.openingHours || 'Lunes a Viernes 9:00 - 18:00',
        phone: businessInfo.phone || phone || ''
      }
      userData.isApproved = false // Suppliers need approval
      userData.approvalDate = null
      userData.approvedBy = null
    }

    // Create user
    const user = await User.create(userData)

    // Only send verification email for clients
    try {
      if (role === USER_ROLES.CLIENT) {
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const hash = await bcrypt.hash(code, 10)
        user.emailVerificationCode = hash as any
        user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000)
        await user.save()
        await sendVerificationCodeEmail(user.email, code)
      }
    } catch (e) {
      console.warn('Could not send verification email:', e)
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject()

    return NextResponse.json(
      { 
        message: role === USER_ROLES.SUPPLIER 
          ? 'Solicitud de proveedor enviada exitosamente. Será revisada por nuestro equipo.'
          : 'Usuario creado exitosamente',
        user: userWithoutPassword
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})
