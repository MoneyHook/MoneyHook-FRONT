import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { JoinFamily } from '@/features/households'
// Remove the bearer invitation from the URL before entering the login flow.
export function CaptureInvitationPage() {
  const [captured, setCaptured] = useState(false)
  useEffect(() => {
    const token = window.location.hash.slice(1)
    if (/^[A-Za-z0-9_-]{43}$/.test(token))
      sessionStorage.setItem('household-invite', token)
    window.history.replaceState(null, '', '/family/join')
    // The token is captured once before authentication redirects can run.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCaptured(true)
  }, [])
  return captured ? (
    <Navigate replace to="/app/family/join" />
  ) : (
    <p role="status">招待を確認しています…</p>
  )
}
export function HouseholdJoinPage() {
  const [token] = useState(
    () => sessionStorage.getItem('household-invite') ?? '',
  )
  return (
    <section className="mx-auto w-full max-w-xl space-y-6 p-6 pb-24">
      <JoinFamily token={token} />
    </section>
  )
}
