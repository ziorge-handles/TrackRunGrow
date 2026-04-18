import { describe, it, expect } from 'vitest'
import {
  parseTimeToSeconds,
  parseDistanceToMeters,
  metersToFeetInches,
  isFieldEventName,
  emailSchema,
  passwordSchema,
  seasonSchema,
} from './validations'

describe('parseTimeToSeconds', () => {
  it('parses M:SS format', () => {
    expect(parseTimeToSeconds('5:42')).toBeCloseTo(342)
  })

  it('parses MM:SS.xx format', () => {
    expect(parseTimeToSeconds('17:42.30')).toBeCloseTo(1062.3)
  })

  it('parses H:MM:SS format', () => {
    expect(parseTimeToSeconds('1:05:30')).toBe(3930)
  })

  it('parses raw seconds', () => {
    expect(parseTimeToSeconds('342.3')).toBeCloseTo(342.3)
  })

  it('returns null when seconds field is >= 60', () => {
    expect(parseTimeToSeconds('5:60')).toBeNull()
    expect(parseTimeToSeconds('5:61.5')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseTimeToSeconds('')).toBeNull()
  })

  it('returns null for non-numeric input', () => {
    expect(parseTimeToSeconds('abc')).toBeNull()
  })
})

describe('parseDistanceToMeters', () => {
  it("converts feet-inches with quotes (24'6\")", () => {
    const result = parseDistanceToMeters("24'6\"")
    expect(result).toBeCloseTo(7.4676, 3)
  })

  it("converts feet-only (20')", () => {
    expect(parseDistanceToMeters("20'")).toBeCloseTo(6.096, 3)
  })

  it('converts feet-inches with dash (24-6)', () => {
    const result = parseDistanceToMeters('24-6')
    expect(result).toBeCloseTo(7.4676, 3)
  })

  it('parses plain meters', () => {
    expect(parseDistanceToMeters('7.5')).toBeCloseTo(7.5)
    expect(parseDistanceToMeters('7.5m')).toBeCloseTo(7.5)
  })

  it('returns null for invalid input', () => {
    expect(parseDistanceToMeters('bad')).toBeNull()
  })

  it('returns null for impossible inches (>= 12)', () => {
    expect(parseDistanceToMeters("10'12\"")).toBeNull()
  })
})

describe('metersToFeetInches', () => {
  it('converts 6.096m to 20 feet', () => {
    const result = metersToFeetInches(6.096)
    expect(result).toMatch(/^20'/)
  })

  it('includes fractional inches', () => {
    const result = metersToFeetInches(7.5)
    expect(result).toContain("'")
    expect(result).toContain('"')
  })
})

describe('isFieldEventName', () => {
  it('recognizes field events', () => {
    expect(isFieldEventName('High Jump')).toBe(true)
    expect(isFieldEventName('Long Jump')).toBe(true)
    expect(isFieldEventName('Triple Jump')).toBe(true)
    expect(isFieldEventName('Pole Vault')).toBe(true)
    expect(isFieldEventName('Shot Put')).toBe(true)
    expect(isFieldEventName('Discus')).toBe(true)
    expect(isFieldEventName('Javelin')).toBe(true)
  })

  it('returns false for running events', () => {
    expect(isFieldEventName('100m Dash')).toBe(false)
    expect(isFieldEventName('Mile Run')).toBe(false)
    expect(isFieldEventName('3200m')).toBe(false)
    expect(isFieldEventName('400m Hurdles')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isFieldEventName('high jump')).toBe(true)
    expect(isFieldEventName('SHOT PUT')).toBe(true)
  })
})

describe('emailSchema', () => {
  it('accepts valid emails', () => {
    expect(emailSchema.safeParse('coach@school.edu').success).toBe(true)
    expect(emailSchema.safeParse('user+tag@example.co.uk').success).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(emailSchema.safeParse('notanemail').success).toBe(false)
    expect(emailSchema.safeParse('missing@').success).toBe(false)
    expect(emailSchema.safeParse('@nodomain.com').success).toBe(false)
  })

  it('rejects emails longer than 254 chars', () => {
    const long = 'a'.repeat(250) + '@x.com'
    expect(emailSchema.safeParse(long).success).toBe(false)
  })
})

describe('passwordSchema', () => {
  it('accepts a valid password', () => {
    expect(passwordSchema.safeParse('StrongPass1').success).toBe(true)
  })

  it('rejects passwords shorter than 8 chars', () => {
    expect(passwordSchema.safeParse('Ab1').success).toBe(false)
  })

  it('requires at least one uppercase letter', () => {
    expect(passwordSchema.safeParse('alllower1').success).toBe(false)
  })

  it('requires at least one lowercase letter', () => {
    expect(passwordSchema.safeParse('ALLUPPER1').success).toBe(false)
  })

  it('requires at least one digit', () => {
    expect(passwordSchema.safeParse('NoDigitAaa').success).toBe(false)
  })
})

describe('seasonSchema', () => {
  it('accepts YYYY-YYYY format', () => {
    expect(seasonSchema.safeParse('2025-2026').success).toBe(true)
    expect(seasonSchema.safeParse('2024-2025').success).toBe(true)
  })

  it('rejects single year', () => {
    expect(seasonSchema.safeParse('2025').success).toBe(false)
  })

  it('rejects non-numeric season', () => {
    expect(seasonSchema.safeParse('Fall 2025').success).toBe(false)
    expect(seasonSchema.safeParse('Spring').success).toBe(false)
  })
})
