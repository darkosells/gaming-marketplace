'use client'

import { FraudFlag, AdminVerification } from '../../types'

// ================================
// Agreement Modal
// ================================
interface AgreementModalProps {
  isOpen: boolean
  verification: AdminVerification | null
  agreementAccepted: boolean
  setAgreementAccepted: (accepted: boolean) => void
  onAccept: () => void
  onClose: () => void
}

export function AgreementModal({
  isOpen,
  verification,
  agreementAccepted,
  setAgreementAccepted,
  onAccept,
  onClose
}: AgreementModalProps) {
  if (!isOpen || !verification) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-red-900 border-2 border-red-500/50 rounded-2xl p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Sensitive Document Access</h2>
          <p className="text-gray-300">
            Viewing documents for{' '}
            <strong className="text-white">{verification.user?.username || 'Unknown'}</strong>
          </p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-sm text-gray-300">
          <p>• Access will be logged</p>
          <p>• One-time view only</p>
          <p>• Documents deleted after decision</p>
          <p>• Do not screenshot or share</p>
        </div>
        <div className="flex items-start gap-3 mb-6">
          <input
            type="checkbox"
            checked={agreementAccepted}
            onChange={(e) => setAgreementAccepted(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded"
          />
          <label className="text-white text-sm">
            I agree to handle this information responsibly.
          </label>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onAccept}
            disabled={!agreementAccepted}
            className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition"
          >
            View Documents
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 text-white py-3 rounded-lg hover:bg-white/20 transition border border-white/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ================================
// Verification Details Modal
// ================================
interface VerificationDetailsModalProps {
  isOpen: boolean
  verification: AdminVerification | null
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}

export function VerificationDetailsModal({
  isOpen,
  verification,
  onClose,
  onApprove,
  onReject
}: VerificationDetailsModalProps) {
  if (!isOpen || !verification) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-white/20 rounded-2xl p-8 max-w-4xl w-full my-8">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Verification Review</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition"
          >
            ✕
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Personal Info</h3>
            <p className="text-gray-400 text-xs">Name</p>
            <p className="text-white mb-2">{verification.full_name || 'N/A'}</p>
            <p className="text-gray-400 text-xs">DOB</p>
            <p className="text-white mb-2">
              {verification.date_of_birth 
                ? new Date(verification.date_of_birth).toLocaleDateString() 
                : 'N/A'}
            </p>
            <p className="text-gray-400 text-xs">Phone</p>
            <p className="text-white mb-2">{verification.phone_number || 'N/A'}</p>
            <p className="text-gray-400 text-xs">Username</p>
            <p className="text-purple-400 font-semibold">{verification.user?.username || 'N/A'}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Address</h3>
            <p className="text-white mb-2">{verification.street_address || 'N/A'}</p>
            <p className="text-white mb-2">
              {[verification.city, verification.state_province].filter(Boolean).join(', ') || 'N/A'}
            </p>
            <p className="text-white">
              {[verification.postal_code, verification.country].filter(Boolean).join(', ') || 'N/A'}
            </p>
          </div>
          {!verification.documents_cleared && verification.id_front_url && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">
                ID Documents <span className="text-xs text-red-400">(One-time view)</span>
              </h3>
              <p className="text-gray-400 text-xs mb-2">
                Type: {verification.id_type?.replace('_', ' ') || 'N/A'}
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-2">Front</p>
                  <img
                    src={verification.id_front_url}
                    alt="ID Front"
                    className="w-full rounded-lg"
                  />
                </div>
                {verification.id_back_url && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Back</p>
                    <img
                      src={verification.id_back_url}
                      alt="ID Back"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          {verification.documents_cleared && (
            <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 md:col-span-2 text-center">
              <span className="text-3xl">🔒</span>
              <p className="text-gray-400 mt-2">Documents permanently deleted</p>
            </div>
          )}
          {verification.has_previous_experience && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4">Vendor Experience</h3>
              {verification.platform_names && (
                <p className="text-white mb-2">Platforms: {verification.platform_names}</p>
              )}
              {verification.platform_usernames && (
                <p className="text-white mb-2">Usernames: {verification.platform_usernames}</p>
              )}
              {verification.experience_description && (
                <p className="text-white">{verification.experience_description}</p>
              )}
            </div>
          )}
        </div>
        {verification.status === 'pending' && (
          <div className="flex gap-4 mt-8">
            <button
              onClick={onApprove}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-green-500/30 transition"
            >
              ✅ Approve
            </button>
            <button
              onClick={onReject}
              className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-red-500/30 transition"
            >
              ❌ Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ================================
// Verification Decision Modal
// ================================
interface VerificationDecisionModalProps {
  isOpen: boolean
  decisionType: 'approve' | 'reject' | null
  rejectionType: 'resubmission_required' | 'permanent'
  setRejectionType: (type: 'resubmission_required' | 'permanent') => void
  rejectionReason: string
  setRejectionReason: (reason: string) => void
  adminNotes: string
  setAdminNotes: (notes: string) => void
  resubmissionFields: string[]
  setResubmissionFields: (fields: string[]) => void
  resubmissionInstructions: string
  setResubmissionInstructions: (instructions: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function VerificationDecisionModal({
  isOpen,
  decisionType,
  rejectionType,
  setRejectionType,
  rejectionReason,
  setRejectionReason,
  adminNotes,
  setAdminNotes,
  resubmissionFields,
  setResubmissionFields,
  resubmissionInstructions,
  setResubmissionInstructions,
  onConfirm,
  onClose
}: VerificationDecisionModalProps) {
  if (!isOpen || !decisionType) return null

  const isReject = decisionType === 'reject'

  const isDisabled =
    isReject &&
    ((rejectionType === 'resubmission_required' &&
      (resubmissionFields.length === 0 || resubmissionInstructions.trim().length < 20)) ||
      (rejectionType === 'permanent' && rejectionReason.trim().length < 10))

  const resubmissionFieldOptions = [
    { id: 'id_front', label: 'ID Front Photo' },
    { id: 'id_back', label: 'ID Back Photo' },
    { id: 'full_name', label: 'Full Name' },
    { id: 'date_of_birth', label: 'Date of Birth' },
    { id: 'phone_number', label: 'Phone Number' },
    { id: 'address', label: 'Address Information' },
    { id: 'id_type', label: 'ID Type Selection' },
    { id: 'experience', label: 'Vendor Experience Info' }
  ]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div
        className={`border-2 rounded-2xl p-8 max-w-2xl w-full my-8 ${
          decisionType === 'approve'
            ? 'bg-gradient-to-br from-slate-900 to-green-900 border-green-500/50'
            : 'bg-gradient-to-br from-slate-900 to-red-900 border-red-500/50'
        }`}
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          {decisionType === 'approve' ? '✅ Approve Vendor' : '❌ Reject Application'}
        </h2>
        <p className="text-gray-300 mb-6">
          {decisionType === 'approve'
            ? 'User will become a vendor and can start selling.'
            : 'Choose rejection type below.'}
        </p>

        {isReject && (
          <>
            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">Rejection Type</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setRejectionType('resubmission_required')}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    rejectionType === 'resubmission_required'
                      ? 'border-yellow-500 bg-yellow-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-2">🔄</div>
                  <div className="text-white font-semibold">Request Resubmission</div>
                  <div className="text-gray-400 text-sm mt-1">
                    User can fix issues and reapply.
                  </div>
                </button>
                <button
                  onClick={() => setRejectionType('permanent')}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    rejectionType === 'permanent'
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-2">🚫</div>
                  <div className="text-white font-semibold">Permanent Rejection</div>
                  <div className="text-gray-400 text-sm mt-1">User cannot reapply.</div>
                </button>
              </div>
            </div>

            {rejectionType === 'resubmission_required' && (
              <>
                <div className="mb-4">
                  <label className="block text-white font-semibold mb-3">
                    Fields That Need Resubmission <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {resubmissionFieldOptions.map((field) => (
                      <label
                        key={field.id}
                        className="flex items-center gap-2 text-white text-sm bg-white/5 p-2 rounded cursor-pointer hover:bg-white/10 transition border border-white/10"
                      >
                        <input
                          type="checkbox"
                          checked={resubmissionFields.includes(field.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setResubmissionFields([...resubmissionFields, field.id])
                            } else {
                              setResubmissionFields(
                                resubmissionFields.filter((f) => f !== field.id)
                              )
                            }
                          }}
                          className="w-4 h-4 rounded"
                        />
                        {field.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-white font-semibold mb-2">
                    Resubmission Instructions <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={resubmissionInstructions}
                    onChange={(e) => setResubmissionInstructions(e.target.value)}
                    placeholder="Explain clearly what the user needs to fix..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {resubmissionInstructions.length}/1000 (minimum 20)
                  </p>
                </div>
              </>
            )}

            {rejectionType === 'permanent' && (
              <div className="mb-4">
                <label className="block text-white font-semibold mb-2">
                  Permanent Rejection Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this application is permanently rejected..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {rejectionReason.length}/500 (minimum 10)
                </p>
              </div>
            )}
          </>
        )}

        <div className="mb-6">
          <label className="block text-white font-semibold mb-2">
            Admin Notes (Internal Only)
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Notes for other admins..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isDisabled}
            className={`flex-1 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
              decisionType === 'approve'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/30'
                : rejectionType === 'permanent'
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:shadow-red-500/30'
                : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg hover:shadow-yellow-500/30'
            }`}
          >
            {decisionType === 'approve'
              ? 'Confirm Approval'
              : rejectionType === 'permanent'
              ? 'Permanently Reject'
              : 'Request Resubmission'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg font-semibold border border-white/10 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ================================
// Withdrawal Modals
// ================================
interface ApproveWithdrawalModalProps {
  isOpen: boolean
  transactionId: string
  setTransactionId: (id: string) => void
  notes: string
  setNotes: (notes: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function ApproveWithdrawalModal({
  isOpen,
  transactionId,
  setTransactionId,
  notes,
  setNotes,
  onConfirm,
  onClose
}: ApproveWithdrawalModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-green-900 border-2 border-green-500/50 rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-6">✅ Approve Withdrawal</h2>
        <div className="mb-4">
          <label className="block text-white text-sm mb-2">Transaction ID *</label>
          <input
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="BTC hash or Skrill ref..."
          />
        </div>
        <div className="mb-6">
          <label className="block text-white text-sm mb-2">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={3}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={!transactionId.trim()}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition"
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 text-white py-3 rounded-lg hover:bg-white/20 transition border border-white/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

interface RejectWithdrawalModalProps {
  isOpen: boolean
  reason: string
  setReason: (reason: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function RejectWithdrawalModal({
  isOpen,
  reason,
  setReason,
  onConfirm,
  onClose
}: RejectWithdrawalModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-red-900 border-2 border-red-500/50 rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-6">❌ Reject Withdrawal</h2>
        <div className="mb-6">
          <label className="block text-white text-sm mb-2">Rejection Reason *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            rows={4}
            placeholder="Min 5 characters..."
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={reason.trim().length < 5}
            className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition"
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 text-white py-3 rounded-lg hover:bg-white/20 transition border border-white/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ================================
// Fraud Review Modal
// ================================
interface FraudReviewModalProps {
  isOpen: boolean
  flag: FraudFlag | null
  reviewStatus: 'reviewed' | 'resolved' | 'false_positive'
  setReviewStatus: (status: 'reviewed' | 'resolved' | 'false_positive') => void
  reviewNotes: string
  setReviewNotes: (notes: string) => void
  onConfirm: () => void
  onClose: () => void
}

export function FraudReviewModal({
  isOpen,
  flag,
  reviewStatus,
  setReviewStatus,
  reviewNotes,
  setReviewNotes,
  onConfirm,
  onClose
}: FraudReviewModalProps) {
  if (!isOpen || !flag) return null

  const getSeverityStyles = (severity: FraudFlag['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white'
      case 'high':
        return 'bg-orange-500 text-white'
      case 'medium':
        return 'bg-yellow-500 text-black'
      default:
        return 'bg-blue-500 text-white'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-red-900 border-2 border-red-500/50 rounded-2xl p-8 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-white mb-6">Review Fraud Flag</h2>

        <div className="mb-6 space-y-4">
          <div>
            <p className="text-gray-400 text-sm">User</p>
            <p className="text-white font-bold">{flag.user?.username || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Flag Type</p>
            <p className="text-white">{flag.type.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Severity</p>
            <span
              className={`px-3 py-1 rounded text-sm font-bold ${getSeverityStyles(flag.severity)}`}
            >
              {flag.severity.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Description</p>
            <p className="text-white">{flag.description}</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-white font-semibold mb-2">Review Status</label>
          <select
            value={reviewStatus}
            onChange={(e) => setReviewStatus(e.target.value as any)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white"
          >
            <option value="reviewed">Reviewed (No Action)</option>
            <option value="resolved">Resolved (Issue Fixed)</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-white font-semibold mb-2">Review Notes</label>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Add your review notes..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold"
          >
            Submit Review
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 text-white py-3 rounded-lg hover:bg-white/20 transition border border-white/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}