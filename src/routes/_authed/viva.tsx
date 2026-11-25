import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useAttemptRecorder } from '#/attempts/use-attempt-recorder'
import { useRevisionPoint } from '#/attempts/use-revision-point'
import { RevisionCard } from '#/components/viva/attempt-parts'
import { useAuth } from '#/lib/auth'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { FindingCard, MicMeter, Transcript, TurnIndicator, TypedInput } from '#/components/viva/viva-parts'
import { loadCase } from '#/case/case'
import { useVivaSession } from '#/voice/use-viva-session'
import { useFollowLatest } from '#/components/viva/use-follow-latest'

export const Route = createFileRoute('/_authed/viva')({
  component: VivaPage,
})

function VivaPage() {
  const caseFile = loadCase()
  const {
    phase,
    turns,
    revealed,
    latency,
    followUps,
    error,
    notice,
    micName,
    micLevel,
    start,
    stop,
    sendText,
    copyDebugLog,
  } = useVivaSession()
  const [copied, setCopied] = useState<string | null>(null)
  const { user } = useAuth()
  const { attemptId, saveError } = useAttemptRecorder(user?.uid, caseFile.case_id, {
    phase,
    turns,
    revealed,
    followUps,
    latency,
  })
  const revision = useRevisionPoint(phase === 'ended', attemptId, turns)
  const live = !['idle', 'ended', 'error', 'connecting'].includes(phase)
  const lastTurn = turns.at(-1)
  const transcriptBox = useFollowLatest<HTMLDivElement>(`${turns.length}:${lastTurn?.text.length ?? 0}`)
  const findingsBox = useFollowLatest<HTMLDivElement>(String(revealed.length))

  return (
    <div className="space-y-4">
      {/* The controls stay on screen while the transcript scrolls underneath. */}
      <div className="sticky top-0 z-10 pt-2">
      <Card>
        <CardHeader>
          <CardTitle>Case {caseFile.case_id}</CardTitle>
          <CardDescription>{caseFile.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <TurnIndicator phase={phase} />
          {notice && (
            <Alert className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          )}
          {saveError && (
            <Alert className="border-amber-300 bg-amber-50 text-amber-900">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex items-center gap-2">
            {live || phase === 'connecting' ? (
              <>
                <Button variant="outline" onClick={stop}>
                  End viva
                </Button>
              </>
            ) : (
              <Button onClick={start}>{phase === 'idle' ? 'Start viva' : 'Start again'}</Button>
            )}
            {import.meta.env.DEV && phase !== 'idle' && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline"
                onClick={async () => setCopied(`Copied ${await copyDebugLog()} events`)}
              >
                {copied ?? 'Copy debug log'}
              </button>
            )}
          </div>
          {live && micName && <MicMeter name={micName} level={micLevel} />}
          {live && <TypedInput onSend={sendText} disabled={phase === 'examiner'} />}
        </CardContent>
      </Card>
      </div>

      {phase === 'ended' && (
        <Card data-testid="viva-results">
          <CardHeader>
            <CardTitle>Viva complete</CardTitle>
            <CardDescription>
              {revealed.length} finding{revealed.length === 1 ? '' : 's'} requested · {turns.length} turns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Follow-up question: </span>
              {followUps[0] || 'None asked (the viva ended before the follow-up).'}
            </div>
            <RevisionCard revision={revision.point} loading={revision.loading} error={revision.error} />
            {attemptId && user && (
              <Link
                to="/attempts/$ownerId/$attemptId"
                params={{ ownerId: user.uid, attemptId }}
                className="font-medium underline"
              >
                Saved. Open this attempt
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
        <section aria-label="Transcript">
          <h2 className="mb-2 text-sm font-semibold">Transcript</h2>
          <div ref={transcriptBox} className="max-h-[55vh] overflow-y-auto pr-1">
            <Transcript turns={turns} />
          </div>
        </section>
        <section aria-label="Findings revealed">
          <h2 className="mb-2 text-sm font-semibold">Findings</h2>
          <div ref={findingsBox} className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {revealed.length ? (
              revealed.map((f, i) => <FindingCard key={`${f.id}-${i}`} finding={f} />)
            ) : (
              <p className="text-sm text-muted-foreground">Findings you ask for appear here.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
