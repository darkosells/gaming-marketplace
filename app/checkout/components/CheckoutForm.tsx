// app/checkout/components/CheckoutForm.tsx - Billing information form

'use client'

import { BillingInfo, FormErrors } from '../types'

interface CheckoutFormProps {
  billingInfo: BillingInfo
  setBillingInfo: (info: BillingInfo) => void
  formErrors: FormErrors
  setFormErrors: (errors: FormErrors) => void
}

export default function CheckoutForm({
  billingInfo,
  setBillingInfo,
  formErrors,
  setFormErrors
}: CheckoutFormProps) {
  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
        <span className="text-purple-400">📝</span>
        Contact Information
      </h2>

      <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-white font-medium mb-2 text-xs sm:text-sm">First Name *</label>
          <input
            type="text"
            value={billingInfo.firstName}
            onChange={(e) => {
              setBillingInfo({ ...billingInfo, firstName: e.target.value })
              if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: '' })
            }}
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800 border ${formErrors.firstName ? 'border-red-500' : 'border-white/10'} text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors`}
            placeholder="John"
            required
          />
          {formErrors.firstName && <p className="text-red-400 text-xs mt-1">{formErrors.firstName}</p>}
        </div>
        <div>
          <label className="block text-white font-medium mb-2 text-xs sm:text-sm">Last Name *</label>
          <input
            type="text"
            value={billingInfo.lastName}
            onChange={(e) => {
              setBillingInfo({ ...billingInfo, lastName: e.target.value })
              if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: '' })
            }}
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800 border ${formErrors.lastName ? 'border-red-500' : 'border-white/10'} text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors`}
            placeholder="Doe"
            required
          />
          {formErrors.lastName && <p className="text-red-400 text-xs mt-1">{formErrors.lastName}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-white font-medium mb-2 text-xs sm:text-sm">Email *</label>
          <input
            type="email"
            value={billingInfo.email}
            onChange={(e) => {
              setBillingInfo({ ...billingInfo, email: e.target.value })
              if (formErrors.email) setFormErrors({ ...formErrors, email: '' })
            }}
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-800 border ${formErrors.email ? 'border-red-500' : 'border-white/10'} text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors`}
            placeholder="john@example.com"
            required
          />
          {formErrors.email && <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>}
        </div>
      </div>
      
      {/* Email confirmation note */}
      <div className="mt-4 flex items-start gap-2 text-gray-400 text-xs">
        <span className="text-green-400">✉️</span>
        <span>Order confirmation and delivery details will be sent to <span className="text-white">{billingInfo.email || 'your email'}</span></span>
      </div>
    </div>
  )
}