import { Link } from 'react-router'

export function Wordmark({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="type-title rounded-md">
      ZeptoURL
    </Link>
  )
}
