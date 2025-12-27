// supabase/functions/send-order-email/types.ts
// Shared types and interfaces for email templates

export interface EmailRequest {
  type: 
    // Marketplace emails
    | 'order_confirmation' | 'delivery_notification' | 'new_sale' | 'dispute_opened' | 'withdrawal_processed' 
    // Account emails
    | 'password_changed' | 'username_changed' | 'welcome' | 'email_verification' | 'password_reset' 
    // Vendor application emails
    | 'vendor_approved' | 'vendor_rejected' | 'vendor_resubmission_required'
    // Boosting emails
    | 'boost_new_offer' | 'boost_offer_accepted' | 'boost_credentials_submitted'
    | 'boost_started' | 'boost_progress_update' | 'boost_pending_confirmation' | 'boost_completed'
    // Messaging emails
    | 'new_message'
  [key: string]: any
}

export interface OrderConfirmationData {
  buyerEmail: string
  buyerUsername: string
  sellerUsername: string
  listingTitle: string
  quantity: number
  amount: number
  orderId: string
}

export interface DeliveryNotificationData {
  buyerEmail: string
  buyerUsername: string
  sellerUsername: string
  listingTitle: string
  deliveryCode: string
  orderId: string
}

export interface NewSaleData {
  sellerEmail: string
  sellerUsername: string
  buyerUsername: string
  listingTitle: string
  quantity: number
  amount: number
  orderId: string
}

export interface DisputeData {
  recipientEmail: string
  recipientUsername: string
  openedBy: string
  disputeReason: string
  orderId: string
}

export interface WithdrawalData {
  vendorEmail: string
  vendorUsername: string
  amount: number
  method: string
  transactionId?: string
}

export interface PasswordChangedData {
  userEmail: string
  username: string
}

export interface UsernameChangedData {
  userEmail: string
  oldUsername: string
  newUsername: string
}

export interface WelcomeData {
  userEmail: string
  username: string
}

export interface VerificationData {
  userEmail: string
  username: string
  verificationCode: string
}

export interface PasswordResetData {
  userEmail: string
  username: string
  resetCode: string
}

export interface VendorApprovedData {
  userEmail: string
  username: string
}

export interface VendorRejectedData {
  userEmail: string
  username: string
  rejectionReason?: string
}

export interface VendorResubmissionData {
  userEmail: string
  username: string
  resubmissionFields: string[]
  resubmissionInstructions?: string
}

// ============================================
// BOOSTING EMAIL TYPES
// ============================================

export interface BoostNewOfferData {
  customerEmail: string
  customerUsername: string
  boosterUsername: string
  currentRank: string
  desiredRank: string
  offerPrice: number
  estimatedDays?: number
  offerType: 'accept' | 'counter'
  requestId: string
}

export interface BoostOfferAcceptedData {
  boosterEmail: string
  boosterUsername: string
  customerUsername: string
  currentRank: string
  desiredRank: string
  finalPrice: number
  boosterPayout: number
  orderId: string
  orderNumber: string
}

export interface BoostCredentialsSubmittedData {
  boosterEmail: string
  boosterUsername: string
  customerUsername: string
  currentRank: string
  desiredRank: string
  orderId: string
  orderNumber: string
}

export interface BoostStartedData {
  customerEmail: string
  customerUsername: string
  boosterUsername: string
  currentRank: string
  desiredRank: string
  orderId: string
  orderNumber: string
}

export interface BoostProgressUpdateData {
  customerEmail: string
  customerUsername: string
  boosterUsername: string
  currentRank: string
  newRank: string
  newRR: number
  desiredRank: string
  gamesPlayed?: number
  gamesWon?: number
  notes?: string
  orderId: string
  orderNumber: string
}

export interface BoostPendingConfirmationData {
  customerEmail: string
  customerUsername: string
  boosterUsername: string
  startRank: string
  finalRank: string
  finalRR: number
  desiredRank: string
  totalGames?: number
  totalWins?: number
  orderId: string
  orderNumber: string
}

export interface BoostCompletedData {
  recipientEmail: string
  recipientUsername: string
  recipientType: 'customer' | 'booster'
  otherPartyUsername: string
  startRank: string
  finalRank: string
  desiredRank: string
  totalGames?: number
  totalWins?: number
  finalPrice: number
  boosterPayout?: number
  orderId: string
  orderNumber: string
}

// ============================================
// MESSAGING EMAIL TYPES
// ============================================

export interface NewMessageData {
  recipientEmail: string
  recipientUsername: string
  senderUsername: string
  messagePreview: string
  conversationId: string
  listingTitle?: string           // For marketplace conversations
  boostingOrderNumber?: string    // For boosting conversations
}