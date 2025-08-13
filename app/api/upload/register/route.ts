import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary, generateImageTransformations } from '@/lib/cloudinary'
import { FILE_UPLOAD } from '@/constants'

// POST /api/upload/register - Upload images during registration (no auth required)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const type = formData.get('type') as string || 'profile'
    const folder = formData.get('folder') as string

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 images allowed' },
        { status: 400 }
      )
    }

    const uploadResults = []

    for (const file of files) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Only image files are allowed' },
          { status: 400 }
        )
      }

      // Validar tamaño (5MB máximo)
      if (file.size > FILE_UPLOAD.MAX_SIZE) {
        return NextResponse.json(
          { error: `File size must be less than ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB` },
          { status: 400 }
        )
      }

      // Convertir a base64
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

      // Generar nombre único
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const filename = `${type}-${timestamp}-${randomId}.${fileExtension}`

      try {
        // Subir a Cloudinary
        const uploadOptions = {
          folder: folder || `salta-conecta/${type === 'profile' ? 'profiles' : type === 'business-logo' ? 'business-logos' : 'products'}`,
          public_id: filename,
          transformation: generateImageTransformations(type as any),
          resource_type: 'image' as const
        }

        const result = await uploadToCloudinary(base64, uploadOptions)

        uploadResults.push({
          public_id: result.public_id,
          secure_url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          original_filename: file.name,
          size: file.size
        })
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError)
        
        // Fallback: almacenar como base64 temporalmente
        uploadResults.push({
          public_id: filename,
          secure_url: base64,
          width: 0,
          height: 0,
          format: fileExtension,
          original_filename: file.name,
          size: file.size
        })
      }
    }

    return NextResponse.json({
      message: 'Files uploaded successfully',
      files: uploadResults
    })

  } catch (error) {
    console.error('Upload error:', error)
    const message = error instanceof Error ? error.message : 'Failed to upload files'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
} 