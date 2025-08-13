import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'
import { v2 as cloudinary } from 'cloudinary'
import { rateLimiters } from '@/lib/rate-limit'

// Configure Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
}

// Verificar configuración
if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
  console.warn('Cloudinary no está configurado. Las imágenes no se subirán.')
}

cloudinary.config(cloudinaryConfig)

// POST /api/upload - Upload file to Cloudinary
export async function POST(request: NextRequest) {
  const rateLimited = rateLimiters.upload.middleware(request)
  if (rateLimited) {
    return rateLimited
  }
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN, USER_ROLES.SUPPLIER])
    await connectToDatabase()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'general'

    if (!file) {
      return NextResponse.json(
        { error: 'Archivo es requerido' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se permiten imágenes.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Verificar si Cloudinary está configurado
    if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
      // Para desarrollo, devolver una URL de placeholder
      console.warn('Cloudinary no configurado, usando placeholder para desarrollo')
      return NextResponse.json({
        message: 'Archivo procesado (modo desarrollo)',
        url: `https://via.placeholder.com/400x300/cccccc/666666?text=Imagen+${Date.now()}`,
        publicId: `dev_${Date.now()}`,
        width: 400,
        height: 300,
        format: 'jpg',
        size: file.size
      })
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    return NextResponse.json({
      message: 'Archivo subido exitosamente',
      url: (result as any).secure_url,
      publicId: (result as any).public_id,
      width: (result as any).width,
      height: (result as any).height,
      format: (result as any).format,
      size: (result as any).bytes
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/upload - Delete file from Cloudinary
export async function DELETE(request: NextRequest) {
  const rateLimited = rateLimiters.upload.middleware(request)
  if (rateLimited) {
    return rateLimited
  }
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN, USER_ROLES.SUPPLIER])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('publicId')

    if (!publicId) {
      return NextResponse.json(
        { error: 'ID público del archivo es requerido' },
        { status: 400 }
      )
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result === 'ok') {
      return NextResponse.json({
        message: 'Archivo eliminado exitosamente'
      })
    } else {
      return NextResponse.json(
        { error: 'Error al eliminar el archivo' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Delete upload error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
