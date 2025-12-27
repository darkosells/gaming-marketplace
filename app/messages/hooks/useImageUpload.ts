// File Path: app/messages/hooks/useImageUpload.ts

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { checkImageForSensitiveContent } from '../utils/messageHelpers'

interface UseImageUploadProps {
  userId: string | null
  onSecurityWarning: () => void
}

export function useImageUpload({ userId, onSecurityWarning }: UseImageUploadProps) {
  const supabase = createClient()
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Compress image before upload
  const compressImage = useCallback(async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          const MAX_WIDTH = 1920
          const MAX_HEIGHT = 1920
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to compress image'))
              }
            },
            'image/jpeg',
            0.8
          )
        }
      }
      reader.onerror = reject
    })
  }, [])

  // Handle image selection
  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Only image files (JPG, PNG, GIF, WEBP) are allowed')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    if (checkImageForSensitiveContent(file)) {
      onSecurityWarning()
    }

    setSelectedImage(file)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [onSecurityWarning])

  // Upload image to Supabase storage
  const uploadImage = useCallback(async (): Promise<string | null> => {
    if (!selectedImage || !userId) return null

    try {
      setUploadingImage(true)
      const compressedBlob = await compressImage(selectedImage)
      
      const fileExt = selectedImage.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `messages/${fileName}`

      const { data, error } = await supabase.storage
        .from('message-images')
        .upload(filePath, compressedBlob, {
          contentType: selectedImage.type,
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('message-images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    } finally {
      setUploadingImage(false)
    }
  }, [selectedImage, userId, compressImage, supabase])

  // Clear image selection
  const clearImage = useCallback(() => {
    setImagePreview(null)
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Trigger file input click
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return {
    uploadingImage,
    imagePreview,
    selectedImage,
    fileInputRef,
    handleImageSelect,
    uploadImage,
    clearImage,
    triggerFileInput,
    setUploadingImage
  }
}