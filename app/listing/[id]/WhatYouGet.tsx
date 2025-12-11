'use client'

interface WhatYouGetProps {
  category: string
  deliveryType: 'manual' | 'automatic'
}

const categoryContent = {
  account: {
    title: "What's Included",
    icon: '🎮',
    items: [
      { text: 'Full account credentials (email & password)', icon: '🔐' },
      { text: 'Original email access (if applicable)', icon: '📧' },
      { text: 'All account progress & unlocks', icon: '🏆' },
      { text: 'Lifetime ownership transfer', icon: '♾️' },
    ],
    note: 'You will receive complete access to change all credentials after purchase.'
  },
  items: {
    title: "What's Included",
    icon: '🎒',
    items: [
      { text: 'Specified in-game items delivered', icon: '📦' },
      { text: 'Trade or direct transfer to your account', icon: '🔄' },
      { text: 'Verification screenshot provided', icon: '📸' },
      { text: 'Item as described or full refund', icon: '✅' },
    ],
    note: 'Items will be delivered to your existing game account.'
  },
  currency: {
    title: "What's Included",
    icon: '💰',
    items: [
      { text: 'Exact currency amount as listed', icon: '💵' },
      { text: 'Safe transfer method used', icon: '🛡️' },
      { text: 'Delivery confirmation provided', icon: '✅' },
      { text: 'Top-up or direct trade available', icon: '🔄' },
    ],
    note: 'Currency will be added to your existing game account.'
  },
  key: {
    title: "What's Included",
    icon: '🔑',
    items: [
      { text: 'Unused, valid game activation key', icon: '🎫' },
      { text: 'Platform-specific key (as listed)', icon: '💻' },
      { text: 'Activation instructions included', icon: '📋' },
      { text: 'Key guaranteed to work or replaced', icon: '🔄' },
    ],
    note: 'Redeem your key on the specified platform to activate.'
  }
}

export default function WhatYouGet({ category, deliveryType }: WhatYouGetProps) {
  const content = categoryContent[category as keyof typeof categoryContent] || categoryContent.account
  
  return (
    <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-xl p-4 border border-purple-500/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{content.icon}</span>
        <h4 className="text-white font-semibold">{content.title}</h4>
      </div>
      
      <ul className="space-y-2.5 mb-3">
        {content.items.map((item, index) => (
          <li key={index} className="flex items-start gap-2.5 text-sm">
            <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
            <span className="text-gray-300">{item.text}</span>
          </li>
        ))}
        <li className="flex items-start gap-2.5 text-sm">
          <span className="text-base flex-shrink-0 mt-0.5">
            {deliveryType === 'automatic' ? '⚡' : '👤'}
          </span>
          <span className="text-gray-300">
            {deliveryType === 'automatic' 
              ? 'Instant automatic delivery' 
              : 'Manual delivery by seller'}
          </span>
        </li>
      </ul>
      
      <p className="text-xs text-gray-400 border-t border-white/10 pt-3">
        💡 {content.note}
      </p>
    </div>
  )
}