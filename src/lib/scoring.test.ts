import { describe, expect, it } from 'vitest'
import { defaultPoolState } from '../data/defaultData'
import { countExactHits, getStandings } from './scoring'

describe('scoring', () => {
  it('counts exact hits only for matches with official scores', () => {
    const participant = defaultPoolState.participants[0]
    const matches = defaultPoolState.matches.map((match, index) => ({
      ...match,
      actualScore: index < 2 ? participant.predictions[match.id] : null,
    }))

    expect(countExactHits(participant, matches)).toBe(2)
  })

  it('keeps participant order and assigns shared ranks for ties', () => {
    const participantA = defaultPoolState.participants[0]
    const participantB = defaultPoolState.participants[1]
    const participantC = defaultPoolState.participants[2]
    const matches = defaultPoolState.matches.map((match) => ({
      ...match,
      actualScore:
        match.id === 'mx-sa'
          ? participantA.predictions[match.id]
          : participantB.predictions[match.id],
    }))

    const standings = getStandings({
      ...defaultPoolState,
      participants: [participantA, participantB, participantC],
      matches,
    })

    expect(standings.map((entry) => entry.participant.name)).toEqual([
      participantA.name,
      participantB.name,
      participantC.name,
    ])
    expect(standings[0].rank).toBe(1)
    expect(standings[1].rank).toBe(1)
    expect(standings[2].rank).toBe(3)
  })
})
