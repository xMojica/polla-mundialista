export type Score = {
  home: number
  away: number
}

export type Match = {
  id: string
  homeTeam: string
  awayTeam: string
  kickoff: string
  venue?: string
  actualScore: Score | null
}

export type Participant = {
  id: string
  name: string
  predictions: Record<string, Score>
  createdAt: string
}

export type PoolState = {
  title: string
  subtitle: string
  prize: string
  participants: Participant[]
  matches: Match[]
  updatedAt: string
}
