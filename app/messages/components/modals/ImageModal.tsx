// File Path: app/messages/components/modals/ImageModal.tsx

'use client'

interface ImageModalProps {
  isOpen: boolean
  imageUrl: string | null
  onClose: () => void
}

export default function ImageModal({ isOpen, imageUrl, onClose }: ImageModalProps) {
  if (!isOpen || !imageUrl) return null

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full">
        <button
          onClick={onClose}
          className="absolute -top-10 sm:-top-12 right-0 text-white hover:text-gray-300 text-3xl sm:text-4xl font-bold p-2"
        >
          ✕
        </button>
        <img
          src={imageUrl}
          alt="Full size"
          className="w-full h-auto rounded-2xl shadow-2xl max-h-[80vh] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}