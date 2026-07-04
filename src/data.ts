import { User, Mahasiswa, BerkasPendaftaran, MataKuliah, JadwalKuliah, Nilai } from './types';

export const initialMataKuliah: MataKuliah[] = [
  { kode_mk: 'IF101', nama_mk: 'Algoritma & Pemrograman', sks: 4, semester: 1 },
  { kode_mk: 'IF102', nama_mk: 'Matematika Diskrit', sks: 3, semester: 1 },
  { kode_mk: 'IF103', nama_mk: 'Pengantar Teknologi Informasi', sks: 2, semester: 1 },
  { kode_mk: 'IF201', nama_mk: 'Struktur Data', sks: 3, semester: 2 },
  { kode_mk: 'IF202', nama_mk: 'Sistem Operasi', sks: 3, semester: 2 },
  { kode_mk: 'IF203', nama_mk: 'Basis Data', sks: 4, semester: 2 },
  { kode_mk: 'IF301', nama_mk: 'Pemrograman Web', sks: 3, semester: 3 },
  { kode_mk: 'IF302', nama_mk: 'Jaringan Komputer', sks: 3, semester: 3 },
  { kode_mk: 'IF303', nama_mk: 'Statistika Komputasi', sks: 3, semester: 3 },
  { kode_mk: 'IF401', nama_mk: 'Kecerdasan Buatan', sks: 4, semester: 4 },
  { kode_mk: 'IF402', nama_mk: 'Rekayasa Perangkat Lunak', sks: 3, semester: 4 },
  { kode_mk: 'IF501', nama_mk: 'Pemrograman Mobile', sks: 3, semester: 5 },
  { kode_mk: 'IF502', nama_mk: 'Kriptografi & Keamanan Informasi', sks: 3, semester: 5 },
];

export const initialJadwalKuliah: JadwalKuliah[] = [
  { id_jadwal: 'J01', kode_mk: 'IF101', hari: 'Senin', jam_mulai: '08:00', jam_selesai: '11:40', ruangan: 'Lab Komputer 1' },
  { id_jadwal: 'J02', kode_mk: 'IF102', hari: 'Selasa', jam_mulai: '10:00', jam_selesai: '12:30', ruangan: 'Ruang Teori 301' },
  { id_jadwal: 'J03', kode_mk: 'IF103', hari: 'Rabu', jam_mulai: '08:00', jam_selesai: '09:40', ruangan: 'Ruang Teori 102' },
  { id_jadwal: 'J04', kode_mk: 'IF201', hari: 'Senin', jam_mulai: '13:00', jam_selesai: '15:30', ruangan: 'Lab Komputer 2' },
  { id_jadwal: 'J05', kode_mk: 'IF202', hari: 'Kamis', jam_mulai: '08:00', jam_selesai: '10:30', ruangan: 'Ruang Teori 205' },
  { id_jadwal: 'J06', kode_mk: 'IF203', hari: 'Jumat', jam_mulai: '08:00', jam_selesai: '11:40', ruangan: 'Lab Komputer 1' },
  { id_jadwal: 'J07', kode_mk: 'IF301', hari: 'Senin', jam_mulai: '09:00', jam_selesai: '11:30', ruangan: 'Lab Komputer 3' },
  { id_jadwal: 'J08', kode_mk: 'IF302', hari: 'Rabu', jam_mulai: '13:00', jam_selesai: '15:30', ruangan: 'Lab Komputer 2' },
  { id_jadwal: 'J09', kode_mk: 'IF303', hari: 'Kamis', jam_mulai: '10:40', jam_selesai: '13:10', ruangan: 'Ruang Teori 302' },
  { id_jadwal: 'J10', kode_mk: 'IF401', hari: 'Selasa', jam_mulai: '08:00', jam_selesai: '11:40', ruangan: 'Lab Komputer 3' },
  { id_jadwal: 'J11', kode_mk: 'IF402', hari: 'Jumat', jam_mulai: '13:30', jam_selesai: '16:00', ruangan: 'Ruang Teori 401' },
  { id_jadwal: 'J12', kode_mk: 'IF501', hari: 'Rabu', jam_mulai: '10:00', jam_selesai: '12:30', ruangan: 'Lab Komputer 1' },
  { id_jadwal: 'J13', kode_mk: 'IF502', hari: 'Kamis', jam_mulai: '14:00', jam_selesai: '16:30', ruangan: 'Ruang Teori 201' },
];

export const initialUsers: User[] = [
  { id_user: 'U_ADMIN', username: 'admin', email: 'admin@akademik.ac.id', role: 'admin' },
  { id_user: 'U_MHS_ACTIVE', username: 'ahmad', email: 'ahmad.fauzi@student.ac.id', role: 'mahasiswa' },
  { id_user: 'U_MHS_PENDING', username: 'budi', email: 'budi.santoso@gmail.com', role: 'maba' },
];

export const initialMahasiswa: Mahasiswa[] = [
  { nim: '202401012', id_user: 'U_MHS_ACTIVE', nama: 'Ahmad Fauzi', tempat_lahir: 'Surabaya', tanggal_lahir: '2004-05-12', status: 'Aktif' },
  { nim: '', id_user: 'U_MHS_PENDING', nama: 'Budi Santoso', tempat_lahir: 'Jakarta', tanggal_lahir: '2006-08-20', status: 'Calon' },
];

export const initialBerkasPendaftaran: BerkasPendaftaran[] = [
  {
    id_berkas: 'B_001',
    id_user: 'U_MHS_PENDING',
    file_ijazah_name: 'ijazah_sma_budi_santoso.pdf',
    file_transkrip_name: 'skhun_sma_budi_santoso.pdf',
    status_verifikasi: 'Pending',
    uploaded_at: '2026-07-01T10:30:00.000Z'
  }
];

export const initialNilai: Nilai[] = [
  // Semester 1 Grades for Ahmad Fauzi
  { id_nilai: 'N01', nim: '202401012', kode_mk: 'IF101', nilai_angka: 88, nilai_huruf: 'A' },
  { id_nilai: 'N02', nim: '202401012', kode_mk: 'IF102', nilai_angka: 72, nilai_huruf: 'B' },
  { id_nilai: 'N03', nim: '202401012', kode_mk: 'IF103', nilai_angka: 92, nilai_huruf: 'A' },
  
  // Semester 2 Grades for Ahmad Fauzi
  { id_nilai: 'N04', nim: '202401012', kode_mk: 'IF201', nilai_angka: 82, nilai_huruf: 'AB' },
  { id_nilai: 'N05', nim: '202401012', kode_mk: 'IF202', nilai_angka: 85, nilai_huruf: 'A' },
  { id_nilai: 'N06', nim: '202401012', kode_mk: 'IF203', nilai_angka: 70, nilai_huruf: 'B' },
];

export function calculateGradeWeight(grade: string): number {
  switch (grade) {
    case 'A': return 4.0;
    case 'AB': return 3.5;
    case 'B': return 3.0;
    case 'BC': return 2.5;
    case 'C': return 2.0;
    case 'D': return 1.0;
    case 'E': return 0.0;
    default: return 0.0;
  }
}
