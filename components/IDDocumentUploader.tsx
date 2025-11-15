// components/IDDocumentUploader.tsx - SECURE ID DOCUMENT UPLOAD COMPONENT

'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

interface IDDocumentUploaderProps {
  userId: string
  documentType: 'front' | 'back'
  existingUrl?: string
  onUploadComplete: (url: string) => void
  label: string
  required?: boolean
}

export default function IDDocumentUploader({
  userId,
  documentType,
  existingUrl = '',
  onUploadComplete,
  label,
  required = true
}: IDDocumentUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string>(existingUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string>(existingUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB for ID documents
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, or PDF files are allowed'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File must be less than 10MB'
    }
    return null
  }

  const handleUpload = async (file: File) => {
    setError('')
    
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)

    try {
      // Generate secure filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(7)
      const extension = file.name.split('.').pop() || 'jpg'
      const filename = `${userId}/id_${documentType}_${timestamp}_${randomString}.${extension}`

      // Upload to Supabase Storage (private bucket)
      const { data, error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(filename, file, {
          contentType: file.type,
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get signed URL (for private bucket)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('verification-documents')
        .createSignedUrl(filename, 60 * 60 * 24 * 365) // 1 year expiry

      if (signedUrlError) throw signedUrlError

      const url = signedUrlData.signedUrl

      setImageUrl(url)
      setPreviewUrl(url)
      onUploadComplete(url)

      // Create local preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      setError('Failed to upload document: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!imageUrl) return

    try {
      // Extract filename from URL
      const urlParts = imageUrl.split('/verification-documents/')
      if (urlParts.length > 1) {
        const filename = urlParts[1].split('?')[0] // Remove query params
        
        await supabase.storage
          .from('verification-documents')
          .remove([filename])
      }

      setImageUrl('')
      setPreviewUrl('')
      onUploadComplete('')
    } catch (err: any) {
      console.error('Remove error:', err)
      setError('Failed to remove document: ' + err.message)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-white font-semibold">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      <input
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
          e.target.value = ''
        }}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-4">
            {previewUrl.includes('application/pdf') || previewUrl.endsWith('.pdf') ? (
              <div className="w-20 h-20 bg-red-500/20 rounded-lg flex items-center justify-center">
                <span className="text-3xl">📄</span>
              </div>
            ) : (
              <img
                src={previewUrl}
                alt={label}
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <p className="text-green-400 text-sm font-semibold flex items-center gap-2">
                <span>✅</span> Document uploaded
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Your document has been securely uploaded
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg text-sm transition"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full bg-white/5 border-2 border-dashed border-white/20 rounded-xl p-6 hover:border-purple-500/50 hover:bg-white/10 transition flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-400">Uploading securely...</span>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Click to upload</p>
                <p className="text-gray-400 text-xs mt-1">JPEG, PNG, or PDF (max 10MB)</p>
              </div>
            </>
          )}
        </button>
      )}

      <p className="text-xs text-gray-500">
        🔒 Your documents are stored securely and encrypted. Only authorized staff can view them.
      </p>
    </div>
  )
}