import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Verificar variables de entorno
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    return NextResponse.json({
      cloudName: cloudName ? 'Configured' : 'Missing',
      apiKey: apiKey ? 'Configured' : 'Missing',
      apiSecret: apiSecret ? 'Configured' : 'Missing',
      message: 'Environment variables check'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check configuration' },
      { status: 500 }
    )
  }
} 