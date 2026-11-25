import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  initializeFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore'
import { getFirebaseApp } from '#/lib/firebase'
import type { RevisionPoint } from '#/server/revision-core'
import type { LatencySample, RevealedFinding, Turn } from '#/voice/use-viva-session'

export type AttemptStatus = 'in_progress' | 'completed' | 'interrupted'

/** Stored at users/{uid}/attempts/{attemptId}. Only the owner can read or write it (firestore.rules). */
export type AttemptData = {
  caseId: string
  status: AttemptStatus
  turns: Turn[]
  revealed: RevealedFinding[]
  followUps: string[]
  latency: LatencySample[]
  revision?: RevisionPoint | null
}

export type Attempt = AttemptData & { id: string; ownerId: string; createdAt: Date | null; updatedAt: Date | null }

let firestore: Firestore | null = null
function db(): Firestore {
  if (firestore) return firestore
  try {
    firestore = initializeFirestore(getFirebaseApp(), { ignoreUndefinedProperties: true })
  } catch {
    firestore = getFirestore(getFirebaseApp()) // already initialised (hot reload)
  }
  return firestore
}

const attemptsOf = (uid: string) => collection(db(), 'users', uid, 'attempts')

export async function createAttempt(uid: string, caseId: string): Promise<string> {
  const empty: AttemptData = { caseId, status: 'in_progress', turns: [], revealed: [], followUps: [], latency: [] }
  const ref = await addDoc(attemptsOf(uid), { ...empty, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return ref.id
}

export async function saveAttempt(uid: string, attemptId: string, data: Partial<AttemptData>) {
  await setDoc(doc(attemptsOf(uid), attemptId), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export async function getAttempt(ownerId: string, attemptId: string): Promise<Attempt | null> {
  const snap = await getDoc(doc(attemptsOf(ownerId), attemptId))
  return snap.exists() ? toAttempt(ownerId, snap.id, snap.data()) : null
}

export async function listAttempts(uid: string): Promise<Attempt[]> {
  const snap = await getDocs(query(attemptsOf(uid), orderBy('createdAt', 'desc'), limit(50)))
  return snap.docs.map((d) => toAttempt(uid, d.id, d.data()))
}

function toAttempt(ownerId: string, id: string, data: Record<string, any>): Attempt {
  const date = (t: Timestamp | undefined) => (t ? t.toDate() : null)
  return {
    id,
    ownerId,
    caseId: data.caseId,
    status: data.status,
    turns: data.turns ?? [],
    revealed: data.revealed ?? [],
    followUps: data.followUps ?? [],
    latency: data.latency ?? [],
    revision: data.revision ?? null,
    createdAt: date(data.createdAt),
    updatedAt: date(data.updatedAt),
  }
}

export function isPermissionDenied(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'permission-denied'
}
