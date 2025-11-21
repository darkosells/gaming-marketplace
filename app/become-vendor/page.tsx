'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

export default function BecomeVendorPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [previousSubmission, setPreviousSubmission] = useState<any>(null)
  const [isResubmission, setIsResubmission] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '', dateOfBirth: '', phoneNumber: '', streetAddress: '', city: '', stateProvince: '', postalCode: '', country: 'United States',
    idType: 'drivers_license', verificationType: 'selfie', hasPreviousExperience: false, platformNames: '', platformUsernames: '', experienceDescription: ''
  })
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null)
  const [idBackFile, setIdBackFile] = useState<File | null>(null)
  const [verificationPhotoFile, setVerificationPhotoFile] = useState<File | null>(null)
  const [idFrontPreview, setIdFrontPreview] = useState<string>('')
  const [idBackPreview, setIdBackPreview] = useState<string>('')
  const [verificationPhotoPreview, setVerificationPhotoPreview] = useState<string>('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { checkUser() }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)
    if (profileData?.role === 'vendor') { alert('You are already a vendor!'); router.push('/dashboard'); return }
    await checkPreviousSubmission(user.id)
    setLoading(false)
  }

  const checkPreviousSubmission = async (userId: string) => {
    const { data: latestVerification } = await supabase.from('vendor_verifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single()
    
    if (!latestVerification) return
    
    if (latestVerification.status === 'pending') {
      alert('You already have a pending verification application.')
      router.push('/customer-dashboard')
      return
    }
    
    if (latestVerification.status === 'approved') {
      alert('You are already an approved vendor!')
      router.push('/dashboard')
      return
    }
    
    if (latestVerification.status === 'rejected') {
      if (latestVerification.can_resubmit) {
        setPreviousSubmission(latestVerification)
        setIsResubmission(true)
      } else {
        alert('Your vendor application was permanently rejected.')
        router.push('/customer-dashboard')
        return
      }
    }
  }

  const fieldNeedsCorrection = (fieldName: string) => {
    if (!isResubmission || !previousSubmission?.resubmission_fields) return false
    return previousSubmission.resubmission_fields.includes(fieldName)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'verification') => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('File too large. Max 10MB.'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { alert('Only JPG, PNG, WEBP allowed.'); return }
    
    if (type === 'front') { 
      setIdFrontFile(file)
      setIdFrontPreview(URL.createObjectURL(file))
    } else if (type === 'back') { 
      setIdBackFile(file)
      setIdBackPreview(URL.createObjectURL(file))
    } else {
      setVerificationPhotoFile(file)
      setVerificationPhotoPreview(URL.createObjectURL(file))
    }
  }

  const uploadDocument = async (file: File, type: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('verification-documents').upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (uploadError) throw uploadError
    const { data: signedData } = await supabase.storage.from('verification-documents').createSignedUrl(fileName, 7776000) // 90 days
    if (!signedData?.signedUrl) throw new Error('Failed to create signed URL')
    return signedData.signedUrl
  }

  const validateStep = (stepNum: number): boolean => {
    if (stepNum === 1) {
      if (!formData.fullName.trim() || formData.fullName.trim().length < 2) { alert('Enter your full legal name.'); return false }
      if (!formData.dateOfBirth) { alert('Enter your date of birth.'); return false }
      const age = Math.floor((Date.now() - new Date(formData.dateOfBirth).getTime()) / 31557600000)
      if (age < 18) { alert('You must be 18 or older.'); return false }
      if (!formData.phoneNumber || formData.phoneNumber.length < 10) { alert('Enter a valid phone number.'); return false }
    }
    if (stepNum === 2) {
      if (!formData.streetAddress.trim()) { alert('Enter your street address.'); return false }
      if (!formData.city.trim()) { alert('Enter your city.'); return false }
      if (!formData.stateProvince.trim()) { alert('Enter your state/province.'); return false }
      if (!formData.postalCode.trim()) { alert('Enter your postal code.'); return false }
    }
    if (stepNum === 3) {
      if (!idFrontFile) { alert('Upload the front of your ID.'); return false }
      if ((formData.idType === 'drivers_license' || formData.idType === 'national_id') && !idBackFile) { 
        alert('Upload the back of your ID.'); return false 
      }
      if (!verificationPhotoFile) { alert('Upload your verification photo.'); return false }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!agreedToTerms) { alert('You must agree to the terms.'); return }
    setSubmitting(true)
    try {
      const idFrontUrl = await uploadDocument(idFrontFile!, 'id_front')
      let idBackUrl: string | null = null
      if (idBackFile) { idBackUrl = await uploadDocument(idBackFile, 'id_back') }
      const verificationPhotoUrl = await uploadDocument(verificationPhotoFile!, formData.verificationType === 'selfie' ? 'selfie_with_id' : 'website_with_id')
      
      const submissionData = {
        user_id: user.id, full_name: formData.fullName.trim(), date_of_birth: formData.dateOfBirth, phone_number: formData.phoneNumber,
        street_address: formData.streetAddress.trim(), city: formData.city.trim(), state_province: formData.stateProvince.trim(),
        postal_code: formData.postalCode.trim(), country: formData.country, id_type: formData.idType,
        id_front_url: idFrontUrl, id_back_url: idBackUrl, selfie_with_id_url: verificationPhotoUrl,
        verification_type: formData.verificationType,
        has_previous_experience: formData.hasPreviousExperience,
        platform_names: formData.platformNames || null, platform_usernames: formData.platformUsernames || null,
        experience_description: formData.experienceDescription || null, status: 'pending',
        resubmission_count: isResubmission ? (previousSubmission.resubmission_count || 0) + 1 : 0,
        previous_submission_id: isResubmission ? previousSubmission.id : null
      }
      const { error: insertError } = await supabase.from('vendor_verifications').insert(submissionData)
      if (insertError) throw insertError
      if (isResubmission && previousSubmission) { 
        await supabase.from('vendor_verifications').update({ can_resubmit: false }).eq('id', previousSubmission.id) 
      }
      alert(isResubmission ? '✅ Resubmission successful! Your updated application is now under review.' : '✅ Application submitted! We will review it within 1-3 business days.')
      router.push('/customer-dashboard')
    } catch (error) { 
      console.error('Error:', error)
      alert('Failed to submit. Please try again.') 
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        {/* Cosmic Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Nebula Clouds */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          {/* Stars */}
          <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-[30%] left-[75%] w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-[50%] left-[8%] w-1.5 h-1.5 bg-pink-200 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-[70%] left-[60%] w-1 h-1 bg-cyan-200 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-[15%] left-[45%] w-1.5 h-1.5 bg-purple-200 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-[65%] left-[78%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.8s' }}></div>
          
          {/* Planets - Hidden on smallest screens */}
          <div className="hidden sm:block absolute top-[15%] right-[10%]">
            <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full shadow-lg relative">
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 sm:w-32 h-4 sm:h-6 border-2 sm:border-4 border-orange-300/60 rounded-full -rotate-12"></div>
            </div>
          </div>
          <div className="hidden sm:block absolute bottom-[20%] left-[8%]">
            <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-purple-500 to-violet-700 rounded-full shadow-lg relative">
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="text-white text-lg sm:text-xl relative z-10">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Cosmic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Nebula Clouds */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Twinkling Stars */}
        <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-[30%] left-[75%] w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-[50%] left-[8%] w-1.5 h-1.5 bg-pink-200 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[70%] left-[60%] w-1 h-1 bg-cyan-200 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-[15%] left-[45%] w-1.5 h-1.5 bg-purple-200 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[65%] left-[78%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.8s' }}></div>
        <div className="absolute top-[25%] left-[90%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.2s' }}></div>
        <div className="absolute top-[80%] left-[15%] w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '1.8s' }}></div>
        <div className="absolute top-[40%] left-[50%] w-1 h-1 bg-pink-200 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
        
        {/* Comic-style Planets - Hidden on smallest screens */}
        <div className="hidden sm:block absolute top-[15%] right-[10%]">
          <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 sm:w-32 h-4 sm:h-6 border-2 sm:border-4 border-orange-300/60 rounded-full -rotate-12"></div>
          </div>
        </div>
        <div className="hidden sm:block absolute bottom-[20%] left-[8%]">
          <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-purple-500 to-violet-700 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 rounded-full"></div>
            <div className="absolute top-[30%] left-0 right-0 h-1 bg-purple-300/40 rounded-full"></div>
          </div>
        </div>
        <div className="hidden sm:block absolute top-[60%] right-[5%]">
          <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-md">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/40 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Add padding to account for fixed navigation */}
      <div className="pt-16 lg:pt-20"></div>
      
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Hero Header - Mobile Optimized */}
          <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-center">
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">{isResubmission ? '🔄' : '🚀'}</div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4">
              {isResubmission ? 'Resubmit Vendor Application' : 'Become a Vendor'}
            </h1>
            <p className="text-gray-300 text-sm sm:text-base lg:text-lg">
              {isResubmission ? 'Fix the issues from your previous submission' : 'Complete the verification process to start selling on Nashflare'}
            </p>
          </div>

          {/* Resubmission Alert - Mobile Optimized */}
          {isResubmission && previousSubmission && (
            <div className="bg-yellow-500/10 backdrop-blur-lg border-2 border-yellow-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl lg:text-5xl">🔄</div>
                <div className="flex-1 w-full">
                  <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-2">Resubmission Required</h2>
                  <p className="text-gray-300 mb-4 text-sm sm:text-base">Your previous application needs corrections.</p>
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-5 mb-4 border border-yellow-500/20">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <span>⚠️</span> Fields to correct:
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {previousSubmission.resubmission_fields?.map((field: string) => (
                        <span key={field} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-500/20 text-yellow-300 rounded-full text-xs sm:text-sm font-medium border border-yellow-500/30">
                          {field.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
                      <span>📋</span> Admin Instructions:
                    </h3>
                    <p className="text-white bg-white/5 p-3 sm:p-4 rounded-lg whitespace-pre-wrap border border-white/10 text-xs sm:text-sm">
                      {previousSubmission.resubmission_instructions}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Steps - Mobile Optimized with Horizontal Scroll */}
          <div className="mb-6 sm:mb-8 lg:mb-10 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
            <div className="flex items-center min-w-max sm:min-w-0">
              {[
                { num: 1, label: 'Personal', icon: '👤' },
                { num: 2, label: 'Address', icon: '📍' },
                { num: 3, label: 'Verify', icon: '🔐' },
                { num: 4, label: 'Experience', icon: '⭐' }
              ].map((s, idx) => (
                <div key={s.num} className="flex items-center" style={{ flex: idx < 3 ? '1' : '0 0 auto' }}>
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-base sm:text-lg transition-all ${
                      step >= s.num 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-110' 
                        : 'bg-slate-800 text-gray-400'
                    }`}>
                      {s.icon}
                    </div>
                    <span className={`text-xs sm:text-sm mt-1.5 sm:mt-2 font-medium whitespace-nowrap ${step >= s.num ? 'text-white' : 'text-gray-500'}`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className={`flex-1 h-1 mx-2 sm:mx-3 rounded transition-all min-w-[30px] sm:min-w-[40px] ${
                      step > s.num ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-800'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Container - Mobile Optimized */}
          <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="text-3xl sm:text-4xl">👤</div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Personal Information</h2>
                </div>
                
                <div className={fieldNeedsCorrection('full_name') ? 'ring-2 ring-yellow-500 rounded-xl p-1' : ''}>
                  <label className="block text-xs sm:text-sm font-semibold text-white mb-2">
                    Full Legal Name {fieldNeedsCorrection('full_name') && <span className="text-yellow-400 text-xs ml-2">⚠️ Needs correction</span>}
                  </label>
                  <input 
                    type="text" 
                    value={formData.fullName} 
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} 
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition text-sm sm:text-base" 
                    placeholder="As shown on your government-issued ID" 
                  />
                </div>

                <div className={fieldNeedsCorrection('date_of_birth') ? 'ring-2 ring-yellow-500 rounded-xl p-1' : ''}>
                  <label className="block text-xs sm:text-sm font-semibold text-white mb-2">
                    Date of Birth {fieldNeedsCorrection('date_of_birth') && <span className="text-yellow-400 text-xs ml-2">⚠️ Needs correction</span>}
                  </label>
                  <input 
                    type="date" 
                    value={formData.dateOfBirth} 
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} 
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition text-sm sm:text-base" 
                  />
                  <p className="text-xs text-gray-400 mt-1">You must be at least 18 years old</p>
                </div>

                <div className={fieldNeedsCorrection('phone_number') ? 'ring-2 ring-yellow-500 rounded-xl p-1' : ''}>
                  <label className="block text-xs sm:text-sm font-semibold text-white mb-2">
                    Phone Number {fieldNeedsCorrection('phone_number') && <span className="text-yellow-400 text-xs ml-2">⚠️ Needs correction</span>}
                  </label>
                  <input 
                    type="tel" 
                    value={formData.phoneNumber} 
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} 
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition text-sm sm:text-base" 
                    placeholder="+1 (555) 123-4567" 
                  />
                </div>

                <button 
                  onClick={() => validateStep(1) && setStep(2)} 
                  className="w-full mt-6 sm:mt-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  Continue
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            )}

            {/* Step 2: Address Information */}
            {step === 2 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="text-3xl sm:text-4xl">📍</div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Address Information</h2>
                </div>
                
                <div className={`space-y-4 sm:space-y-6 ${fieldNeedsCorrection('address') ? 'ring-2 ring-yellow-500 rounded-xl p-2 sm:p-3' : ''}`}>
                  {fieldNeedsCorrection('address') && <p className="text-yellow-400 text-xs sm:text-sm mb-2">⚠️ Address needs correction</p>}
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-white mb-2">Street Address</label>
                    <input 
                      type="text" 
                      value={formData.streetAddress} 
                      onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })} 
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition text-sm sm:text-base" 
                      placeholder="123 Main Street, Apt 4B"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-white mb-2">City</label>
                      <input 
                        type="text" 
                        value={formData.city} 
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                        className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition text-sm sm:text-base" 
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-white mb-2">State/Province</label>
                      <input 
                        type="text" 
                        value={formData.stateProvince} 
                        onChange={(e) => setFormData({ ...formData, stateProvince: e.target.value })} 
                        className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition text-sm sm:text-base" 
                        placeholder="NY"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-white mb-2">Postal Code</label>
                      <input 
                        type="text" 
                        value={formData.postalCode} 
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} 
                        className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition text-sm sm:text-base" 
                        placeholder="10001"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-white mb-2">Country</label>
                      <select 
                        value={formData.country} 
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })} 
                        className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition text-sm sm:text-base"
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Australia">Australia</option>
                        <option value="Japan">Japan</option>
                        <option value="South Korea">South Korea</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <button 
                    onClick={() => setStep(1)} 
                    className="w-full sm:flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 sm:py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back
                  </button>
                  <button 
                    onClick={() => validateStep(2) && setStep(3)} 
                    className="w-full sm:flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 sm:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    Continue
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: ID Verification - Mobile Optimized */}
            {step === 3 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="text-3xl sm:text-4xl">🔐</div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Identity Verification</h2>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="text-2xl sm:text-3xl flex-shrink-0">🔒</div>
                    <div>
                      <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">Your Security Matters</h3>
                      <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                        All verification documents are encrypted and stored securely for up to 90 days after submission for security purposes. 
                        Your information is protected and only used for identity verification.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={fieldNeedsCorrection('id_type') ? 'ring-2 ring-yellow-500 rounded-xl p-2' : ''}>
                  {fieldNeedsCorrection('id_type') && <p className="text-yellow-400 text-xs sm:text-sm mb-2">⚠️ ID Type needs correction</p>}
                  <label className="block text-xs sm:text-sm font-semibold text-white mb-2">ID Type</label>
                  <select 
                    value={formData.idType} 
                    onChange={(e) => setFormData({ ...formData, idType: e.target.value })} 
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition text-sm sm:text-base"
                  >
                    <option value="drivers_license">Driver's License</option>
                    <option value="passport">Passport</option>
                    <option value="national_id">National ID Card</option>
                  </select>
                </div>

                <div className={`grid grid-cols-1 ${(formData.idType === 'drivers_license' || formData.idType === 'national_id') ? 'sm:grid-cols-2' : ''} gap-4 sm:gap-6 ${(fieldNeedsCorrection('id_front') || fieldNeedsCorrection('id_back')) ? 'ring-2 ring-yellow-500 rounded-xl p-2 sm:p-3' : ''}`}>
                  {(fieldNeedsCorrection('id_front') || fieldNeedsCorrection('id_back')) && (
                    <p className="text-yellow-400 text-xs sm:text-sm mb-2 col-span-full">⚠️ ID photos need to be resubmitted</p>
                  )}
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">
                      Front of ID <span className="text-red-400">*</span>
                    </label>
                    <div className="border-2 border-dashed border-slate-600 hover:border-purple-500/50 rounded-xl p-4 sm:p-6 text-center transition-all cursor-pointer bg-slate-800/30">
                      {idFrontPreview ? (
                        <div>
                          <img src={idFrontPreview} alt="ID Front" className="max-h-40 sm:max-h-48 mx-auto rounded-lg mb-2 sm:mb-3" />
                          <button 
                            onClick={() => { setIdFrontFile(null); setIdFrontPreview('') }} 
                            className="text-red-400 hover:text-red-300 text-xs sm:text-sm font-medium transition"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">📄</div>
                          <p className="text-white font-medium mb-1 text-sm sm:text-base">Click to upload</p>
                          <p className="text-gray-400 text-xs">JPG, PNG or WEBP (Max 10MB)</p>
                          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'front')} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  {(formData.idType === 'drivers_license' || formData.idType === 'national_id') && (
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">
                        Back of ID <span className="text-red-400">*</span>
                      </label>
                      <div className="border-2 border-dashed border-slate-600 hover:border-purple-500/50 rounded-xl p-4 sm:p-6 text-center transition-all cursor-pointer bg-slate-800/30">
                        {idBackPreview ? (
                          <div>
                            <img src={idBackPreview} alt="ID Back" className="max-h-40 sm:max-h-48 mx-auto rounded-lg mb-2 sm:mb-3" />
                            <button 
                              onClick={() => { setIdBackFile(null); setIdBackPreview('') }} 
                              className="text-red-400 hover:text-red-300 text-xs sm:text-sm font-medium transition"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block">
                            <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">📄</div>
                            <p className="text-white font-medium mb-1 text-sm sm:text-base">Click to upload</p>
                            <p className="text-gray-400 text-xs">JPG, PNG or WEBP (Max 10MB)</p>
                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'back')} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Verification Photo Section - Mobile Optimized */}
                <div className={`${fieldNeedsCorrection('verification') ? 'ring-2 ring-yellow-500 rounded-xl p-2 sm:p-3' : ''}`}>
                  {fieldNeedsCorrection('verification') && <p className="text-yellow-400 text-xs sm:text-sm mb-2">⚠️ Verification photo needs to be resubmitted</p>}
                  
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 sm:p-5 mb-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="text-2xl sm:text-3xl flex-shrink-0">📸</div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">Verification Photo Required</h3>
                        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-3">
                          Choose one of the following verification methods:
                        </p>
                        
                        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                          <label className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-800/30 rounded-lg cursor-pointer hover:bg-slate-800/50 transition">
                            <input 
                              type="radio" 
                              name="verificationType" 
                              value="selfie" 
                              checked={formData.verificationType === 'selfie'}
                              onChange={(e) => setFormData({ ...formData, verificationType: e.target.value })}
                              className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 accent-purple-500 flex-shrink-0" 
                            />
                            <div className="min-w-0">
                              <span className="text-white font-medium block text-xs sm:text-sm">Option 1: Selfie with ID</span>
                              <p className="text-gray-400 text-xs mt-1">Take a selfie while holding your ID next to your face</p>
                            </div>
                          </label>
                          
                          <label className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-800/30 rounded-lg cursor-pointer hover:bg-slate-800/50 transition">
                            <input 
                              type="radio" 
                              name="verificationType" 
                              value="website" 
                              checked={formData.verificationType === 'website'}
                              onChange={(e) => setFormData({ ...formData, verificationType: e.target.value })}
                              className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 accent-purple-500 flex-shrink-0" 
                            />
                            <div className="min-w-0">
                              <span className="text-white font-medium block text-xs sm:text-sm">Option 2: Website with ID</span>
                              <p className="text-gray-400 text-xs mt-1">Take a photo of this website displayed on a screen with your ID clearly visible in the same photo</p>
                            </div>
                          </label>
                        </div>
                        
                        <ul className="text-gray-300 text-xs space-y-1">
                          <li>✓ Good lighting on both {formData.verificationType === 'selfie' ? 'face' : 'screen'} and ID</li>
                          <li>✓ ID document clearly readable</li>
                          <li>✓ {formData.verificationType === 'selfie' ? 'Your face clearly visible' : 'Website URL clearly visible'}</li>
                          <li>✓ Photo taken recently</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <label className="block text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">
                    {formData.verificationType === 'selfie' ? 'Selfie with ID' : 'Website with ID Photo'} <span className="text-red-400">*</span>
                  </label>
                  <div className="border-2 border-dashed border-slate-600 hover:border-purple-500/50 rounded-xl p-6 sm:p-8 text-center transition-all cursor-pointer bg-slate-800/30">
                    {verificationPhotoPreview ? (
                      <div>
                        <img src={verificationPhotoPreview} alt="Verification Photo" className="max-h-48 sm:max-h-64 mx-auto rounded-lg mb-3 sm:mb-4" />
                        <button 
                          onClick={() => { setVerificationPhotoFile(null); setVerificationPhotoPreview('') }} 
                          className="text-red-400 hover:text-red-300 text-xs sm:text-sm font-medium transition"
                        >
                          Remove and retake
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">📸</div>
                        <p className="text-white font-medium text-base sm:text-lg mb-2">
                          {formData.verificationType === 'selfie' 
                            ? 'Take or Upload Selfie with ID' 
                            : 'Take or Upload Website with ID Photo'}
                        </p>
                        <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
                          {formData.verificationType === 'selfie' 
                            ? 'Hold your ID next to your face' 
                            : 'Show this website on screen with your ID'}
                        </p>
                        <p className="text-gray-500 text-xs">JPG, PNG or WEBP (Max 10MB)</p>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'verification')} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <button 
                    onClick={() => setStep(2)} 
                    className="w-full sm:flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 sm:py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back
                  </button>
                  <button 
                    onClick={() => validateStep(3) && setStep(4)} 
                    className="w-full sm:flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 sm:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    Continue
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Vendor Experience - Mobile Optimized */}
            {step === 4 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="text-3xl sm:text-4xl">⭐</div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Vendor Experience</h2>
                </div>
                
                <div className={fieldNeedsCorrection('experience') ? 'ring-2 ring-yellow-500 rounded-xl p-2 sm:p-3' : ''}>
                  {fieldNeedsCorrection('experience') && <p className="text-yellow-400 text-xs sm:text-sm mb-3">⚠️ Experience info needs correction</p>}
                  
                  <label className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-800/30 rounded-xl cursor-pointer hover:bg-slate-800/50 transition border border-slate-700">
                    <input 
                      type="checkbox" 
                      checked={formData.hasPreviousExperience} 
                      onChange={(e) => setFormData({ ...formData, hasPreviousExperience: e.target.checked })} 
                      className="w-4 h-4 sm:w-5 sm:h-5 mt-1 accent-purple-500 flex-shrink-0" 
                    />
                    <div className="min-w-0">
                      <span className="text-white font-medium text-sm sm:text-base">I have previous experience selling on similar platforms</span>
                      <p className="text-gray-400 text-xs sm:text-sm mt-1">This helps us understand your background</p>
                    </div>
                  </label>

                  {formData.hasPreviousExperience && (
                    <div className="space-y-3 sm:space-y-4 bg-slate-800/30 p-4 sm:p-5 rounded-xl mt-4 border border-slate-700">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white mb-2">Platform Names</label>
                        <input 
                          type="text" 
                          value={formData.platformNames} 
                          onChange={(e) => setFormData({ ...formData, platformNames: e.target.value })} 
                          className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition text-sm sm:text-base" 
                          placeholder="e.g., G2G, Eldorado.gg, PlayerAuctions" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white mb-2">Your Usernames on Those Platforms</label>
                        <input 
                          type="text" 
                          value={formData.platformUsernames} 
                          onChange={(e) => setFormData({ ...formData, platformUsernames: e.target.value })} 
                          className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition text-sm sm:text-base" 
                          placeholder="Your seller usernames" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-white mb-2">Experience Description</label>
                        <textarea 
                          value={formData.experienceDescription} 
                          onChange={(e) => setFormData({ ...formData, experienceDescription: e.target.value })} 
                          rows={4} 
                          className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition text-sm sm:text-base" 
                          placeholder="Tell us about your selling experience, transaction volume, feedback ratings, etc." 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Terms Agreement - Mobile Optimized */}
                <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-xl p-4 sm:p-5 mt-4 sm:mt-6">
                  <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={agreedToTerms} 
                      onChange={(e) => setAgreedToTerms(e.target.checked)} 
                      className="w-4 h-4 sm:w-5 sm:h-5 mt-1 accent-purple-500 flex-shrink-0" 
                    />
                    <div className="text-white text-xs sm:text-sm leading-relaxed min-w-0">
                      <p className="font-semibold mb-2">Terms and Conditions</p>
                      <p className="text-gray-300">
                        I agree to Nashflare's Terms of Service and Privacy Policy. I confirm that:
                      </p>
                      <ul className="mt-2 space-y-1 text-gray-300">
                        <li>• All information provided is accurate and truthful</li>
                        <li>• I am at least 18 years old</li>
                        <li>• I understand verification documents are stored securely for 90 days</li>
                        <li>• I will comply with all marketplace rules and regulations</li>
                      </ul>
                    </div>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <button 
                    onClick={() => setStep(3)} 
                    className="w-full sm:flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 sm:py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    Back
                  </button>
                  <button 
                    onClick={handleSubmit} 
                    disabled={submitting || !agreedToTerms} 
                    className="w-full sm:flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-sm sm:text-base">Submitting...</span>
                      </>
                    ) : isResubmission ? (
                      <>
                        🔄 Resubmit Application
                      </>
                    ) : (
                      <>
                        ✅ Submit Application
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}