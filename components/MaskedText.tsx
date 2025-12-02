'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface MaskedTextProps {
  /** The sensitive text to mask */
  text: string
  /** Type of data - affects masking pattern */
  type?: 'email' | 'address' | 'phone' | 'generic'
  /** Auto-hide after this many seconds (0 = never) */
  autoHideSeconds?: number
  /** Show copy button when revealed */
  showCopyButton?: boolean
  /** Callback when text is revealed */
  onReveal?: () => void
  /** Callback when text is hidden */
  onHide?: () => void
  /** Additional CSS classes */
  className?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * MaskedText Component
 * 
 * Displays sensitive data with blur/mask protection.
 * Click to reveal, with optional auto-hide timer.
 * 
 * Usage:
 * <MaskedText text="user@email.com" type="email" />
 * <MaskedText text="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" type="address" autoHideSeconds={30} />
 */
export default function MaskedText({
  text,
  type = 'generic',
  autoHideSeconds = 30,
  showCopyButton = true,
  onReveal,
  onHide,
  className = '',
  size = 'md'
}: MaskedTextProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  // Generate masked version of text based on type
  const getMaskedText = useCallback(() => {
    if (!text) return '•••••••'
    
    switch (type) {
      case 'email': {
        const [localPart, domain] = text.split('@')
        if (!domain) return '•••@•••.•••'
        const maskedLocal = localPart.length > 2 
          ? localPart[0] + '•••' + localPart[localPart.length - 1]
          : '•••'
        const domainParts = domain.split('.')
        const maskedDomain = domainParts.length > 1
          ? '•••.' + domainParts[domainParts.length - 1]
          : '•••'
        return `${maskedLocal}@${maskedDomain}`
      }
      case 'address': {
        // For crypto addresses or physical addresses
        if (text.length > 10) {
          return text.slice(0, 6) + '••••••' + text.slice(-4)
        }
        return '••••••••••'
      }
      case 'phone': {
        if (text.length > 4) {
          return '•••••••' + text.slice(-4)
        }
        return '•••••••••'
      }
      case 'generic':
      default: {
        if (text.length > 4) {
          return text.slice(0, 2) + '•'.repeat(Math.min(text.length - 4, 8)) + text.slice(-2)
        }
        return '•'.repeat(text.length)
      }
    }
  }, [text, type])

  // Auto-hide timer
  useEffect(() => {
    if (!isRevealed || autoHideSeconds === 0) {
      setTimeLeft(null)
      return
    }

    setTimeLeft(autoHideSeconds)
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          setIsRevealed(false)
          onHide?.()
          return null
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRevealed, autoHideSeconds, onHide])

  // Handle reveal toggle
  const handleToggle = () => {
    if (isRevealed) {
      setIsRevealed(false)
      setTimeLeft(null)
      onHide?.()
    } else {
      setIsRevealed(true)
      onReveal?.()
    }
  }

  // Handle copy
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const buttonSizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1'
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Masked/Revealed Text */}
      <span
        className={`
          font-mono transition-all duration-300 cursor-pointer
          ${sizeClasses[size]}
          ${isRevealed 
            ? 'text-white' 
            : 'text-gray-400 blur-[2px] hover:blur-[1px]'
          }
        `}
        onClick={handleToggle}
        title={isRevealed ? 'Click to hide' : 'Click to reveal'}
      >
        {isRevealed ? text : getMaskedText()}
      </span>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {/* Reveal/Hide Button */}
        <button
          onClick={handleToggle}
          className={`
            ${buttonSizeClasses[size]}
            rounded transition-all duration-200
            ${isRevealed
              ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30'
              : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white border border-white/10'
            }
          `}
          title={isRevealed ? 'Hide' : 'Reveal'}
        >
          {isRevealed ? (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
              {timeLeft && <span className="text-[10px] opacity-70">{timeLeft}s</span>}
            </span>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>

        {/* Copy Button (only when revealed) */}
        {showCopyButton && isRevealed && (
          <button
            onClick={handleCopy}
            className={`
              ${buttonSizeClasses[size]}
              rounded transition-all duration-200
              ${copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white border border-white/10'
              }
            `}
            title={copied ? 'Copied!' : 'Copy'}
          >
            {copied ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * MaskedTextGroup Component
 * 
 * For displaying a label + masked value pair
 */
interface MaskedTextGroupProps extends MaskedTextProps {
  label: string
  labelClassName?: string
}

export function MaskedTextGroup({
  label,
  labelClassName = '',
  ...props
}: MaskedTextGroupProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`text-xs text-gray-400 ${labelClassName}`}>{label}</span>
      <MaskedText {...props} />
    </div>
  )
}

/**
 * MaskedEmail Component
 * 
 * Convenience component for emails
 */
export function MaskedEmail({ 
  email, 
  ...props 
}: Omit<MaskedTextProps, 'text' | 'type'> & { email: string }) {
  return <MaskedText text={email} type="email" {...props} />
}

/**
 * MaskedAddress Component
 * 
 * Convenience component for crypto/physical addresses
 */
export function MaskedAddress({ 
  address, 
  ...props 
}: Omit<MaskedTextProps, 'text' | 'type'> & { address: string }) {
  return <MaskedText text={address} type="address" {...props} />
}

/**
 * MaskedPhone Component
 * 
 * Convenience component for phone numbers
 */
export function MaskedPhone({ 
  phone, 
  ...props 
}: Omit<MaskedTextProps, 'text' | 'type'> & { phone: string }) {
  return <MaskedText text={phone} type="phone" {...props} />
}


/**
 * RevealAllButton Component
 * 
 * Button to reveal all masked fields on the page
 * Useful for admin bulk operations
 */
interface RevealAllButtonProps {
  isRevealed: boolean
  onToggle: () => void
  className?: string
}

export function RevealAllButton({ isRevealed, onToggle, className = '' }: RevealAllButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
        flex items-center gap-2
        ${isRevealed
          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30'
          : 'bg-white/10 text-gray-400 border border-white/10 hover:bg-white/20 hover:text-white'
        }
        ${className}
      `}
    >
      {isRevealed ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
          Hide All Sensitive Data
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Reveal All Sensitive Data
        </>
      )}
    </button>
  )
}