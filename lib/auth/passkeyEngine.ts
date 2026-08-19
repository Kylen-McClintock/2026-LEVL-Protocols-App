'use client'

/**
 * WebAuthn Passkey & Biometric Authentication Engine
 * Seamlessly supports Apple Face ID / Touch ID, Android Biometrics, and Windows Hello
 */

const PASSKEY_STORAGE_KEY = 'levl_passkey_data'

export interface StoredPasskeyData {
  credentialId: string
  userId: string
  userEmail: string
  userName: string
  registeredAt: string
}

// 1. Check if the device has a biometric sensor / platform authenticator
export async function isPasskeySupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false
  }

  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return available
    }
    return true
  } catch (e) {
    return false
  }
}

// 2. Check if a passkey has already been registered on this browser / device
export function getStoredPasskey(): StoredPasskeyData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PASSKEY_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredPasskeyData
  } catch {
    return null
  }
}

// 3. Register a new Passkey with Face ID / Touch ID
export async function registerBiometricPasskey(
  userId: string,
  userEmail: string = 'member@levl.app',
  userName: string = 'LEVL Member'
): Promise<{ success: boolean; passkey?: StoredPasskeyData; error?: string }> {
  if (typeof window === 'undefined' || !navigator.credentials) {
    return { success: false, error: 'Biometrics are not supported on this browser.' }
  }

  try {
    const challenge = new Uint8Array(32)
    window.crypto.getRandomValues(challenge)

    const userIdBytes = new TextEncoder().encode(userId || 'levl_user')

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'LEVL Protocols',
        id: window.location.hostname
      },
      user: {
        id: userIdBytes,
        name: userEmail || 'member@levl.app',
        displayName: userName || 'LEVL Member'
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Triggers native Face ID / Touch ID / Fingerprint
        userVerification: 'preferred',
        residentKey: 'preferred'
      },
      timeout: 60000,
      attestation: 'none'
    }

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    })) as PublicKeyCredential | null

    if (!credential) {
      return { success: false, error: 'Biometric authorization was cancelled.' }
    }

    const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))

    const passkeyData: StoredPasskeyData = {
      credentialId,
      userId,
      userEmail,
      userName,
      registeredAt: new Date().toISOString()
    }

    localStorage.setItem(PASSKEY_STORAGE_KEY, JSON.stringify(passkeyData))

    return { success: true, passkey: passkeyData }
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Biometric authorization was declined or timed out.' }
    }
    console.error('Passkey creation error:', err)
    return { success: false, error: err.message || 'Failed to register biometric passkey.' }
  }
}

// 4. Authenticate using Face ID / Touch ID (Auto-enrolls seamlessly if first time on this device)
export async function authenticateWithBiometrics(
  fallbackUserId?: string,
  fallbackUserEmail?: string,
  fallbackUserName?: string
): Promise<{
  success: boolean
  passkey?: StoredPasskeyData
  error?: string
}> {
  if (typeof window === 'undefined' || !navigator.credentials) {
    return { success: false, error: 'Biometrics are not supported on this device.' }
  }

  const stored = getStoredPasskey()

  // Case A: A passkey exists in storage -> verify with platform authenticator
  if (stored) {
    try {
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)

      const rawId = Uint8Array.from(atob(stored.credentialId), c => c.charCodeAt(0))

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [
          {
            id: rawId,
            type: 'public-key',
            transports: ['internal']
          }
        ],
        userVerification: 'preferred',
        timeout: 60000
      }

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      })

      if (assertion) {
        return { success: true, passkey: stored }
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        return { success: false, error: 'Biometric verification was cancelled.' }
      }
      // If credential not found on hardware (e.g. wiped or changed device), fall through to re-register on demand
    }
  }

  // Case B: First time on this device / browser -> Seamlessly trigger biometric setup prompt!
  const effectiveUserId = fallbackUserId || localStorage.getItem('levl_local_user_id') || ('user_' + Math.random().toString(36).substring(2, 10))
  const effectiveEmail = fallbackUserEmail || 'member@levl.app'
  const effectiveName = fallbackUserName || 'LEVL Member'

  const regResult = await registerBiometricPasskey(effectiveUserId, effectiveEmail, effectiveName)
  if (regResult.success && regResult.passkey) {
    return { success: true, passkey: regResult.passkey }
  }

  return { 
    success: false, 
    error: regResult.error || 'Biometric authorization was declined.' 
  }
}
