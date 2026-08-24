import { describe, expect, it } from 'vitest'

// Commit 1's only job: CI is green on an empty test, so that the build going red
// is a signal from the very first commit (§17).
describe('skeleton', () => {
  it('runs', () => {
    expect(true).toBe(true)
  })
})
