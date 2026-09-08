'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface GoogleSignInButtonProps {
  onSuccess?: () => void
  onError?: (errorMessage: string) => void
  text?: 'signin_with' | 'signup_with' | 'continue_with'
  className?: string
  width?: number
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, options: any) => void
          prompt: (notification?: any) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  text = 'continue_with',
  className = '',
  width = 360,
}: GoogleSignInButtonProps) {
  const { signInWithGoogleIdToken, signInWithGoogle } = useAuth()
  const buttonContainerRef = useRef<HTMLDivElement>(null)
  const [isGsiRendered, setIsGsiRendered] = useState(false)
  const [fallbackLoading, setFallbackLoading] = useState(false)

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!googleClientId) return

    let isMounted = true

    const initGsi = () => {
      if (!window.google?.accounts?.id || !buttonContainerRef.current) return

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) {
              onError?.('No credential returned from Google')
              return
            }

            try {
              const { error } = await signInWithGoogleIdToken(response.credential)
              if (error) {
                onError?.(error.message || 'Failed to authenticate with Google.')
              } else {
                onSuccess?.()
              }
            } catch (err: any) {
              onError?.(err?.message || 'Authentication error')
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        // Clear container before rendering
        if (buttonContainerRef.current) {
          buttonContainerRef.current.innerHTML = ''
          window.google.accounts.id.renderButton(buttonContainerRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: text,
            shape: 'pill',
            width: width,
            logo_alignment: 'left',
          })
          if (isMounted) {
            setIsGsiRendered(true)
          }
        }
      } catch (err) {
        console.warn('Google Identity Services initialization warning:', err)
      }
    }

    if (window.google?.accounts?.id) {
      initGsi()
    } else {
      // Poll briefly for script load if script is still arriving
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval)
          initGsi()
        }
      }, 100)
      const timeout = setTimeout(() => clearInterval(interval), 4000)
      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
        isMounted = false
      }
    }

    return () => {
      isMounted = false
    }
  }, [googleClientId, text, width, signInWithGoogleIdToken, onSuccess, onError])

  // Fallback click handler if GSI script fails or is blocked by an ad-blocker
  const handleFallbackOAuth = async () => {
    setFallbackLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      onError?.(error.message)
      setFallbackLoading(false)
    }
  }

  return (
    <div className={`w-full flex justify-center items-center ${className}`}>
      {/* Native Google Identity Services Button Container */}
      <div 
        ref={buttonContainerRef} 
        className={isGsiRendered ? 'flex justify-center w-full' : 'hidden'}
      />

      {/* Fallback Custom Button if GSI hasn't loaded or script is blocked */}
      {!isGsiRendered && (
        <button
          type="button"
          onClick={handleFallbackOAuth}
          disabled={fallbackLoading}
          className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
          <span>{fallbackLoading ? 'Connecting...' : 'Continue with Google'}</span>
        </button>
      )}
    </div>
  )
}
