import { describe, it, expect } from 'vitest'
import { parseCSVLine, parseCsv } from './import-csv'

describe('parseCSVLine', () => {
  it('splits simple comma fields', () => {
    expect(parseCSVLine('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('handles quoted fields with commas', () => {
    expect(parseCSVLine('"hello, world",x')).toEqual(['hello, world', 'x'])
  })

  it('handles escaped quotes', () => {
    expect(parseCSVLine('"say ""hi""",end')).toEqual(['say "hi"', 'end'])
  })

  it('trims unquoted cells', () => {
    expect(parseCSVLine('  a ,  b  ')).toEqual(['a', 'b'])
  })
})

describe('parseCsv', () => {
  it('returns empty when fewer than two lines', () => {
    expect(parseCsv('only_header')).toEqual([])
    expect(parseCsv('')).toEqual([])
  })

  it('maps headers to row objects with lowercase keys', () => {
    const csv = 'Name,Email\nJane Doe,jane@example.com'
    expect(parseCsv(csv)).toEqual([{ name: 'Jane Doe', email: 'jane@example.com' }])
  })
})
