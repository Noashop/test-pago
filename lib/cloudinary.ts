import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
}

export async function uploadToCloudinary(
  file: string | Buffer,
  options: {
    folder?: string
    transformation?: any[]
    resource_type?: 'image' | 'video' | 'raw' | 'auto'
    public_id?: string
    overwrite?: boolean
    quality?: string | number
    format?: string
  } = {}
): Promise<CloudinaryUploadResult> {
  try {
    const uploadOptions = {
      folder: options.folder || 'salta-conecta',
      resource_type: options.resource_type || 'auto',
      quality: options.quality || 'auto',
      fetch_format: 'auto',
      ...options,
    }

    const result = await cloudinary.uploader.upload(file as string, uploadOptions)
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
      created_at: result.created_at,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload image to Cloudinary')
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw new Error('Failed to delete image from Cloudinary')
  }
}

export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    crop?: string
    quality?: string | number
    format?: string
  } = {}
): string {
  return cloudinary.url(publicId, {
    width: options.width,
    height: options.height,
    crop: options.crop || 'fill',
    quality: options.quality || 'auto',
    fetch_format: options.format || 'auto',
    secure: true,
  })
}

export function generateImageTransformations(type: 'product' | 'profile' | 'banner' | 'thumbnail' | 'business-logo') {
  const transformations = {
    product: [
      { width: 800, height: 800, crop: 'fill', quality: 'auto' },
      { width: 400, height: 400, crop: 'fill', quality: 'auto' },
      { width: 200, height: 200, crop: 'fill', quality: 'auto' },
    ],
    profile: [
      { width: 200, height: 200, crop: 'fill', quality: 'auto', gravity: 'face' },
      { width: 100, height: 100, crop: 'fill', quality: 'auto', gravity: 'face' },
    ],
    banner: [
      { width: 1200, height: 400, crop: 'fill', quality: 'auto' },
      { width: 800, height: 300, crop: 'fill', quality: 'auto' },
    ],
    thumbnail: [
      { width: 150, height: 150, crop: 'fill', quality: 'auto' },
    ],
    'business-logo': [
      { width: 300, height: 300, crop: 'fill', quality: 'auto' },
      { width: 150, height: 150, crop: 'fill', quality: 'auto' },
      { width: 100, height: 100, crop: 'fill', quality: 'auto' },
    ],
  }

  return transformations[type] || []
}

export default cloudinary
