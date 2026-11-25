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

  it('offers get_finding with every finding id plus not_in_case, ask_follow_up and end_viva', () => {
    const getFinding = config.tools.find((t) => t.name === 'get_finding')!
    const ids = getFinding.parameters.properties.finding_id?.enum
    expect(ids).toEqual([...caseFile.findings.map((f) => f.id), 'not_in_case'])
    expect(config.tools.map((t) => t.name)).toEqual(['get_finding', 'ask_follow_up', 'end_viva'])
  })

  it('waits for the trainee to finish a thought, and transcribes them', () => {
    expect(config.audio.input.turn_detection).toMatchObject({ type: 'semantic_vad', eagerness: 'medium' })
    expect(config.audio.input.transcription.model).toBeTruthy()
  })
})
