import { Link, createFileRoute } from '@tanstack/react-router'
import { Card, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { listAttempts } from '#/attempts/attempts'
import { StatusLabel, formatDate } from '#/components/viva/attempt-parts'

export const Route = createFileRoute('/_authed/attempts/')({
  loader: ({ context }) => listAttempts(context.user.uid),
  component: AttemptsPage,
})

function AttemptsPage() {
  const attempts = Route.useLoaderData()
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">My attempts</h1>
      {attempts.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No attempts yet. <Link to="/viva" className="underline">Start a viva</Link>.
        </p>
      )}
      {attempts.map((a) => (
        <Link key={a.id} to="/attempts/$ownerId/$attemptId" params={{ ownerId: a.ownerId, attemptId: a.id }} className="block">
          <Card className="transition-colors hover:bg-muted/40">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Case {a.caseId}</span>
                <StatusLabel status={a.status} />
              </CardTitle>
              <CardDescription>
                {formatDate(a.createdAt)} · {a.revealed.length} findings · {a.turns.length} turns
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  )
}
