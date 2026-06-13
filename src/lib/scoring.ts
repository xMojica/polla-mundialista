import type { Match, Participant, PoolState, Score } from '../types'

export type ParticipantStanding = {
  participant: Participant
  exactHits: number
  rank: number
}

export function isExactMatch(prediction: Score, actualScore: Score | null) {
  if (!actualScore) {
    return false
  }

  return prediction.home === actualScore.home && prediction.away === actualScore.away
}

export function countExactHits(participant: Participant, matches: Match[]) {
  return matches.reduce((total, match) => {
    const prediction = participant.predictions[match.id]

    if (!prediction) {
      return total
    }

    return total + Number(isExactMatch(prediction, match.actualScore))
  }, 0)
}

export function getStandings(state: PoolState): ParticipantStanding[] {
  const exactHitsByParticipant = state.participants.map((participant) =>
    countExactHits(participant, state.matches),
  )
  const sortedHits = [...exactHitsByParticipant].sort((left, right) => right - left)
  const rankByHits = new Map<number, number>()

  sortedHits.forEach((hits, index) => {
    if (!rankByHits.has(hits)) {
      rankByHits.set(hits, index + 1)
    }
  })

  return state.participants.map((participant, index) => ({
    participant,
    exactHits: exactHitsByParticipant[index],
    rank: rankByHits.get(exactHitsByParticipant[index]) ?? index + 1,
  }))
}

export function getWinnersByMatch(match: Match, participants: Participant[]) {
  if (!match.actualScore) {
    return []
  }

  return participants.filter((participant) =>
    isExactMatch(participant.predictions[match.id], match.actualScore),
  )
}
