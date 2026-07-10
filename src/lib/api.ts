import { supabase } from './supabase'
import type { User, Mahasiswa, BerkasPendaftaran, MataKuliah, JadwalKuliah, KRS, DetailKRS, Nilai } from '../types'
import { initialUsers, initialMahasiswa, initialBerkasPendaftaran, initialMataKuliah, initialJadwalKuliah, initialNilai } from '../data'

type TableName = 'users' | 'mahasiswa' | 'berkas_pendaftaran' | 'mata_kuliah' | 'jadwal_kuliah' | 'krs' | 'detail_krs' | 'nilai'

async function fetchAll<T>(table: TableName): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*')
  if (error) throw error
  return data as T[]
}

async function upsert<T>(table: TableName, rows: T[]): Promise<void> {
  const { error } = await supabase.from(table).upsert(rows as any)
  if (error) throw error
}

async function del(table: TableName, column: string, values: string[]): Promise<void> {
  const { error } = await supabase.from(table).delete().in(column, values)
  if (error) throw error
}

// Users
export const fetchUsers = () => fetchAll<User>('users')
export const upsertUsers = (rows: User[]) => upsert('users', rows)
export const deleteUsers = (ids: string[]) => del('users', 'id_user', ids)

// Mahasiswa
export const fetchMahasiswa = () => fetchAll<Mahasiswa>('mahasiswa')
export const upsertMahasiswa = (rows: Mahasiswa[]) => upsert('mahasiswa', rows)
export const deleteMahasiswa = (ids: string[]) => del('mahasiswa', 'id_user', ids)

// Berkas
export const fetchBerkas = () => fetchAll<BerkasPendaftaran>('berkas_pendaftaran')
export const upsertBerkas = (rows: BerkasPendaftaran[]) => upsert('berkas_pendaftaran', rows)

// Mata Kuliah
export const fetchMataKuliah = () => fetchAll<MataKuliah>('mata_kuliah')
export const upsertMataKuliah = (rows: MataKuliah[]) => upsert('mata_kuliah', rows)

// Jadwal Kuliah
export const fetchJadwal = () => fetchAll<JadwalKuliah>('jadwal_kuliah')
export const upsertJadwal = (rows: JadwalKuliah[]) => upsert('jadwal_kuliah', rows)
export const deleteJadwal = (ids: string[]) => del('jadwal_kuliah', 'id_jadwal', ids)

// KRS
export const fetchKRS = () => fetchAll<KRS>('krs')
export const upsertKRS = (rows: KRS[]) => upsert('krs', rows)
export const deleteKRSByNimSemester = (nim: string, semester: number) =>
  supabase.from('krs').delete().eq('nim', nim).eq('semester_aktif', semester).then(r => { if (r.error) throw r.error })

// Detail KRS
export const fetchDetailKRS = () => fetchAll<DetailKRS>('detail_krs')
export const upsertDetailKRS = (rows: DetailKRS[]) => upsert('detail_krs', rows)
export const deleteDetailKRSByKrsId = (krsId: string) =>
  supabase.from('detail_krs').delete().eq('id_krs', krsId).then(r => { if (r.error) throw r.error })

// Nilai
export const fetchNilai = () => fetchAll<Nilai>('nilai')
export const upsertNilai = (rows: Nilai[]) => upsert('nilai', rows)

interface SystemConfig {
  key: string
  value: any
}

export async function fetchSystemConfig(): Promise<{ current_semester: number; semesters: number[] }> {
  const { data, error } = await supabase.from('system_config').select('*')
  if (error) throw error
  const cfg = data as SystemConfig[]
  return {
    current_semester: Number(cfg.find(c => c.key === 'current_semester')?.value ?? 3),
    semesters: cfg.find(c => c.key === 'semesters')?.value ?? [3, 4],
  }
}

export async function upsertConfig(key: string, value: any): Promise<void> {
  const { error } = await supabase.from('system_config').upsert({ key, value } as any)
  if (error) throw error
}

// Reset database: delete all rows, re-insert seed data
export async function resetDatabase(): Promise<void> {
  // Delete in FK order
  const deleteAll = async (table: string, col: string) => {
    const { error } = await supabase.from(table).delete().neq(col, '___none___')
    if (error) throw error
  }
  await deleteAll('detail_krs', 'id_detail')
  await deleteAll('krs', 'id_krs')
  await deleteAll('nilai', 'id_nilai')
  await deleteAll('berkas_pendaftaran', 'id_berkas')
  await deleteAll('jadwal_kuliah', 'id_jadwal')
  await deleteAll('mahasiswa', 'id_user')
  await deleteAll('mata_kuliah', 'kode_mk')
  await deleteAll('system_config', 'key')
  await deleteAll('users', 'id_user')

  // Re-insert seed data
  await upsertUsers(initialUsers)
  await upsertMahasiswa(initialMahasiswa)
  await upsertBerkas(initialBerkasPendaftaran)
  await upsertMataKuliah(initialMataKuliah)
  await upsertJadwal(initialJadwalKuliah)
  await upsertNilai(initialNilai)
  await upsertConfig('current_semester', 3)
  await upsertConfig('semesters', [3, 4])
}
