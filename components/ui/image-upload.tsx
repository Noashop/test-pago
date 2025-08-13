'use client'

import { useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  disabled?: boolean
  // Optional: override upload endpoint and form field name
  uploadUrl?: string // default: '/api/upload'
  formFieldName?: string // default: 'file'; for register: 'files'
  extraFields?: Record<string, string> // additional form fields to append (e.g., { type: 'profile' })
}

export function ImageUpload({ value = [], onChange, maxImages = 5, disabled, uploadUrl = '/api/upload', formFieldName = 'file', extraFields }: ImageUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  
  // Asegurar que value siempre sea un array y mantener referencia estable
  const safeValue = useMemo(() => (Array.isArray(value) ? value : []), [value])

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append(formFieldName, file)
    if (extraFields) {
      for (const [k, v] of Object.entries(extraFields)) {
        formData.append(k, v)
      }
    }

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = 'Error al subir la imagen'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('Error parsing response:', parseError)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      // Support both generic /api/upload { url } and register endpoint { files: [{ secure_url }] }
      if (data?.url) return data.url as string
      if (Array.isArray(data?.files) && data.files.length > 0) {
        const first = data.files[0]
        return (first.secure_url || first.url) as string
      }
      throw new Error('Respuesta de subida no válida')
    } catch (error) {
      console.error('Upload error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Error desconocido al subir la imagen')
    }
  }, [uploadUrl, formFieldName, extraFields])

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (safeValue.length + files.length > maxImages) {
      toast({
        title: 'Error',
        description: `Puedes subir máximo ${maxImages} imágenes`,
        variant: 'destructive'
      })
      return
    }

    setUploading(true)

    try {
      const uploadPromises = Array.from(files).map(uploadImage)
      const urls = await Promise.all(uploadPromises)
      
      onChange([...safeValue, ...urls])
      
      toast({
        title: 'Éxito',
        description: 'Imágenes subidas correctamente',
      })
    } catch (error) {
      console.error('Error uploading images:', error)
      
      let errorMessage = 'Error al subir las imágenes'
      let errorTitle = 'Error'
      
      if (error instanceof Error) {
        if (error.message.includes('no configurada') || error.message.includes('no está disponible')) {
          errorTitle = 'Configuración Requerida'
          errorMessage = 'La subida de imágenes requiere configuración. Contacta al administrador.'
        } else if (error.message.includes('Upload preset')) {
          errorTitle = 'Configuración de Cloudinary'
          errorMessage = 'El preset de subida no está configurado. Verifica la configuración de Cloudinary.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }, [safeValue, onChange, maxImages, uploadImage, toast])

  const removeImage = useCallback((index: number) => {
    const newImages = safeValue.filter((_, i) => i !== index)
    onChange(newImages)
  }, [safeValue, onChange])

  return (
    <div className="space-y-4">
      {/* Upload area */}
      {safeValue.length < maxImages && (
        <Card className="border-dashed border-2 border-blue-300 hover:border-blue-400 transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Subir Imágenes del Producto
                </h3>
                <p className="text-sm text-gray-600">
                  Arrastra y suelta imágenes aquí o haz clic para seleccionar
                </p>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={disabled || uploading}
                  className="mt-4 bg-white hover:bg-gray-50 border-blue-300 text-blue-700 hover:text-blue-800"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Seleccionar Imágenes
                    </>
                  )}
                </Button>
              </div>
              <div className="text-xs text-gray-500 bg-white px-4 py-2 rounded-lg border">
                <p className="font-medium mb-1">Requisitos:</p>
                <ul className="space-y-1">
                  <li>• Máximo {maxImages} imágenes</li>
                  <li>• Formatos: JPG, PNG, WebP</li>
                  <li>• Máximo 5MB por imagen</li>
                  <li>• Al menos 1 imagen requerida</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        id="image-upload"
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Image previews */}
      {safeValue.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">
              Imágenes Subidas ({safeValue.length}/{maxImages})
            </h4>
            {safeValue.length === 1 && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Mínimo requerido ✓
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {safeValue.map((url, index) => (
              <div key={index} className="relative group">
                <Card className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-0">
                    <Image
                      src={url}
                      alt={`Imagen ${index + 1}`}
                      width={512}
                      height={256}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeImage(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="flex items-center justify-center space-x-3 text-sm text-blue-600 bg-blue-50 p-4 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="font-medium">Subiendo imágenes...</span>
        </div>
      )}
    </div>
  )
} 