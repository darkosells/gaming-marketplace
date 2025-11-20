// components/Footer.tsx - REUSABLE FOOTER COMPONENT

import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-black/40 backdrop-blur-lg border-t border-white/10 py-12 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Image 
                src="/logo6.svg" 
                alt="Nashflare Logo" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <span className="text-lg font-bold text-white">Nashflare</span>
            </div>
            <p className="text-gray-400 text-sm">
              The most trusted marketplace for gaming assets.
            </p>
          </div>

          {/* Marketplace Section */}
          <div>
            <h4 className="text-white font-semibold mb-4">Marketplace</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="/browse?category=account" className="hover:text-white transition">
                  Gaming Accounts
                </Link>
              </li>
              <li>
                <Link href="/browse?category=topup" className="hover:text-white transition">
                  Top-Ups
                </Link>
              </li>
              <li>
                <Link href="/browse?category=key" className="hover:text-white transition">
                  Game Keys
                </Link>
              </li>
              <li>
                <Link href="/browse" className="hover:text-white transition">
                  All Items
                </Link>
              </li>
            </ul>
          </div>

          {/* Nashflare Section */}
          <div>
            <h4 className="text-white font-semibold mb-4">Nashflare</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="/how-it-works" className="hover:text-white transition">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {currentYear} Nashflare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}