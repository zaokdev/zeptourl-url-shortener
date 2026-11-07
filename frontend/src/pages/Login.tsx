import { useEffect } from 'react'
import { Authenticator, ThemeProvider, useAuthenticator } from '@aws-amplify/ui-react'
import { useLocation, useNavigate, useSearchParams, type Location } from 'react-router'
import { SkipLink } from '@/components/SkipLink'
import { Wordmark } from '@/components/Wordmark'
import { amplifyTheme } from '@/theme/amplify-theme'

const formFields = {
  signIn: {
    username: { label: 'Email', placeholder: 'you@example.com' },
    password: { label: 'Password', placeholder: '' },
  },
  signUp: {
    email: { label: 'Email', placeholder: 'you@example.com', order: 1 },
    password: {
      label: 'Password',
      placeholder: '',
      descriptiveText: 'At least 10 characters, with upper and lower case letters and a number.',
      order: 2,
    },
    confirm_password: { label: 'Confirm password', placeholder: '', order: 3 },
  },
  confirmSignUp: {
    confirmation_code: { label: 'Confirmation code', placeholder: 'The 6-digit code from your email' },
  },
  forgotPassword: {
    username: { label: 'Email', placeholder: 'you@example.com' },
  },
}

const components = {
  Header: () => (
    <div className="mb-6 flex justify-center">
      <Wordmark />
    </div>
  ),
}

export default function Login() {
  // Wait for the Authenticator to finish (route 'authenticated'), not for authStatus.
  // authStatus flips on Cognito's signedIn event, before the Authenticator has loaded
  // the user; leaving then unmounted it mid-flow and left `user` empty until a refresh.
  const { route } = useAuthenticator((context) => [context.route])
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const from = (location.state as { from?: Location } | null)?.from
  const target = from ? `${from.pathname}${from.search}${from.hash}` : '/dashboard'
  const initialState = params.get('mode') === 'signup' ? 'signUp' : 'signIn'

  useEffect(() => {
    if (route === 'authenticated') navigate(target, { replace: true })
  }, [route, navigate, target])

  return (
    <ThemeProvider theme={amplifyTheme} colorMode="light">
      <title>{initialState === 'signUp' ? 'Create an account · ZeptoURL' : 'Log in · ZeptoURL'}</title>
      <SkipLink />
      <main id="content" className="flex min-h-svh flex-col justify-center px-4 py-10">
        <Authenticator initialState={initialState} formFields={formFields} components={components} />
      </main>
    </ThemeProvider>
  )
}
