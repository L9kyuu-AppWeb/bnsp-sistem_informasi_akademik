export type UserRole = 'maba' | 'mahasiswa' | 'admin';

export interface User {
  id_user: string;
  username: string;
  password?: string;
  email: string;
  role: UserRole;
}

export interface Mahasiswa {
  nim: string; // Will be generated automatically when approved
  id_user: string;
  nama: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  status: 'Calon' | 'Aktif' | 'Ditolak';
}

export interface BerkasPendaftaran {
  id_berkas: string;
  id_user: string;
  file_ijazah_name: string;
  file_transkrip_name: string;
  status_verifikasi: 'Pending' | 'Disetujui' | 'Ditolak';
  catatan?: string;
  uploaded_at: string;
}

export interface MataKuliah {
  kode_mk: string;
  nama_mk: string;
  sks: number;
  semester: number;
}

export interface JadwalKuliah {
  id_jadwal: string;
  kode_mk: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string;
}

export interface KRS {
  id_krs: string;
  nim: string;
  semester_aktif: number;
  tanggal_krs: string;
}

export interface DetailKRS {
  id_detail: string;
  id_krs: string;
  id_jadwal: string;
}

export interface Nilai {
  id_nilai: string;
  nim: string;
  kode_mk: string;
  nilai_angka: number;
  nilai_huruf: string; // 'A' | 'B' | 'C' | 'D' | 'E'
}
