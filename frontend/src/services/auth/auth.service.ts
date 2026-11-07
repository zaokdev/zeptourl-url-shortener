// The only module that talks to Amplify Auth. UI code reads auth state through
// @aws-amplify/ui-react (useAuthenticator) and calls these functions via hooks.
import { Amplify } from 'aws-amplify'
import { fetchAuthSession, signOut as amplifySignOut } from 'aws-amplify/auth'
import { Hub, I18n } from 'aws-amplify/utils'
import { getConfig } from '@/services/config'

// Sentence-case copy for the Authenticator's built-in labels (Amplify's English
// strings are title case). Keys must match Amplify's dictionary exactly.
const AUTH_VOCABULARY: Record<string, string> = {
  'Sign In': 'Log in',
  'Sign in': 'Log in',
  'Signing in': 'Logging in',
  'Create Account': 'Create account',
  'Creating Account': 'Creating account',
  'Reset Password': 'Reset password',
  'Reset your password': 'Reset your password',
  'Back to Sign In': 'Back to log in',
  'Send code': 'Send code',
  'Resend Code': 'Resend code',
  'Confirm Password': 'Confirm password',
  'Confirmation Code': 'Confirmation code',
  'We Emailed You': 'Check your email',
}

/**
 * Configures Amplify with the Cognito user pool. Call once, before rendering.
 * Throws ConfigError (from services/config) when env vars are missing.
 */
export function configureAuth(): void {
  const { userPoolId, userPoolClientId } = getConfig()

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: { email: true },
        signUpVerificationMethod: 'code',
        userAttributes: { email: { required: true } },
        // Mirrors the pool's password policy so the form checks it before submitting.
        passwordFormat: {
          minLength: 10,
          requireLowercase: true,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialCharacters: false,
        },
      },
    },
  })

  I18n.putVocabulariesForLanguage('en', AUTH_VOCABULARY)
  I18n.setLanguage('en')
}

/**
 * The current access token, refreshed by Amplify when it has expired.
 * Returns null when nobody is signed in or the session can't be refreshed.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const { tokens } = await fetchAuthSession()
    return tokens?.accessToken?.toString() ?? null
  } catch {
    return null
  }
}

/** Signs the user out. The Authenticator provider picks up the Hub event. */
export async function signOut(): Promise<void> {
  await amplifySignOut()
}

/** Calls `listener` whenever the user signs out. Returns an unsubscribe function. */
export function onSignedOut(listener: () => void): () => void {
  return Hub.listen('auth', ({ payload }) => {
    if (payload.event === 'signedOut') listener()
  })
}
