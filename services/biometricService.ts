/**
 * ==============================================================================
 * PASSVAULT++ OMEGA BIOMETRIC & WEBAUTHN HARDWARE BRIDGE
 * ==============================================================================
 * Connects directly to Windows Hello, Touch ID, Face ID, and TPM 2.0 FIDO2
 * Authenticators to provide Zero-Keystroke Hardware Authentication.
 * ==============================================================================
 */

const BIOMETRIC_CRED_KEY = 'pv_biometric_cred_id';
const BIOMETRIC_CHALLENGE = new Uint8Array([
  0x50, 0x61, 0x73, 0x73, 0x56, 0x61, 0x75, 0x6c, 0x74, 0x4f, 0x6d, 0x65, 0x67, 0x61, 0x32, 0x36
]); // "PassVaultOmega26"

/**
 * Checks if Windows Hello / Platform Biometrics is supported on this machine
 */
export const isBiometricsAvailable = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

/**
 * Checks if biometric credential has already been registered locally
 */
export const isBiometricRegistered = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(BIOMETRIC_CRED_KEY);
};

/**
 * Registers Windows Hello / Biometric credential tied to Master Key
 */
export const registerBiometric = async (displayName: string): Promise<boolean> => {
  if (!window.PublicKeyCredential) {
    throw new Error("WebAuthn / Windows Hello is not supported on this device");
  }

  const userId = new Uint8Array(16);
  window.crypto.getRandomValues(userId);

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge: BIOMETRIC_CHALLENGE,
    rp: {
      name: "PassVault++ Omega",
      id: window.location.hostname || "localhost"
    },
    user: {
      id: userId,
      name: displayName || "GhostUser",
      displayName: displayName || "Ghost User"
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" },  // ES256
      { alg: -257, type: "public-key" } // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      requireResidentKey: false
    },
    timeout: 60000,
    attestation: "none"
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    }) as PublicKeyCredential;

    if (credential && credential.id) {
      localStorage.setItem(BIOMETRIC_CRED_KEY, credential.id);
      return true;
    }
    return false;
  } catch (err: any) {
    console.error("Biometric registration failed:", err);
    throw new Error(err?.message || "Windows Hello registration cancelled");
  }
};

/**
 * Authenticates via Windows Hello / Biometrics (Zero Keystrokes)
 */
export const authenticateBiometric = async (): Promise<boolean> => {
  const credId = localStorage.getItem(BIOMETRIC_CRED_KEY);
  if (!credId || !window.PublicKeyCredential) {
    throw new Error("No biometric credential registered on this device");
  }

  const rawIdBuffer = Uint8Array.from(atob(credId.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: BIOMETRIC_CHALLENGE,
    allowCredentials: [
      {
        id: rawIdBuffer,
        type: 'public-key',
        transports: ['internal']
      }
    ],
    userVerification: 'required',
    timeout: 60000
  };

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    });
    return !!assertion;
  } catch (err: any) {
    console.error("Biometric authentication failed:", err);
    throw new Error(err?.message || "Biometric authentication failed");
  }
};

/**
 * Removes biometric credential from local storage
 */
export const removeBiometric = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(BIOMETRIC_CRED_KEY);
  }
};
