-- Run this SQL in Supabase Dashboard -> SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_user TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('maba', 'mahasiswa', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mahasiswa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nim TEXT DEFAULT '',
  id_user TEXT REFERENCES users(id_user) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  tempat_lahir TEXT NOT NULL,
  tanggal_lahir TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Calon' CHECK (status IN ('Calon', 'Aktif', 'Ditolak'))
);

CREATE TABLE berkas_pendaftaran (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_berkas TEXT UNIQUE NOT NULL,
  id_user TEXT REFERENCES users(id_user) ON DELETE CASCADE,
  file_ijazah_name TEXT NOT NULL DEFAULT '',
  file_transkrip_name TEXT NOT NULL DEFAULT '',
  status_verifikasi TEXT NOT NULL DEFAULT 'Pending' CHECK (status_verifikasi IN ('Pending', 'Disetujui', 'Ditolak')),
  catatan TEXT DEFAULT '',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mata_kuliah (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kode_mk TEXT UNIQUE NOT NULL,
  nama_mk TEXT NOT NULL,
  sks INTEGER NOT NULL,
  semester INTEGER NOT NULL
);

CREATE TABLE jadwal_kuliah (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_jadwal TEXT UNIQUE NOT NULL,
  kode_mk TEXT REFERENCES mata_kuliah(kode_mk),
  hari TEXT NOT NULL,
  jam_mulai TEXT NOT NULL,
  jam_selesai TEXT NOT NULL,
  ruangan TEXT NOT NULL
);

CREATE TABLE krs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_krs TEXT UNIQUE NOT NULL,
  nim TEXT NOT NULL,
  semester_aktif INTEGER NOT NULL,
  tanggal_krs TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE detail_krs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_detail TEXT UNIQUE NOT NULL,
  id_krs TEXT REFERENCES krs(id_krs),
  id_jadwal TEXT REFERENCES jadwal_kuliah(id_jadwal)
);

CREATE TABLE nilai (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_nilai TEXT UNIQUE NOT NULL,
  nim TEXT NOT NULL,
  kode_mk TEXT REFERENCES mata_kuliah(kode_mk),
  nilai_angka INTEGER NOT NULL,
  nilai_huruf TEXT NOT NULL
);

CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mahasiswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE berkas_pendaftaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE mata_kuliah ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_kuliah ENABLE ROW LEVEL SECURITY;
ALTER TABLE krs ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_krs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- RLS: Admin can read/write all
CREATE POLICY "admin_all_users" ON users FOR ALL USING (true);
CREATE POLICY "admin_all_mahasiswa" ON mahasiswa FOR ALL USING (true);
CREATE POLICY "admin_all_berkas" ON berkas_pendaftaran FOR ALL USING (true);
CREATE POLICY "admin_all_mk" ON mata_kuliah FOR ALL USING (true);
CREATE POLICY "admin_all_jadwal" ON jadwal_kuliah FOR ALL USING (true);
CREATE POLICY "admin_all_krs" ON krs FOR ALL USING (true);
CREATE POLICY "admin_all_detail_krs" ON detail_krs FOR ALL USING (true);
CREATE POLICY "admin_all_nilai" ON nilai FOR ALL USING (true);
CREATE POLICY "admin_all_config" ON system_config FOR ALL USING (true);

-- Seed data
INSERT INTO users (id_user, username, email, role) VALUES
  ('U_ADMIN', 'admin', 'admin@akademik.ac.id', 'admin'),
  ('U_MHS_ACTIVE', 'ahmad', 'ahmad.fauzi@student.ac.id', 'mahasiswa'),
  ('U_MHS_PENDING', 'budi', 'budi.santoso@gmail.com', 'maba');

INSERT INTO mahasiswa (nim, id_user, nama, tempat_lahir, tanggal_lahir, status) VALUES
  ('202401012', 'U_MHS_ACTIVE', 'Ahmad Fauzi', 'Surabaya', '2004-05-12', 'Aktif'),
  ('', 'U_MHS_PENDING', 'Budi Santoso', 'Jakarta', '2006-08-20', 'Calon');

INSERT INTO berkas_pendaftaran (id_berkas, id_user, file_ijazah_name, file_transkrip_name, status_verifikasi, uploaded_at) VALUES
  ('B_001', 'U_MHS_PENDING', 'ijazah_sma_budi_santoso.pdf', 'skhun_sma_budi_santoso.pdf', 'Pending', '2026-07-01T10:30:00.000Z');

INSERT INTO mata_kuliah (kode_mk, nama_mk, sks, semester) VALUES
  ('IF101', 'Algoritma & Pemrograman', 4, 1),
  ('IF102', 'Matematika Diskrit', 3, 1),
  ('IF103', 'Pengantar Teknologi Informasi', 2, 1),
  ('IF201', 'Struktur Data', 3, 2),
  ('IF202', 'Sistem Operasi', 3, 2),
  ('IF203', 'Basis Data', 4, 2),
  ('IF301', 'Pemrograman Web', 3, 3),
  ('IF302', 'Jaringan Komputer', 3, 3),
  ('IF303', 'Statistika Komputasi', 3, 3),
  ('IF401', 'Kecerdasan Buatan', 4, 4),
  ('IF402', 'Rekayasa Perangkat Lunak', 3, 4),
  ('IF501', 'Pemrograman Mobile', 3, 5),
  ('IF502', 'Kriptografi & Keamanan Informasi', 3, 5);

INSERT INTO jadwal_kuliah (id_jadwal, kode_mk, hari, jam_mulai, jam_selesai, ruangan) VALUES
  ('J01', 'IF101', 'Senin', '08:00', '11:40', 'Lab Komputer 1'),
  ('J02', 'IF102', 'Selasa', '10:00', '12:30', 'Ruang Teori 301'),
  ('J03', 'IF103', 'Rabu', '08:00', '09:40', 'Ruang Teori 102'),
  ('J04', 'IF201', 'Senin', '13:00', '15:30', 'Lab Komputer 2'),
  ('J05', 'IF202', 'Kamis', '08:00', '10:30', 'Ruang Teori 205'),
  ('J06', 'IF203', 'Jumat', '08:00', '11:40', 'Lab Komputer 1'),
  ('J07', 'IF301', 'Senin', '09:00', '11:30', 'Lab Komputer 3'),
  ('J08', 'IF302', 'Rabu', '13:00', '15:30', 'Lab Komputer 2'),
  ('J09', 'IF303', 'Kamis', '10:40', '13:10', 'Ruang Teori 302'),
  ('J10', 'IF401', 'Selasa', '08:00', '11:40', 'Lab Komputer 3'),
  ('J11', 'IF402', 'Jumat', '13:30', '16:00', 'Ruang Teori 401'),
  ('J12', 'IF501', 'Rabu', '10:00', '12:30', 'Lab Komputer 1'),
  ('J13', 'IF502', 'Kamis', '14:00', '16:30', 'Ruang Teori 201');

INSERT INTO nilai (id_nilai, nim, kode_mk, nilai_angka, nilai_huruf) VALUES
  ('N01', '202401012', 'IF101', 88, 'A'),
  ('N02', '202401012', 'IF102', 72, 'B'),
  ('N03', '202401012', 'IF103', 92, 'A'),
  ('N04', '202401012', 'IF201', 82, 'AB'),
  ('N05', '202401012', 'IF202', 85, 'A'),
  ('N06', '202401012', 'IF203', 70, 'B');

INSERT INTO system_config (key, value) VALUES
  ('current_semester', '3'::jsonb),
  ('semesters', '[3, 4]'::jsonb);
