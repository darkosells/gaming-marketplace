// components/ImageUploader.tsx - REUSABLE IMAGE UPLOAD COMPONENT

'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

interface ImageUploaderProps {
  userId: string
  listingId?: string
  existingImages?: string[]
  onImagesChange: (urls: string[]) => void
  maxImages?: number
}

export default function ImageUploader({
  userId,
  listingId,
  existingImages = [],
  onImagesChange,
  maxImages = 3
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(existingImages)
  const [uploading, setUploading] = useState<number | null>(null)
  const [error, setError] = useState('')
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const supabase = createClient()

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png']
  const TARGET_MAX_DIMENSION = 1200 // Max width/height for resized image
  const COMPRESSION_QUALITY = 0.85 // JPEG quality

  // Compress and resize image
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        let { width, height } = img

        // Calculate new dimensions while maintaining aspect ratio
        if (width > TARGET_MAX_DIMENSION || height > TARGET_MAX_DIMENSION) {
          if (width > height) {
            height = (height / width) * TARGET_MAX_DIMENSION
            width = TARGET_MAX_DIMENSION
          } else {
            width = (width / height) * TARGET_MAX_DIMENSION
            height = TARGET_MAX_DIMENSION
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw image with white background (for transparency)
        ctx!.fillStyle = '#FFFFFF'
        ctx!.fillRect(0, 0, width, height)
        ctx!.drawImage(img, 0, 0, width, height)

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
          COMPRESSION_QUALITY
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only JPEG and PNG images are allowed'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Image must be less than 5MB'
    }
    return null
  }

  const handleUpload = async (file: File, index: number) => {
    setError('')
    
    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(index)

    try {
      // Compress image
      const compressedBlob = await compressImage(file)
      
      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(7)
      const filename = `${userId}/${listingId || 'new'}_${index}_${timestamp}_${randomString}.jpg`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(filename, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(filename)

      // Update images array
      const newImages = [...images]
      newImages[index] = publicUrl
      setImages(newImages)
      onImagesChange(newImages.filter(img => img)) // Filter out empty slots
    } catch (err: any) {
      console.error('Upload error:', err)
      setError('Failed to upload image: ' + err.message)
    } finally {
      setUploading(null)
    }
  }

  const handleRemove = async (index: number) => {
    const imageUrl = images[index]
    if (!imageUrl) return

    try {
      // Extract filename from URL
      const urlParts = imageUrl.split('/listing-images/')
      if (urlParts.length > 1) {
        const filename = urlParts[1]
        
        // Delete from storage
        await supabase.storage
          .from('listing-images')
          .remove([filename])
      }

      // Update images array
      const newImages = [...images]
      newImages[index] = ''
      setImages(newImages)
      onImagesChange(newImages.filter(img => img))
    } catch (err: any) {
      console.error('Remove error:', err)
      setError('Failed to remove image: ' + err.message)
    }
  }

  const triggerFileInput = (index: number) => {
    fileInputRefs.current[index]?.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-white font-semibold">
          Product Images
        </label>
        <span className="text-sm text-gray-400">
          {images.filter(img => img).length}/{maxImages} uploaded
        </span>
      </div>

      <p className="text-xs text-gray-500">
        Upload up to {maxImages} images. JPEG or PNG only, max 5MB each. Images will be automatically optimized.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: maxImages }).map((_, index) => (
          <div key={index} className="relative">
            <input
              type="file"
              accept="image/jpeg,image/png"
              ref={(el) => { fileInputRefs.current[index] = el }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file, index)
                e.target.value = '' // Reset input
              }}
              className="hidden"
            />

            {images[index] ? (
              // Image uploaded
              <div className="relative aspect-square bg-white/5 border border-white/10 rounded-xl overflow-hidden group">
                <img
                  src={images[index]}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => triggerFileInput(index)}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition"
                    title="Replace image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
                    title="Remove image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index === 0 ? 'Main' : `#${index + 1}`}
                  </span>
                </div>
              </div>
            ) : (
              // Upload placeholder
              <button
                type="button"
                onClick={() => triggerFileInput(index)}
                disabled={uploading !== null}
                className="aspect-square w-full bg-white/5 border-2 border-dashed border-white/20 rounded-xl hover:border-purple-500/50 hover:bg-white/10 transition flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading === index ? (
                  <>
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-400">Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm text-gray-400">
                      {index === 0 ? 'Add Main Image' : `Add Image #${index + 1}`}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        💡 Tip: The first image will be shown as the main product image. High-quality images help sell your items faster!
      </p>
    </div>
  )
}