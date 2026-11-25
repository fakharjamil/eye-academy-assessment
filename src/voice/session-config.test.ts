import { describe, expect, it } from 'vitest'
import { loadCase } from '#/case/case'
import { buildSessionConfig } from './session-config'

describe('buildSessionConfig', () => {
  const caseFile = loadCase()
  const config = buildSessionConfig(caseFile)

  it('keeps every finding value out of the examiner instructions', () => {
    for (const f of caseFile.findings) {
      if (f.value === null) continue
      expect(config.instructions, f.id).not.toContain(String(f.value))
    }
  })

  it('offers get_finding with every finding id plus not_in_case, and end_viva', () => {
    const getFinding = config.tools.find((t) => t.name === 'get_finding')!
    const ids = getFinding.parameters.properties.finding_id?.enum
    expect(ids).toEqual([...caseFile.findings.map((f) => f.id), 'not_in_case'])
    expect(config.tools.map((t) => t.name)).toContain('end_viva')
  })

  it('turns on server VAD and trainee transcription', () => {
    expect(config.audio.input.turn_detection.type).toBe('server_vad')
    expect(config.audio.input.transcription.model).toBeTruthy()
  })
})
