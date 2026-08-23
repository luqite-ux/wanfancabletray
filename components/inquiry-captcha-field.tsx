'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  createInquiryCaptchaScope,
  createLatestCaptchaRequestController,
} from '../lib/inquiry-captcha-scope'

type CaptchaResponse = {
  svg: string
  token: string
  expiresAt: number
  accessiblePrompt?: string
}

type InquiryCaptchaFieldProps = {
  tokenName?: string
  answerName?: string
  scopeName?: string
  refreshKey?: number
  className?: string
}

export function InquiryCaptchaField({
  tokenName = 'captchaToken',
  answerName = 'captchaAnswer',
  scopeName = 'captchaScope',
  refreshKey = 0,
  className = '',
}: InquiryCaptchaFieldProps) {
  const [scope] = useState(() => createInquiryCaptchaScope())
  const [requests] = useState(() => createLatestCaptchaRequestController())
  const [challenge, setChallenge] = useState<CaptchaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accessible, setAccessible] = useState(false)

  const refresh = useCallback(async () => {
    const request = requests.begin()
    setLoading(true)
    setError('')
    setChallenge(null)
    try {
      const response = await fetch(`/api/captcha?scope=${encodeURIComponent(scope)}${accessible ? '&format=accessible' : ''}`, {
        cache: 'no-store',
        signal: request.signal,
      })
      if (!response.ok) throw new Error('captcha unavailable')
      const body = (await response.json()) as CaptchaResponse
      if ((!body.svg && !body.accessiblePrompt) || !body.token) throw new Error('invalid captcha response')
      if (!requests.isCurrent(request)) return
      setChallenge(body)
    } catch {
      if (!requests.isCurrent(request)) return
      setError('Verification code failed to load. Select Refresh to try again.')
    } finally {
      if (requests.isCurrent(request)) setLoading(false)
    }
  }, [accessible, requests, scope])

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0)
    return () => {
      window.clearTimeout(timer)
      requests.abortCurrent()
    }
  }, [refresh, refreshKey, requests])

  return (
    <div className={className}>
      <label htmlFor={answerName} className="mb-2 block text-sm font-medium">
        Verification code
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-14 w-40 items-center justify-center overflow-hidden rounded-lg border bg-slate-50">
          {challenge?.accessiblePrompt ? (
            <span className="px-3 text-center text-sm font-medium text-slate-900">
              {challenge.accessiblePrompt}
            </span>
          ) : challenge ? (
            // The SVG is generated from a fixed server-side template and rendered as an image, not injected as HTML.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(challenge.svg)}`}
              alt="Four-character verification code"
              width={160}
              height={56}
            />
          ) : (
            <span className="px-2 text-center text-xs text-slate-500">{loading ? 'Loading…' : 'Load failed'}</span>
          )}
        </div>
        <input type="hidden" name={scopeName} value={scope} />
        <input type="hidden" name={tokenName} value={challenge?.token ?? ''} />
        <input
          key={challenge?.token ?? refreshKey}
          id={answerName}
          name={answerName}
          type="text"
          required
          disabled={!challenge}
          minLength={accessible ? 1 : 4}
          maxLength={accessible ? 2 : 4}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
          aria-describedby={error ? `${answerName}-error` : undefined}
          className="h-11 w-32 rounded-lg border border-slate-300 bg-white px-3 text-base uppercase tracking-[0.25em] text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Enter code"
        />
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => setAccessible((current) => !current)}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          {accessible ? 'Use image code' : 'Use accessible question'}
        </button>
      </div>
      {error ? (
        <p id={`${answerName}-error`} role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}

