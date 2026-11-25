import { Link, createFileRoute, type ErrorComponentProps } from '@tanstack/react-router'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { getAttempt, isPermissionDenied } from '#/attempts/attempts'
import { RevisionCard, StatusLabel, formatDate } from '#/components/viva/attempt-parts'
import { FindingCard, Transcript } from '#/components/viva/viva-parts'

// The owner's uid is in the URL so that a shared link really asks Firestore for that user's
// attempt: anyone else gets "permission denied" from the security rules.
export const Route = createFileRoute('/_authed/attempts/$ownerId/$attemptId')({
  loader: async ({ params }) => {
    const attempt = await getAttempt(params.ownerId, params.attemptId)
    if (!attempt) throw new Error('not-found')
    return attempt
  },
  errorComponent: AttemptError,
  component: AttemptPage,
})

function AttemptPage() {
  const attempt = Route.useLoaderData()
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Case {attempt.caseId}</span>
            <StatusLabel status={attempt.status} />
          </CardTitle>
          <CardDescription>{formatDate(attempt.createdAt)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="font-semibold">Follow-up question: </span>
            {attempt.followUps[0] || 'None asked.'}
          </div>
          <RevisionCard revision={attempt.revision} />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
        <section aria-label="Transcript">
          <h2 className="mb-2 text-sm font-semibold">Transcript</h2>
          <Transcript turns={attempt.turns} />
        </section>
        <section aria-label="Findings revealed">
          <h2 className="mb-2 text-sm font-semibold">Findings</h2>
          <div className="space-y-2">
            {attempt.revealed.length ? (
              attempt.revealed.map((f, i) => <FindingCard key={`${f.id}-${i}`} finding={f} />)
            ) : (
              <p className="text-sm text-muted-foreground">No findings were requested.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function AttemptError({ error }: ErrorComponentProps) {
  const message = isPermissionDenied(error)
    ? 'Permission denied. Attempts are private to the trainee who took them.'
    : error instanceof Error && error.message === 'not-found'
      ? 'This attempt does not exist.'
      : 'This attempt could not be loaded.'
  return (
    <div className="space-y-3">
      <Alert variant="destructive">
        <AlertDescription data-testid="attempt-error">{message}</AlertDescription>
      </Alert>
      <Link to="/attempts" className="text-sm underline">
        Back to my attempts
      </Link>
    </div>
  )
}
