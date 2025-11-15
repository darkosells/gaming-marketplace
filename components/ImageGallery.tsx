// components/ImageGallery.tsx - IMAGE GALLERY FOR PRODUCT PAGES

'use client'

import { useState } from 'react'

interface ImageGalleryProps {
  images: string[]
  title: string
  compact?: boolean
}

export default function ImageGallery({ images, title, compact = false }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div className={`${compact ? 'h-64' : 'aspect-square'} bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center`}>
        <span className="text-8xl">🎮</span>
      </div>
    )
  }

  const currentImage = images[selectedIndex] || images[0]

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div 
          className={`relative ${compact ? 'h-80' : 'aspect-square'} bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-zoom-in group`}
          onClick={() => setShowLightbox(true)}
        >
          <img
            src={currentImage}
            alt={`${title} - Image ${selectedIndex + 1}`}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-3">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition flex-shrink-0 ${
                  index === selectedIndex
                    ? 'border-purple-500'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <img
                  src={image}
                  alt={`${title} - Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === selectedIndex && (
                  <div className="absolute inset-0 bg-purple-500/20"></div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div 
          className="fixed inset-0 bg-black/90 z-[10000] flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
              }}
              className="absolute left-4 text-white hover:text-gray-300 transition"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Main Image */}
          <div 
            className="max-w-5xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage}
              alt={`${title} - Full size`}
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
              }}
              className="absolute right-4 text-white hover:text-gray-300 transition"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/70 px-4 py-2 rounded-lg">
            {selectedIndex + 1} / {images.length}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedIndex(index)
                  }}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                    index === selectedIndex
                      ? 'border-purple-500'
                      : 'border-white/30 hover:border-white/60'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}