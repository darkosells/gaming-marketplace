// Delivery Helper Utilities

import { Message } from '../types'

/**
 * Check if message contains delivery info
 */
export const isDeliveryMessage = (message: Message): boolean => {
  if (message.message_type !== 'system') return false
  const content = message.content || ''
  return (
    content.includes('DELIVERY INFORMATION') || 
    content.includes('DELIVERY INFO') ||
    content.includes('📦 DELIVERY') ||
    content.includes('automatically delivered') ||
    content.includes('Account Details:') ||
    content.includes('Game Key:') ||
    content.includes('Top-Up Information:') ||
    content.includes('Delivery Information:') ||
    (content.includes('delivered') && (
      content.includes('Username') || 
      content.includes('Password') || 
      content.includes('Code') ||
      content.includes('Key') ||
      content.includes('━━━')
    ))
  )
}

/**
 * Extract and clean delivery content from message (removes duplicate headers/footers)
 */
export const extractDeliveryContent = (content: string): { credentials: string } => {
  let cleanedContent = content
  
  // Remove "DELIVERY INFORMATION" headers/footers and their emojis
  cleanedContent = cleanedContent.replace(/🔑\s*DELIVERY\s*INFORMATION\s*/gi, '')
  cleanedContent = cleanedContent.replace(/🔐\s*DELIVERY\s*INFORMATION\s*/gi, '')
  cleanedContent = cleanedContent.replace(/📦\s*DELIVERY\s*INFORMATION\s*/gi, '')
  cleanedContent = cleanedContent.replace(/DELIVERY\s*INFORMATION/gi, '')
  
  // Remove separator lines
  cleanedContent = cleanedContent.replace(/━{3,}/g, '')
  
  // Remove common footer messages
  cleanedContent = cleanedContent.replace(/✅.*?delivered.*?automatically.*$/gim, '')
  cleanedContent = cleanedContent.replace(/⏰.*?48.*?hour.*?protection.*$/gim, '')
  cleanedContent = cleanedContent.replace(/⚠️.*?verify.*?credentials.*$/gim, '')
  cleanedContent = cleanedContent.replace(/✅.*?Marked as delivered.*$/gim, '')
  cleanedContent = cleanedContent.replace(/⏰.*?hours to confirm.*$/gim, '')
  cleanedContent = cleanedContent.replace(/⚠️.*?Raise dispute.*$/gim, '')
  
  // Clean up extra whitespace and newlines
  cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n')
  cleanedContent = cleanedContent.trim()
  
  return { credentials: cleanedContent }
}