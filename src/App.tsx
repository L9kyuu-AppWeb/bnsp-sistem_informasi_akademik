import React, { useState, useEffect } from 'react';
import { User, Mahasiswa, BerkasPendaftaran, MataKuliah, JadwalKuliah, KRS, DetailKRS, Nilai } from './types';
import * as api from './lib/api';
import { supabase } from './lib/supabase';
import Header from './components/Header';
import SimulatorBar from './components/SimulatorBar';
import AuthScreen from './components/AuthScreen';
import MabaView from './components/MabaView';
import MahasiswaActiveView from './components/MahasiswaActiveView';
import AdminView from './components/AdminView';

export default function App() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([]);
  const [mahasiswa, setMahasiswa] = useState<Mahasiswa[]>([]);
  const [berkasList, setBerkasList] = useState<BerkasPendaftaran[]>([]);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  const [jadwalKuliahList, setJadwalKuliahList] = useState<JadwalKuliah[]>([]);
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [krsList, setKrsList] = useState<KRS[]>([]);
  const [detailKrsList, setDetailKrsList] = useState<DetailKRS[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSystemSemester, setCurrentSystemSemester] = useState<number>(3);
  const [semesters, setSemesters] = useState<number[]>([3, 4]);

  useEffect(() => {
    (async () => {
      try {
        const [u, m, b, mk, j, n, k, dk, cfg] = await Promise.all([
          api.fetchUsers(),
          api.fetchMahasiswa(),
          api.fetchBerkas(),
          api.fetchMataKuliah(),
          api.fetchJadwal(),
          api.fetchNilai(),
          api.fetchKRS(),
          api.fetchDetailKRS(),
          api.fetchSystemConfig(),
        ])
        setUsers(u)
        setMahasiswa(m)
        setBerkasList(b)
        setMataKuliahList(mk)
        setJadwalKuliahList(j)
        setNilaiList(n)
        setKrsList(k)
        setDetailKrsList(dk)
        setCurrentSystemSemester(cfg.current_semester)
        setSemesters(cfg.semesters)
      } catch (err: any) {
        console.error('Gagal load data dari Supabase:', err)
        const msg = err?.message || err?.error_description || JSON.stringify(err)
        alert(`Gagal memuat data dari database.\n\nError: ${msg}\n\nLangkah:\n1. Buka src/lib/migration.sql\n2. Copy semua SQL\n3. Buka Supabase Dashboard → SQL Editor → Paste & Run\n4. Refresh halaman`)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    api.upsertConfig('current_semester', currentSystemSemester)
  }, [currentSystemSemester])

  useEffect(() => {
    api.upsertConfig('semesters', semesters)
  }, [semesters])

  const handleResetData = async () => {
    if (!confirm('Reset semua data ke awal? Data di database akan dihapus.')) return
    const tables = ['detail_krs', 'krs', 'nilai', 'berkas_pendaftaran', 'jadwal_kuliah', 'mahasiswa', 'mata_kuliah', 'users', 'system_config']
    for (const t of tables) {
      await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }
    window.location.reload()
  }

  const handleAddSemester = (sem: number) => {
    setSemesters(prev => [...prev, sem].sort((a, b) => a - b))
  }

  const handleLogin = async (identifier: string): Promise<boolean> => {
    const cleanId = identifier.trim().toLowerCase()
    let match = users.find(u => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId)

    if (!match) {
      const mhs = mahasiswa.find(m => m.nim.toLowerCase() === cleanId)
      if (mhs) match = users.find(u => u.id_user === mhs.id_user)
    }

    if (match) {
      setCurrentUser(match)
      return true
    }
    return false
  }

  const handleRegister = async (data: {
    username: string; email: string; nama: string;
    tempatLahir: string; tanggalLahir: string;
  }) => {
    const newUserId = `U_${Date.now()}`
    const newUser: User = { id_user: newUserId, username: data.username, email: data.email, role: 'maba' }
    const newMhs: Mahasiswa = {
      nim: '', id_user: newUserId, nama: data.nama,
      tempat_lahir: data.tempatLahir, tanggal_lahir: data.tanggalLahir, status: 'Calon'
    }

    await api.upsertUsers([newUser])
    await api.upsertMahasiswa([newMhs])

    setUsers(prev => [...prev, newUser])
    setMahasiswa(prev => [...prev, newMhs])
    setCurrentUser(newUser)
  }

  const handleSwitchUser = (userId: string) => {
    const targetUser = users.find(u => u.id_user === userId)
    if (targetUser) setCurrentUser(targetUser)
  }

  const handleLogout = () => setCurrentUser(null)

  const handleUpdateProfile = async (namaInput: string, tempat: string, tgl: string) => {
    if (!currentUser) return
    const updated = mahasiswa.map(m =>
      m.id_user === currentUser.id_user
        ? { ...m, nama: namaInput, tempat_lahir: tempat, tanggal_lahir: tgl }
        : m
    )
    setMahasiswa(updated)
    const target = updated.find(m => m.id_user === currentUser.id_user)
    if (target) await api.upsertMahasiswa([target])
  }

  const handleUploadBerkas = async (ijazahName: string, transkripName: string) => {
    if (!currentUser) return
    const existing = berkasList.find(b => b.id_user === currentUser.id_user)
    const updated: BerkasPendaftaran = existing
      ? { ...existing, file_ijazah_name: ijazahName, file_transkrip_name: transkripName, status_verifikasi: 'Pending', catatan: '' }
      : { id_berkas: `B_${Date.now()}`, id_user: currentUser.id_user, file_ijazah_name: ijazahName, file_transkrip_name: transkripName, status_verifikasi: 'Pending', uploaded_at: new Date().toISOString() }

    setBerkasList(prev => prev.filter(b => b.id_user !== currentUser.id_user).concat(updated))
    await api.upsertBerkas([updated])
  }

  const handleSwitchToActiveStudent = async () => {
    if (!currentUser) return
    const mhs = mahasiswa.find(m => m.id_user === currentUser.id_user)
    if (mhs && mhs.status === 'Aktif') {
      const updatedUser: User = { ...currentUser, role: 'mahasiswa' }
      setUsers(prev => prev.map(u => u.id_user === currentUser.id_user ? updatedUser : u))
      setCurrentUser(updatedUser)
      await api.upsertUsers([updatedUser])
    }
  }

  const handleApproveMaba = async (userId: string, assignedNIM: string) => {
    const updatedMhs = mahasiswa.map(m =>
      m.id_user === userId ? { ...m, status: 'Aktif' as const, nim: assignedNIM } : m
    )
    const updatedBerkas = berkasList.map(b =>
      b.id_user === userId ? { ...b, status_verifikasi: 'Disetujui' as const } : b
    )
    const updatedUsers = users.map(u =>
      u.id_user === userId ? { ...u, role: 'mahasiswa' as const } : u
    )

    setMahasiswa(updatedMhs)
    setBerkasList(updatedBerkas)
    setUsers(updatedUsers)

    const mhsTarget = updatedMhs.find(m => m.id_user === userId)
    const bTarget = updatedBerkas.find(b => b.id_user === userId)
    const uTarget = updatedUsers.find(u => u.id_user === userId)
    await Promise.all([
      mhsTarget && api.upsertMahasiswa([mhsTarget]),
      bTarget && api.upsertBerkas([bTarget]),
      uTarget && api.upsertUsers([uTarget]),
    ])

    if (currentUser?.id_user === userId) {
      const newRole: User = { ...currentUser, role: 'mahasiswa' }
      setCurrentUser(newRole)
    }
  }

  const handleRejectMaba = async (userId: string, feedback: string) => {
    const updated = berkasList.map(b =>
      b.id_user === userId ? { ...b, status_verifikasi: 'Ditolak' as const, catatan: feedback } : b
    )
    setBerkasList(updated)
    const target = updated.find(b => b.id_user === userId)
    if (target) await api.upsertBerkas([target])
  }

  const handleAddSchedule = async (data: Omit<JadwalKuliah, 'id_jadwal'>) => {
    const newSchedule: JadwalKuliah = { id_jadwal: `J_${Date.now()}`, ...data }
    setJadwalKuliahList(prev => [...prev, newSchedule])
    await api.upsertJadwal([newSchedule])
  }

  const handleDeleteSchedule = async (idJadwal: string) => {
    setJadwalKuliahList(prev => prev.filter(j => j.id_jadwal !== idJadwal))
    await api.deleteJadwal([idJadwal])
  }

  const handleSaveGrade = async (nim: string, kodeMk: string, nilaiAngka: number, nilaiHuruf: string) => {
    const existing = nilaiList.find(n => n.nim === nim && n.kode_mk === kodeMk)
    const grade: Nilai = existing
      ? { ...existing, nilai_angka: nilaiAngka, nilai_huruf: nilaiHuruf }
      : { id_nilai: `N_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, nim, kode_mk: kodeMk, nilai_angka: nilaiAngka, nilai_huruf: nilaiHuruf }

    setNilaiList(prev => prev.filter(n => !(n.nim === nim && n.kode_mk === kodeMk)).concat(grade))
    await api.upsertNilai([grade])
  }

  const handleSaveKRS = async (selectedJadwalIds: string[]) => {
    const activeMhs = mahasiswa.find(m => m.id_user === currentUser?.id_user)
    if (!activeMhs) return

    const newKrsId = `KRS_${Date.now()}`
    const newKRS: KRS = {
      id_krs: newKrsId, nim: activeMhs.nim,
      semester_aktif: currentSystemSemester, tanggal_krs: new Date().toISOString()
    }
    const newDetails: DetailKRS[] = selectedJadwalIds.map((jadwalId, index) => ({
      id_detail: `DKRS_${Date.now()}_${index}`, id_krs: newKrsId, id_jadwal: jadwalId
    }))

    const prevKrs = krsList.find(k => k.nim === activeMhs.nim && k.semester_aktif === currentSystemSemester)
    if (prevKrs) await api.deleteDetailKRSByKrsId(prevKrs.id_krs)
    await api.deleteKRSByNimSemester(activeMhs.nim, currentSystemSemester)

    await api.upsertKRS([newKRS])
    await api.upsertDetailKRS(newDetails)

    setKrsList(prev => prev.filter(k => !(k.nim === activeMhs.nim && k.semester_aktif === currentSystemSemester)).concat(newKRS))
    setDetailKrsList(prev => {
      const filtered = prevKrs ? prev.filter(d => d.id_krs !== prevKrs.id_krs) : prev
      return filtered.concat(newDetails)
    })

    alert(`KRS Anda untuk Semester ${currentSystemSemester} berhasil disimpan!`)
  }

  const currentMahasiswaProfile = mahasiswa.find(m => m.id_user === currentUser?.id_user)
  const currentBerkasProfile = berkasList.find(b => b.id_user === currentUser?.id_user)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" id="sia-loading">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat database akademik...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800" id="sia-app-container">
      <SimulatorBar
        users={users}
        mahasiswa={mahasiswa}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onResetData={handleResetData}
        currentSemester={currentSystemSemester}
        onChangeSemester={setCurrentSystemSemester}
        semesters={semesters}
        onAddSemester={handleAddSemester}
      />

      <Header
        currentUser={currentUser}
        mahasiswa={currentMahasiswaProfile}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!currentUser ? (
          <AuthScreen
            onLogin={handleLogin}
            onRegister={handleRegister}
            onSwitchToSimulationUser={handleSwitchUser}
          />
        ) : (
          <div className="space-y-6">
            {currentUser.role === 'maba' && (
              <MabaView
                currentUser={currentUser}
                mahasiswa={currentMahasiswaProfile}
                berkas={currentBerkasProfile}
                onUpdateProfile={handleUpdateProfile}
                onUploadBerkas={handleUploadBerkas}
                onSwitchToActiveStudent={handleSwitchToActiveStudent}
              />
            )}

            {currentUser.role === 'mahasiswa' && currentMahasiswaProfile && (
              <MahasiswaActiveView
                currentUser={currentUser}
                mahasiswa={currentMahasiswaProfile}
                mataKuliahList={mataKuliahList}
                jadwalKuliahList={jadwalKuliahList}
                nilaiList={nilaiList}
                krsList={krsList}
                detailKrsList={detailKrsList}
                onSaveKRS={handleSaveKRS}
                currentSemester={currentSystemSemester}
              />
            )}

            {currentUser.role === 'admin' && (
              <AdminView
                users={users}
                mahasiswa={mahasiswa}
                berkasList={berkasList}
                mataKuliahList={mataKuliahList}
                jadwalKuliahList={jadwalKuliahList}
                nilaiList={nilaiList}
                krsList={krsList}
                detailKrsList={detailKrsList}
                currentSemester={currentSystemSemester}
                onSaveGrade={handleSaveGrade}
                onApproveMaba={handleApproveMaba}
                onRejectMaba={handleRejectMaba}
                onAddSchedule={handleAddSchedule}
                onDeleteSchedule={handleDeleteSchedule}
              />
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200/60 py-6 text-center text-xs text-slate-400 font-medium shrink-0 mt-12">
        <p>© 2026 Universitas Teknologi Akademik. Dikembangkan secara mandiri melalui Sistem Informasi Akademik.</p>
      </footer>
    </div>
  )
}
