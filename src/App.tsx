import React, { useState, useEffect } from 'react';
import { User, Mahasiswa, BerkasPendaftaran, MataKuliah, JadwalKuliah, KRS, DetailKRS, Nilai } from './types';
import {
  initialUsers,
  initialMahasiswa,
  initialBerkasPendaftaran,
  initialMataKuliah,
  initialJadwalKuliah,
  initialNilai,
} from './data';
import Header from './components/Header';
import SimulatorBar from './components/SimulatorBar';
import AuthScreen from './components/AuthScreen';
import MabaView from './components/MabaView';
import MahasiswaActiveView from './components/MahasiswaActiveView';
import AdminView from './components/AdminView';

export default function App() {
  // --- Persistent State Keys ---
  const STORAGE_PREFIX = 'sia_v1_';

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}users`);
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [mahasiswa, setMahasiswa] = useState<Mahasiswa[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}mahasiswa`);
    return saved ? JSON.parse(saved) : initialMahasiswa;
  });

  const [berkasList, setBerkasList] = useState<BerkasPendaftaran[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}berkasList`);
    return saved ? JSON.parse(saved) : initialBerkasPendaftaran;
  });

  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}mataKuliahList`);
    return saved ? JSON.parse(saved) : initialMataKuliah;
  });

  const [jadwalKuliahList, setJadwalKuliahList] = useState<JadwalKuliah[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}jadwalKuliahList`);
    return saved ? JSON.parse(saved) : initialJadwalKuliah;
  });

  const [nilaiList, setNilaiList] = useState<Nilai[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}nilaiList`);
    return saved ? JSON.parse(saved) : initialNilai;
  });

  const [krsList, setKrsList] = useState<KRS[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}krsList`);
    return saved ? JSON.parse(saved) : [];
  });

  const [detailKrsList, setDetailKrsList] = useState<DetailKRS[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}detailKrsList`);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}currentUser`);
    return saved ? JSON.parse(saved) : null;
  });

  const [currentSystemSemester, setCurrentSystemSemester] = useState<number>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}currentSystemSemester`);
    return saved ? Number(saved) : 3;
  });

  const [semesters, setSemesters] = useState<number[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}semesters`);
    return saved ? JSON.parse(saved) : [3, 4];
  });

  const handleAddSemester = (sem: number) => {
    setSemesters((prev) => {
      const next = [...prev, sem].sort((a, b) => a - b);
      localStorage.setItem(`${STORAGE_PREFIX}semesters`, JSON.stringify(next));
      return next;
    });
  };

  // --- Save states to LocalStorage on change ---
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}currentSystemSemester`, currentSystemSemester.toString());
  }, [currentSystemSemester]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}mahasiswa`, JSON.stringify(mahasiswa));
  }, [mahasiswa]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}berkasList`, JSON.stringify(berkasList));
  }, [berkasList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}mataKuliahList`, JSON.stringify(mataKuliahList));
  }, [mataKuliahList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}jadwalKuliahList`, JSON.stringify(jadwalKuliahList));
  }, [jadwalKuliahList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}nilaiList`, JSON.stringify(nilaiList));
  }, [nilaiList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}krsList`, JSON.stringify(krsList));
  }, [krsList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}detailKrsList`, JSON.stringify(detailKrsList));
  }, [detailKrsList]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`${STORAGE_PREFIX}currentUser`, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(`${STORAGE_PREFIX}currentUser`);
    }
  }, [currentUser]);

  // --- Business Logic Functions ---

  // Handle Login using username, email, or NIM
  const handleLogin = (identifier: string): boolean => {
    const cleanId = identifier.trim().toLowerCase();
    
    // 1. Try finding by username or email in users table
    let foundUser = users.find(
      (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    // 2. Try finding by NIM in mahasiswa table
    if (!foundUser) {
      const mhs = mahasiswa.find((m) => m.nim.toLowerCase() === cleanId);
      if (mhs) {
        foundUser = users.find((u) => u.id_user === mhs.id_user);
      }
    }

    if (foundUser) {
      setCurrentUser(foundUser);
      return true;
    }
    return false;
  };

  // Register a new calon maba
  const handleRegister = (data: {
    username: string;
    email: string;
    nama: string;
    tempatLahir: string;
    tanggalLahir: string;
  }) => {
    const newUserId = `U_${Date.now()}`;
    
    const newUser: User = {
      id_user: newUserId,
      username: data.username,
      email: data.email,
      role: 'maba',
    };

    const newMhs: Mahasiswa = {
      nim: '', // Empty until admin approves
      id_user: newUserId,
      nama: data.nama,
      tempat_lahir: data.tempatLahir,
      tanggal_lahir: data.tanggalLahir,
      status: 'Calon',
    };

    setUsers((prev) => [...prev, newUser]);
    setMahasiswa((prev) => [...prev, newMhs]);
    
    // Automatically log in the newly registered user for a seamless experience
    setCurrentUser(newUser);
  };

  // Switch user instantly from the Simulator Bar
  const handleSwitchUser = (userId: string) => {
    const targetUser = users.find((u) => u.id_user === userId);
    if (targetUser) {
      setCurrentUser(targetUser);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Reset demo data back to initial states
  const handleResetData = () => {
    localStorage.clear();
    setUsers(initialUsers);
    setMahasiswa(initialMahasiswa);
    setBerkasList(initialBerkasPendaftaran);
    setMataKuliahList(initialMataKuliah);
    setJadwalKuliahList(initialJadwalKuliah);
    setNilaiList(initialNilai);
    setKrsList([]);
    setDetailKrsList([]);
    setSemesters([3, 4]);
    setCurrentUser(null);
  };

  // Calon Maba: Update profile biodata
  const handleUpdateProfile = (namaInput: string, tempat: string, tgl: string) => {
    if (!currentUser) return;
    setMahasiswa((prev) =>
      prev.map((m) =>
        m.id_user === currentUser.id_user
          ? { ...m, nama: namaInput, tempat_lahir: tempat, tanggal_lahir: tgl }
          : m
      )
    );
  };

  // Calon Maba: Upload mock documents
  const handleUploadBerkas = (ijazahName: string, transkripName: string) => {
    if (!currentUser) return;
    
    // Check if there is an existing record to update (e.g. if recovering from a rejection)
    const existingIndex = berkasList.findIndex((b) => b.id_user === currentUser.id_user);
    
    if (existingIndex > -1) {
      setBerkasList((prev) =>
        prev.map((b) =>
          b.id_user === currentUser.id_user
            ? {
                ...b,
                file_ijazah_name: ijazahName,
                file_transkrip_name: transkripName,
                status_verifikasi: 'Pending',
                catatan: '',
              }
            : b
        )
      );
    } else {
      const newBerkas: BerkasPendaftaran = {
        id_berkas: `B_${Date.now()}`,
        id_user: currentUser.id_user,
        file_ijazah_name: ijazahName,
        file_transkrip_name: transkripName,
        status_verifikasi: 'Pending',
        uploaded_at: new Date().toISOString(),
      };
      setBerkasList((prev) => [...prev, newBerkas]);
    }
  };

  // Instant login as active student once approved
  const handleSwitchToActiveStudent = () => {
    if (!currentUser) return;
    const mhs = mahasiswa.find((m) => m.id_user === currentUser.id_user);
    if (mhs && mhs.status === 'Aktif') {
      const updatedUser: User = { ...currentUser, role: 'mahasiswa' };
      setUsers((prev) => prev.map((u) => (u.id_user === currentUser.id_user ? updatedUser : u)));
      setCurrentUser(updatedUser);
    }
  };

  // Admin: Approve Calon Maba (Generates sequential NIM and shifts status to 'Aktif')
  const handleApproveMaba = (userId: string, assignedNIM: string) => {
    // 1. Update Mahasiswa table: status to 'Aktif', assign the generated NIM
    setMahasiswa((prev) =>
      prev.map((m) => (m.id_user === userId ? { ...m, status: 'Aktif', nim: assignedNIM } : m))
    );

    // 2. Update Berkas table: status to 'Disetujui'
    setBerkasList((prev) =>
      prev.map((b) => (b.id_user === userId ? { ...b, status_verifikasi: 'Disetujui' } : b))
    );

    // 3. Update User table: change role to 'mahasiswa'
    setUsers((prev) =>
      prev.map((u) => (u.id_user === userId ? { ...u, role: 'mahasiswa' } : u))
    );

    // If the approved user is current user, update session immediately
    if (currentUser?.id_user === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role: 'mahasiswa' } : null));
    }
  };

  // Admin: Reject Calon Maba with custom feedback reason
  const handleRejectMaba = (userId: string, feedback: string) => {
    setBerkasList((prev) =>
      prev.map((b) => (b.id_user === userId ? { ...b, status_verifikasi: 'Ditolak', catatan: feedback } : b))
    );
  };

  // Admin: Add new curriculum course schedule
  const handleAddSchedule = (data: Omit<JadwalKuliah, 'id_jadwal'>) => {
    const newSchedule: JadwalKuliah = {
      id_jadwal: `J_${Date.now()}`,
      ...data,
    };
    setJadwalKuliahList((prev) => [...prev, newSchedule]);
  };

  // Admin: Delete course schedule
  const handleDeleteSchedule = (idJadwal: string) => {
    setJadwalKuliahList((prev) => prev.filter((j) => j.id_jadwal !== idJadwal));
  };

  // Admin: Input / Update student grade (penilaian)
  const handleSaveGrade = (nim: string, kodeMk: string, nilaiAngka: number, nilaiHuruf: string) => {
    setNilaiList((prev) => {
      const existingIndex = prev.findIndex((n) => n.nim === nim && n.kode_mk === kodeMk);
      if (existingIndex > -1) {
        return prev.map((n, idx) =>
          idx === existingIndex ? { ...n, nilai_angka: nilaiAngka, nilai_huruf: nilaiHuruf } : n
        );
      } else {
        const newGrade: Nilai = {
          id_nilai: `N_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          nim,
          kode_mk: kodeMk,
          nilai_angka: nilaiAngka,
          nilai_huruf: nilaiHuruf,
        };
        return [...prev, newGrade];
      }
    });
  };

  // Mahasiswa Aktif: Save/Finalize KRS selection
  const handleSaveKRS = (selectedJadwalIds: string[]) => {
    const activeMhs = mahasiswa.find((m) => m.id_user === currentUser?.id_user);
    if (!activeMhs) return;

    const newKrsId = `KRS_${Date.now()}`;
    const newKRS: KRS = {
      id_krs: newKrsId,
      nim: activeMhs.nim,
      semester_aktif: currentSystemSemester,
      tanggal_krs: new Date().toISOString(),
    };

    const newDetails: DetailKRS[] = selectedJadwalIds.map((jadwalId, index) => ({
      id_detail: `DKRS_${Date.now()}_${index}`,
      id_krs: newKrsId,
      id_jadwal: jadwalId,
    }));

    // Remove any previous KRS for this student for current semester to overwrite
    setKrsList((prev) => prev.filter((k) => !(k.nim === activeMhs.nim && k.semester_aktif === currentSystemSemester)));
    setDetailKrsList((prev) => prev.filter((d) => d.id_krs !== krsList.find((k) => k.nim === activeMhs.nim && k.semester_aktif === currentSystemSemester)?.id_krs));

    // Append new records
    setKrsList((prev) => [...prev, newKRS]);
    setDetailKrsList((prev) => [...prev, ...newDetails]);
    alert(`KRS Anda untuk Semester ${currentSystemSemester} berhasil disimpan dan dikunci ke database akademik!`);
  };

  // Retrieve current active student's profile bio
  const currentMahasiswaProfile = mahasiswa.find((m) => m.id_user === currentUser?.id_user);
  
  // Retrieve current active student's uploaded documents
  const currentBerkasProfile = berkasList.find((b) => b.id_user === currentUser?.id_user);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800" id="sia-app-container">
      {/* 1. Global Simulation Controller Bar at top */}
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

      {/* 2. Top Navigation Bar */}
      <Header
        currentUser={currentUser}
        mahasiswa={currentMahasiswaProfile}
        onLogout={handleLogout}
      />

      {/* 3. Primary Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!currentUser ? (
          /* Authentication Screen (Login/Register) if no active session */
          <AuthScreen
            onLogin={handleLogin}
            onRegister={handleRegister}
            onSwitchToSimulationUser={handleSwitchUser}
          />
        ) : (
          /* Render designated interface based on current user role */
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

      {/* 4. Footer */}
      <footer className="bg-white border-t border-slate-200/60 py-6 text-center text-xs text-slate-400 font-medium shrink-0 mt-12">
        <p>© 2026 Universitas Teknologi Akademik. Dikembangkan secara mandiri melalui Sistem Informasi Akademik.</p>
      </footer>
    </div>
  );
}
