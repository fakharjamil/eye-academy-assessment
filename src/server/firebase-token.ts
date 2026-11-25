import { createRemoteJWKSet, jwtVerify } from 'jose'

// Firebase ID tokens are JWTs signed by Google. `jose` checks them with Google's public keys,
// which works on Cloudflare Workers (firebase-admin targets Node).
const GOOGLE_KEYS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)

export type VerifiedUser = { uid: string; email: string | null }

export async function verifyIdToken(idToken: string): Promise<VerifiedUser> {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  if (!projectId) throw new Error('VITE_FIREBASE_PROJECT_ID is not set')
  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_KEYS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    })
    if (!payload.sub) throw new Error('Token has no subject')
    return { uid: payload.sub, email: typeof payload.email === 'string' ? payload.email : null }
  } catch {
    throw new Error('Not signed in')
  }
}
