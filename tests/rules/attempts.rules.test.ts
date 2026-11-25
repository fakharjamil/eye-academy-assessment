import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'

let env: RulesTestEnvironment
const attemptOfA = 'users/user-a/attempts/attempt-1'

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-eye-academy',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), attemptOfA), { caseId: 'EA-VIVA-001' })
  })
})

afterAll(async () => {
  await env.cleanup()
})

describe('attempts are private to their owner', () => {
  it('lets user A read and write their own attempt', async () => {
    const a = env.authenticatedContext('user-a').firestore()
    await assertSucceeds(getDoc(doc(a, attemptOfA)))
    await assertSucceeds(setDoc(doc(a, 'users/user-a/attempts/attempt-2'), { caseId: 'EA-VIVA-001' }))
  })

  it("denies user B reading or writing user A's attempt", async () => {
    const b = env.authenticatedContext('user-b').firestore()
    await assertFails(getDoc(doc(b, attemptOfA)))
    await assertFails(setDoc(doc(b, attemptOfA), { caseId: 'changed' }))
  })

  it('denies a signed-out visitor', async () => {
    const anon = env.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(anon, attemptOfA)))
  })

  it('denies anything outside users/{uid}/attempts', async () => {
    const a = env.authenticatedContext('user-a').firestore()
    await assertFails(setDoc(doc(a, 'users/user-a'), { admin: true }))
    await assertFails(getDoc(doc(a, 'cases/EA-VIVA-001')))
  })
})
