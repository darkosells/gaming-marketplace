// File Path: app/messages/components/common/Avatar.tsx

'use client'

interface AvatarProps {
  avatarUrl: string | null
  username: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base'
}

export default function Avatar({ avatarUrl, username, size = 'md' }: AvatarProps) {
  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0`}>
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={username}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-white font-semibold">
          {username.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}