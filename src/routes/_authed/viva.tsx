import { createFileRoute } from '@tanstack/react-router'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { FindingCard, MicMeter, Transcript, TurnIndicator, TypedInput } from '#/components/viva/viva-parts'
import { loadCase } from '#/case/case'
import { useVivaSession } from '#/voice/use-viva-session'

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
    finishSpeaking,
  } = useVivaSession()
  const live = !['idle', 'ended', 'error', 'connecting'].includes(phase)
  const lastLatency = latency.at(-1)

  return (
    <div className="space-y-4">
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
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex items-center gap-2">
            {live || phase === 'connecting' ? (
              <>
                {/* Optional: the examiner also detects the end of an answer by itself. */}
                <Button
                  onClick={finishSpeaking}
                  disabled={phase !== 'trainee' && phase !== 'your-turn'}
                  title="Optional. The examiner also notices when you stop."
                >
                  Done speaking
                </Button>
                <Button variant="outline" onClick={stop}>
                  End viva
                </Button>
              </>
            ) : (
              <Button onClick={start}>{phase === 'idle' ? 'Start viva' : 'Start again'}</Button>
            )}
            {lastLatency && (
              <span className="text-xs text-muted-foreground">Last reply started after {lastLatency.ms} ms</span>
            )}
          </div>
          {live && micName && <MicMeter name={micName} level={micLevel} />}
          {live && <TypedInput onSend={sendText} disabled={phase === 'examiner'} />}
        </CardContent>
      </Card>

      {phase === 'ended' && (
        <Card data-testid="viva-results">
          <CardHeader>
            <CardTitle>Viva complete</CardTitle>
            <CardDescription>
              {revealed.length} finding{revealed.length === 1 ? '' : 's'} requested · {turns.length} turns
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <span className="font-semibold">Follow-up question: </span>
            {followUps[0] || 'None asked (the viva ended before the follow-up).'}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
        <section aria-label="Transcript">
          <h2 className="mb-2 text-sm font-semibold">Transcript</h2>
          <Transcript turns={turns} />
        </section>
        <section aria-label="Findings revealed">
          <h2 className="mb-2 text-sm font-semibold">Findings</h2>
          <div className="space-y-2">
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
