'use client'

/**
 * WebAuthn Passkey & Biometric Authentication Engine
 * Supports Apple Face ID / Touch ID, Android Biometrics, and Windows Hello
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
  userEmail: string,
  userName: string = 'Protocol Optimizer'
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined' || !navigator.credentials) {
    return { success: false, error: 'Passkeys are not supported on this browser.' }
  }

  try {
    const challenge = new Uint8Array(32)
    window.crypto.getRandomValues(challenge)

    const userIdBytes = new TextEncoder().encode(userId)

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'LEVL Protocols',
        id: window.location.hostname
      },
      user: {
        id: userIdBytes,
        name: userEmail || 'user@levl.app',
        displayName: userName || 'LEVL Member'
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Triggers Face ID / Touch ID / Fingerprint
        userVerification: 'required',
        residentKey: 'preferred'
      },
      timeout: 60000,
      attestation: 'none'
    }

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    })) as PublicKeyCredential | null

    if (!credential) {
      return { success: false, error: 'Biometric registration was cancelled.' }
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

    return { success: true }
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Biometric authorization was declined or timed out.' }
    }
    console.error('Passkey creation error:', err)
    return { success: false, error: err.message || 'Failed to register biometric passkey.' }
  }
}

// 4. Authenticate using Face ID / Touch ID
export async function authenticateWithBiometrics(): Promise<{
  success: boolean
  passkey?: StoredPasskeyData
  error?: string
}> {
  if (typeof window === 'undefined' || !navigator.credentials) {
    return { success: false, error: 'Passkeys are not supported on this device.' }
  }

  const stored = getStoredPasskey()
  if (!stored) {
    return {
      success: false,
      error: 'No biometric passkey registered on this device yet. Sign in once to register Face ID.'
    }
  }

  try {
    const challenge = new Uint8Array(32)
    window.crypto.getRandomValues(challenge)

    // Decode stored credential ID
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
      userVerification: 'required',
      timeout: 60000
    }

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    })

    if (!assertion) {
      return { success: false, error: 'Biometric verification was not completed.' }
    }

    return { success: true, passkey: stored }
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Biometric verification was cancelled or declined.' }
    }
    console.error('Passkey authentication error:', err)
    return { success: false, error: err.message || 'Failed to authenticate with biometrics.' }
  }
}
