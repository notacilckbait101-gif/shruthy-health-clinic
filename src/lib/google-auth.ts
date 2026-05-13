import crypto from 'node:crypto'

const GOOGLE_AUTH_SCOPE = 'openid email profile'
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo'

export type GoogleProfile = {
  sub: string
  email: string
  email_verified?: boolean
  name?: string
  given_name?: string
  picture?: string
}

export function getGoogleClientConfig(origin: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`

  return {
    clientId,
    clientSecret,
    redirectUri,
  }
}

export function isGoogleAuthConfigured(origin: string) {
  const config = getGoogleClientConfig(origin)
  return Boolean(config.clientId && config.clientSecret && config.redirectUri)
}

export function createGoogleState(mode: 'login' | 'register' = 'login') {
  return `${mode}:${crypto.randomUUID()}`
}

export function buildGoogleAuthUrl(origin: string, mode: 'login' | 'register' = 'login') {
  const { clientId, redirectUri } = getGoogleClientConfig(origin)
  if (!clientId) {
    throw new Error('Google OAuth is not configured.')
  }

  const state = createGoogleState(mode)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_AUTH_SCOPE,
    access_type: 'online',
    include_granted_scopes: 'true',
    prompt: 'select_account',
    state,
  })

  return {
    state,
    url: `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`,
  }
}

export async function exchangeGoogleCodeForProfile(origin: string, code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleClientConfig(origin)
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials are missing.')
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  })

  if (!tokenResponse.ok) {
    const details = await tokenResponse.text()
    throw new Error(`Google token exchange failed: ${details}`)
  }

  const tokenPayload = await tokenResponse.json() as { access_token?: string }
  if (!tokenPayload.access_token) {
    throw new Error('Google did not return an access token.')
  }

  const profileResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
    },
    cache: 'no-store',
  })

  if (!profileResponse.ok) {
    const details = await profileResponse.text()
    throw new Error(`Google profile lookup failed: ${details}`)
  }

  return profileResponse.json() as Promise<GoogleProfile>
}
