'use client'

/**
 * /auth — Phone OTP authentication page.
 *
 * Two sub-states:
 *   1. Phone entry  — user types their phone number and requests OTP
 *   2. OTP verify   — user enters the 6-digit code to confirm identity
 *
 * After successful auth:
 *   - If there's a `returnUrl` search param, redirect there
 *   - Otherwise redirect to /map
 *
 * See: docs/ux-flow.md — Flow 2 (Auth Check section)
 */

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/appStore'
import { AUTH_CONFIG } from '@/config/auth'

type AuthStep = 'phone' | 'otp'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') ?? '/map'

  const [step, setStep] = useState<AuthStep>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  // ── Step 1: Request OTP ───────────────────────────────────────────────────

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Basic E.164 normalisation — prepend +91 if no country code
    const normalised = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`

    setIsLoading(true)
    const supabase = createClient()

    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: normalised,
    })

    setIsLoading(false)

    if (otpError) {
      setError(otpError.message)
      return
    }

    setPhone(normalised)
    setStep('otp')
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const supabase = createClient()

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    })

    setIsLoading(false)

    if (verifyError || !data.user) {
      setError(verifyError?.message ?? 'Invalid OTP. Please try again.')
      return
    }

    // Store minimal user info in Zustand
    setCurrentUser({
      id: data.user.id,
      phone: data.user.phone ?? null,
      display_name: null,
      created_at: data.user.created_at,
    })

    router.replace(returnUrl)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-dvh bg-white px-6">
      {/* Back button */}
      <header className="pt-12 pb-8">
        <button
          onClick={() => (step === 'otp' ? setStep('phone') : router.back())}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft size={18} />
          Back
        </button>
      </header>

      {step === 'phone' ? (
        /* ── Phone entry ─────────────────────────────────────────────────── */
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Verify your number</h1>
            <p className="text-sm text-gray-500 mt-2">
              We&apos;ll send a {AUTH_CONFIG.OTP_LENGTH}-digit code to confirm your identity.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Mobile number
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:border-brand-primary"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || phone.length < 7}
            className="w-full rounded-xl bg-brand-primary py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isLoading ? 'Sending OTP…' : 'Send OTP'}
          </button>

          <p className="text-xs text-center text-gray-400">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </form>
      ) : (
        /* ── OTP verify ──────────────────────────────────────────────────── */
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Enter OTP</h1>
            <p className="text-sm text-gray-500 mt-2">
              Code sent to <strong>{phone}</strong>.{' '}
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-brand-primary"
              >
                Change number
              </button>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="otp" className="text-sm font-medium text-gray-700">
              {AUTH_CONFIG.OTP_LENGTH}-digit code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={AUTH_CONFIG.OTP_LENGTH}
              placeholder="• • • • • •"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, AUTH_CONFIG.OTP_LENGTH))}
              required
              autoFocus
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-2xl tracking-[0.5em] text-center focus:outline-none focus:border-brand-primary"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || otp.length < AUTH_CONFIG.OTP_LENGTH}
            className="w-full rounded-xl bg-brand-primary py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isLoading ? 'Verifying…' : 'Verify & Continue'}
          </button>

          <button
            type="button"
            onClick={() => handleRequestOtp({ preventDefault: () => {} } as React.FormEvent)}
            className="text-sm text-center text-brand-primary"
          >
            Resend OTP
          </button>
        </form>
      )}
    </div>
  )
}
