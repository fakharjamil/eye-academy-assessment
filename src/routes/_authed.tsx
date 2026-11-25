import { Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { getCurrentUser, signOut, useAuth } from '#/lib/auth'

// Every page under this layout needs a signed-in user. Client-only, because Firebase Auth lives in the browser.
export const Route = createFileRoute('/_authed')({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUser()
    if (!user) throw redirect({ to: '/login', search: { redirect: location.href } })
    return { user }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const { user: initialUser } = Route.useRouteContext()
  const { user } = useAuth()
  const navigate = useNavigate()
  const email = (user ?? initialUser).email

  async function onSignOut() {
    await signOut()
    await navigate({ to: '/login', search: { redirect: undefined } })
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">Eye Academy viva</span>
        <div className="flex items-center gap-3 text-sm">
          <span data-testid="user-email">{email}</span>
          <Button variant="outline" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
