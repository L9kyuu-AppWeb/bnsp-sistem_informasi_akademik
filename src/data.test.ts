import { describe, it, expect } from 'vitest'
import { calculateGradeWeight, initialMataKuliah, initialMahasiswa } from './data'

describe('calculateGradeWeight', () => {
  it('returns 4.0 for A', () => expect(calculateGradeWeight('A')).toBe(4.0))
  it('returns 3.5 for AB', () => expect(calculateGradeWeight('AB')).toBe(3.5))
  it('returns 3.0 for B', () => expect(calculateGradeWeight('B')).toBe(3.0))
  it('returns 2.5 for BC', () => expect(calculateGradeWeight('BC')).toBe(2.5))
  it('returns 2.0 for C', () => expect(calculateGradeWeight('C')).toBe(2.0))
  it('returns 1.0 for D', () => expect(calculateGradeWeight('D')).toBe(1.0))
  it('returns 0.0 for E', () => expect(calculateGradeWeight('E')).toBe(0.0))
  it('returns 0.0 for unknown grade', () => expect(calculateGradeWeight('Z')).toBe(0.0))
})

describe('initialMataKuliah', () => {
  it('has unique kode_mk entries', () => {
    const codes = initialMataKuliah.map(mk => mk.kode_mk)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('has positive SKS for all courses', () => {
    initialMataKuliah.forEach(mk => {
      expect(mk.sks).toBeGreaterThan(0)
    })
  })
})

describe('initialMahasiswa', () => {
  it('links to valid users via id_user', () => {
    initialMahasiswa.forEach(m => expect(m.id_user).toBeTruthy())
  })

  it('has valid status', () => {
    const validStatuses = ['Calon', 'Aktif', 'Ditolak']
    initialMahasiswa.forEach(m => {
      expect(validStatuses).toContain(m.status)
    })
  })
})
