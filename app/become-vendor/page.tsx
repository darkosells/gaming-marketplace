'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

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
    idType: 'drivers_license', hasPreviousExperience: false, platformNames: '', platformUsernames: '', experienceDescription: ''
  })
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null)
  const [idBackFile, setIdBackFile] = useState<File | null>(null)
  const [idFrontPreview, setIdFrontPreview] = useState<string>('')
  const [idBackPreview, setIdBackPreview] = useState<string>('')
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
    // Get the most recent verification only
    const { data: latestVerification } = await supabase.from('vendor_verifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single()
    
    if (!latestVerification) return // No previous submissions, allow new application
    
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
        // Allow resubmission
        setPreviousSubmission(latestVerification)
        setIsResubmission(true)
      } else {
        // Permanently rejected
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('File too large. Max 10MB.'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { alert('Only JPG, PNG, WEBP allowed.'); return }
    if (side === 'front') { setIdFrontFile(file); setIdFrontPreview(URL.createObjectURL(file)) } 
    else { setIdBackFile(file); setIdBackPreview(URL.createObjectURL(file)) }
  }

  const uploadDocument = async (file: File, side: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/id_${side}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('verification-documents').upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (uploadError) throw uploadError
    const { data: signedData } = await supabase.storage.from('verification-documents').createSignedUrl(fileName, 31536000)
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
      if ((formData.idType === 'drivers_license' || formData.idType === 'national_id') && !idBackFile) { alert('Upload the back of your ID.'); return false }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!agreedToTerms) { alert('You must agree to the terms.'); return }
    setSubmitting(true)
    try {
      const idFrontUrl = await uploadDocument(idFrontFile!, 'front')
      let idBackUrl = null
      if (idBackFile) { idBackUrl = await uploadDocument(idBackFile, 'back') }
      const submissionData = {
        user_id: user.id, full_name: formData.fullName.trim(), date_of_birth: formData.dateOfBirth, phone_number: formData.phoneNumber,
        street_address: formData.streetAddress.trim(), city: formData.city.trim(), state_province: formData.stateProvince.trim(),
        postal_code: formData.postalCode.trim(), country: formData.country, id_type: formData.idType,
        id_front_url: idFrontUrl, id_back_url: idBackUrl, has_previous_experience: formData.hasPreviousExperience,
        platform_names: formData.platformNames || null, platform_usernames: formData.platformUsernames || null,
        experience_description: formData.experienceDescription || null, status: 'pending',
        resubmission_count: isResubmission ? (previousSubmission.resubmission_count || 0) + 1 : 0,
        previous_submission_id: isResubmission ? previousSubmission.id : null
      }
      const { error: insertError } = await supabase.from('vendor_verifications').insert(submissionData)
      if (insertError) throw insertError
      if (isResubmission && previousSubmission) { await supabase.from('vendor_verifications').update({ can_resubmit: false }).eq('id', previousSubmission.id) }
      alert(isResubmission ? '✅ Resubmission successful! Your updated application is now under review.' : '✅ Application submitted! We will review it within 1-3 business days.')
      router.push('/customer-dashboard')
    } catch (error) { console.error('Error:', error); alert('Failed to submit. Please try again.') }
    setSubmitting(false)
  }

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center"><div className="text-white text-xl">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="bg-black/30 backdrop-blur-lg border-b border-white/10"><div className="container mx-auto px-4"><div className="flex items-center justify-between h-16"><Link href="/" className="flex items-center space-x-2"><div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center"><span className="text-2xl">🎮</span></div><span className="text-xl font-bold text-white">GameVault</span></Link><Link href="/customer-dashboard" className="text-gray-300 hover:text-white">← Back to Dashboard</Link></div></div></nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">{isResubmission ? '🔄 Resubmit Vendor Application' : '🚀 Become a Vendor'}</h1>
            <p className="text-gray-300">{isResubmission ? 'Fix the issues from your previous submission' : 'Complete the verification process to start selling'}</p>
          </div>

          {isResubmission && previousSubmission && (
            <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🔄</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-yellow-400 mb-2">Resubmission Required</h2>
                  <p className="text-gray-300 mb-4">Your previous application needs corrections.</p>
                  <div className="bg-black/30 rounded-lg p-4 mb-4">
                    <h3 className="text-white font-semibold mb-2">Fields to correct:</h3>
                    <div className="flex flex-wrap gap-2 mb-3">{previousSubmission.resubmission_fields?.map((field: string) => (<span key={field} className="px-3 py-1 bg-yellow-500/30 text-yellow-300 rounded-full text-sm font-medium">⚠️ {field.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>))}</div>
                    <h3 className="text-white font-semibold mb-2">Admin Instructions:</h3>
                    <p className="text-white bg-white/5 p-3 rounded-lg whitespace-pre-wrap">{previousSubmission.resubmission_instructions}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (<div key={s} className="flex items-center"><div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400'}`}>{s}</div>{s < 4 && <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-purple-500' : 'bg-white/10'}`} />}</div>))}
          </div>

          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Personal Information</h2>
                <div className="space-y-4">
                  <div className={fieldNeedsCorrection('full_name') ? 'ring-2 ring-yellow-500 rounded-lg p-1' : ''}>
                    <label className="block text-sm font-semibold text-white mb-2">Full Legal Name {fieldNeedsCorrection('full_name') && <span className="text-yellow-400 text-xs">⚠️ Needs correction</span>}</label>
                    <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="As shown on your ID" />
                  </div>
                  <div className={fieldNeedsCorrection('date_of_birth') ? 'ring-2 ring-yellow-500 rounded-lg p-1' : ''}>
                    <label className="block text-sm font-semibold text-white mb-2">Date of Birth {fieldNeedsCorrection('date_of_birth') && <span className="text-yellow-400 text-xs">⚠️ Needs correction</span>}</label>
                    <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" />
                  </div>
                  <div className={fieldNeedsCorrection('phone_number') ? 'ring-2 ring-yellow-500 rounded-lg p-1' : ''}>
                    <label className="block text-sm font-semibold text-white mb-2">Phone Number {fieldNeedsCorrection('phone_number') && <span className="text-yellow-400 text-xs">⚠️ Needs correction</span>}</label>
                    <input type="tel" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="+1 (555) 123-4567" />
                  </div>
                </div>
                <button onClick={() => validateStep(1) && setStep(2)} className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-semibold">Continue →</button>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Address Information</h2>
                <div className={`space-y-4 ${fieldNeedsCorrection('address') ? 'ring-2 ring-yellow-500 rounded-lg p-2' : ''}`}>
                  {fieldNeedsCorrection('address') && <p className="text-yellow-400 text-sm mb-2">⚠️ Address needs correction</p>}
                  <div><label className="block text-sm font-semibold text-white mb-2">Street Address</label><input type="text" value={formData.streetAddress} onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-semibold text-white mb-2">City</label><input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" /></div>
                    <div><label className="block text-sm font-semibold text-white mb-2">State/Province</label><input type="text" value={formData.stateProvince} onChange={(e) => setFormData({ ...formData, stateProvince: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-semibold text-white mb-2">Postal Code</label><input type="text" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" /></div>
                    <div><label className="block text-sm font-semibold text-white mb-2">Country</label><select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"><option value="United States">United States</option><option value="Canada">Canada</option><option value="United Kingdom">United Kingdom</option><option value="Germany">Germany</option><option value="France">France</option><option value="Australia">Australia</option></select></div>
                  </div>
                </div>
                <div className="flex gap-4 mt-6"><button onClick={() => setStep(1)} className="flex-1 bg-white/10 text-white py-4 rounded-lg">← Back</button><button onClick={() => validateStep(2) && setStep(3)} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-semibold">Continue →</button></div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">ID Verification</h2>
                <div className={fieldNeedsCorrection('id_type') ? 'ring-2 ring-yellow-500 rounded-lg p-2 mb-4' : 'mb-4'}>
                  {fieldNeedsCorrection('id_type') && <p className="text-yellow-400 text-sm mb-2">⚠️ ID Type needs correction</p>}
                  <label className="block text-sm font-semibold text-white mb-2">ID Type</label>
                  <select value={formData.idType} onChange={(e) => setFormData({ ...formData, idType: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white">
                    <option value="drivers_license">Driver's License</option><option value="passport">Passport</option><option value="national_id">National ID Card</option>
                  </select>
                </div>
                <div className={`grid md:grid-cols-2 gap-6 ${(fieldNeedsCorrection('id_front') || fieldNeedsCorrection('id_back')) ? 'ring-2 ring-yellow-500 rounded-lg p-2' : ''}`}>
                  {(fieldNeedsCorrection('id_front') || fieldNeedsCorrection('id_back')) && <p className="text-yellow-400 text-sm mb-2 md:col-span-2">⚠️ ID photos need to be resubmitted</p>}
                  <div><label className="block text-sm font-semibold text-white mb-2">Front of ID *</label><div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">{idFrontPreview ? (<div><img src={idFrontPreview} alt="ID Front" className="max-h-40 mx-auto rounded-lg mb-2" /><button onClick={() => { setIdFrontFile(null); setIdFrontPreview('') }} className="text-red-400 text-sm">Remove</button></div>) : (<label className="cursor-pointer"><div className="text-4xl mb-2">📄</div><p className="text-gray-400">Click to upload front</p><input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'front')} className="hidden" /></label>)}</div></div>
                  {(formData.idType === 'drivers_license' || formData.idType === 'national_id') && (<div><label className="block text-sm font-semibold text-white mb-2">Back of ID *</label><div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">{idBackPreview ? (<div><img src={idBackPreview} alt="ID Back" className="max-h-40 mx-auto rounded-lg mb-2" /><button onClick={() => { setIdBackFile(null); setIdBackPreview('') }} className="text-red-400 text-sm">Remove</button></div>) : (<label className="cursor-pointer"><div className="text-4xl mb-2">📄</div><p className="text-gray-400">Click to upload back</p><input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'back')} className="hidden" /></label>)}</div></div>)}
                </div>
                <div className="flex gap-4 mt-6"><button onClick={() => setStep(2)} className="flex-1 bg-white/10 text-white py-4 rounded-lg">← Back</button><button onClick={() => validateStep(3) && setStep(4)} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-semibold">Continue →</button></div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Vendor Experience</h2>
                <div className={fieldNeedsCorrection('experience') ? 'ring-2 ring-yellow-500 rounded-lg p-2' : ''}>
                  {fieldNeedsCorrection('experience') && <p className="text-yellow-400 text-sm mb-2">⚠️ Experience info needs correction</p>}
                  <label className="flex items-center gap-3 mb-4"><input type="checkbox" checked={formData.hasPreviousExperience} onChange={(e) => setFormData({ ...formData, hasPreviousExperience: e.target.checked })} className="w-5 h-5" /><span className="text-white">I have previous experience selling on similar platforms</span></label>
                  {formData.hasPreviousExperience && (
                    <div className="space-y-4 bg-white/5 p-4 rounded-lg">
                      <div><label className="block text-sm font-semibold text-white mb-2">Platform Names</label><input type="text" value={formData.platformNames} onChange={(e) => setFormData({ ...formData, platformNames: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="e.g., G2G, Eldorado.gg" /></div>
                      <div><label className="block text-sm font-semibold text-white mb-2">Your Usernames</label><input type="text" value={formData.platformUsernames} onChange={(e) => setFormData({ ...formData, platformUsernames: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" /></div>
                      <div><label className="block text-sm font-semibold text-white mb-2">Experience Description</label><textarea value={formData.experienceDescription} onChange={(e) => setFormData({ ...formData, experienceDescription: e.target.value })} rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="Describe your experience..." /></div>
                    </div>
                  )}
                </div>
                <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <label className="flex items-start gap-3"><input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="w-5 h-5 mt-1" /><span className="text-white text-sm">I agree to the Terms of Service and Privacy Policy. I confirm all information provided is accurate and I am at least 18 years old.</span></label>
                </div>
                <div className="flex gap-4 mt-6"><button onClick={() => setStep(3)} className="flex-1 bg-white/10 text-white py-4 rounded-lg">← Back</button><button onClick={handleSubmit} disabled={submitting || !agreedToTerms} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-lg font-semibold disabled:opacity-50">{submitting ? 'Submitting...' : isResubmission ? '🔄 Resubmit Application' : '✅ Submit Application'}</button></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}