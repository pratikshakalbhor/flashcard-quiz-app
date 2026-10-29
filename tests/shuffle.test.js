import { describe, expect, it } from 'vitest'
import { shuffleArray } from '../src/utils/shuffle.js'

describe('shuffleArray', () => {
  it('returns a permutation without mutating the input', () => {
    const input = ['a', 'b', 'c', 'd', 'e']
    const output = shuffleArray(input, () => 0)

    expect(input).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(output).toHaveLength(input.length)
    expect([...output].sort()).toEqual([...input].sort())
    expect(output).not.toBe(input)
  })
})
