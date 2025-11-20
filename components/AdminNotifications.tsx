'use client'

import Link from 'next/link'

interface NotificationsProps {
  notifications: any[]
  unreadCount: number
  showNotifications: boolean
  setShowNotifications: (show: boolean) => void
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
}

export default function AdminNotifications({
  notifications,
  unreadCount,
  showNotifications,
  setShowNotifications,
  onMarkRead,
  onMarkAllRead
}: NotificationsProps) {
  return (
    <div className="relative">
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 hover:bg-white/10 rounded-lg transition"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>
      
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={onMarkAllRead}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">🔕</div>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notif => (
                <Link
                  key={notif.id}
                  href={notif.link}
                  onClick={() => {
                    onMarkRead(notif.id)
                    setShowNotifications(false)
                  }}
                  className={`block p-4 hover:bg-white/5 border-b border-white/5 transition ${
                    !notif.read ? 'bg-purple-500/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notif.read && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    )}
                    <div className="flex-1">
                      <p className="text-white text-sm">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}