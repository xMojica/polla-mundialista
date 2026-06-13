import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js'
import { defaultPoolState } from '../data/defaultData'
import type { PoolState } from '../types'

const STORAGE_KEY = 'polla-mundialista-state-v1'
const TABLE_NAME = 'pool_state'
const DEFAULT_POOL_ID = '11111111-1111-1111-1111-111111111111'

type Listener = (state: PoolState) => void
type SyncMode = 'local' | 'supabase'
type RemotePoolRow = {
  id: string
  payload: PoolState
  updated_at: string
}

function normalizeSupabaseUrl(url?: string) {
  if (!url) {
    return undefined
  }

  return url.trim().replace(/\/rest\/v1\/?$/, '')
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const poolId = import.meta.env.VITE_SUPABASE_POOL_ID?.trim() || DEFAULT_POOL_ID

let cachedState: PoolState | null = null
let supabase: SupabaseClient | null = null
let channel: RealtimeChannel | null = null
let syncMode: SyncMode = supabaseUrl && supabaseKey ? 'supabase' : 'local'

function withTimestamp(state: PoolState): PoolState {
  return {
    ...state,
    updatedAt: new Date().toISOString(),
  }
}

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultPoolState)) as PoolState
}

function readLocalState() {
  if (typeof window === 'undefined') {
    return cloneDefaultState()
  }

  const rawState = window.localStorage.getItem(STORAGE_KEY)

  if (!rawState) {
    return cloneDefaultState()
  }

  try {
    return JSON.parse(rawState) as PoolState
  } catch {
    return cloneDefaultState()
  }
}

function writeLocalState(state: PoolState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey)
  }

  return supabase
}

export function getSyncMode() {
  return syncMode
}

export async function loadPoolState() {
  const localState = readLocalState()
  cachedState = localState

  const client = getSupabaseClient()
  if (!client) {
    return localState
  }

  const { data, error } = await client
    .from(TABLE_NAME)
    .select('id, payload, updated_at')
    .eq('id', poolId)
    .returns<RemotePoolRow[]>()
    .maybeSingle()

  if (error) {
    console.error('No fue posible leer el estado remoto. Se usara el almacenamiento local.', error)
    syncMode = 'local'
    return localState
  }

  if (!data?.payload) {
    const seededState = withTimestamp(localState)
    await savePoolState(seededState)
    syncMode = 'supabase'
    return seededState
  }

  const remoteState = data.payload as PoolState
  cachedState = remoteState
  writeLocalState(remoteState)
  syncMode = 'supabase'
  return remoteState
}

export async function savePoolState(state: PoolState) {
  const nextState = withTimestamp(state)
  cachedState = nextState
  writeLocalState(nextState)

  const client = getSupabaseClient()
  if (!client) {
    syncMode = 'local'
    return nextState
  }

  const { error } = await client.from(TABLE_NAME).upsert(
    {
      id: poolId,
      payload: nextState,
      updated_at: nextState.updatedAt,
    },
    { onConflict: 'id' },
  )

  if (error) {
    console.error('No fue posible sincronizar el estado remoto. Los cambios quedan guardados localmente.', error)
    syncMode = 'local'
    return nextState
  }

  syncMode = 'supabase'
  return nextState
}

export function subscribeToPoolState(listener: Listener) {
  if (typeof window !== 'undefined') {
    const storageListener = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return
      }

      const nextState = JSON.parse(event.newValue) as PoolState
      cachedState = nextState
      listener(nextState)
    }

    window.addEventListener('storage', storageListener)

    const client = getSupabaseClient()
    if (client) {
      channel = client
        .channel('pool-state-sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABLE_NAME,
            filter: `id=eq.${poolId}`,
          },
          (payload) => {
            const nextRow = payload.new as RemotePoolRow | undefined
            const nextState = nextRow?.payload
            if (!nextState) {
              return
            }

            cachedState = nextState
            writeLocalState(nextState)
            listener(nextState)
          },
        )
        .subscribe()
    }

    return () => {
      window.removeEventListener('storage', storageListener)

      if (channel && client) {
        void client.removeChannel(channel)
        channel = null
      }
    }
  }

  return () => undefined
}

export function getCachedPoolState() {
  return cachedState ?? readLocalState()
}
