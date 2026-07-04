import React, { useState, useMemo } from 'react';
import { User, Mahasiswa, BerkasPendaftaran, MataKuliah, JadwalKuliah, Nilai, KRS, DetailKRS } from '../types';
import { calculateGradeWeight } from '../data';
import {
  Users,
  BookOpen,
  FileText,
  Check,
  X,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  ClipboardList,
  AlertCircle,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Award,
  Save,
  CheckSquare,
} from 'lucide-react';

interface AdminViewProps {
  users: User[];
  mahasiswa: Mahasiswa[];
  berkasList: BerkasPendaftaran[];
  mataKuliahList: MataKuliah[];
  jadwalKuliahList: JadwalKuliah[];
  nilaiList: Nilai[];
  krsList: KRS[];
  detailKrsList: DetailKRS[];
  onSaveGrade: (nim: string, kodeMk: string, nilaiAngka: number, nilaiHuruf: string) => void;
  onApproveMaba: (userId: string, nim: string) => void;
  onRejectMaba: (userId: string, catatan: string) => void;
  onAddSchedule: (schedule: Omit<JadwalKuliah, 'id_jadwal'>) => void;
  onDeleteSchedule: (idJadwal: string) => void;
  currentSemester: number;
}

export default function AdminView({
  users,
  mahasiswa,
  berkasList,
  mataKuliahList,
  jadwalKuliahList,
  nilaiList,
  krsList,
  detailKrsList,
  onSaveGrade,
  onApproveMaba,
  onRejectMaba,
  onAddSchedule,
  onDeleteSchedule,
  currentSemester,
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'verification' | 'schedules' | 'students'>('verification');

  // Search state
  const [mhsSearchQuery, setMhsSearchQuery] = useState('');

  // Course schedule creation state
  const [selectedKodeMk, setSelectedKodeMk] = useState(mataKuliahList[0]?.kode_mk || '');
  const [hari, setHari] = useState('Senin');
  const [jamMulai, setJamMulai] = useState('08:00');
  const [jamSelesai, setJamSelesai] = useState('10:30');
  const [ruangan, setRuangan] = useState('Ruang Teori 101');

  // Maba review states
  const [reviewUserId, setReviewUserId] = useState<string | null>(null);
  const [rejectionCatatan, setRejectionCatatan] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; type: 'ijazah' | 'transkrip'; studentName: string } | null>(null);

  // Active student grading state
  const [selectedStudentNim, setSelectedStudentNim] = useState<string | null>(null);
  const [scoringInputs, setScoringInputs] = useState<Record<string, { numeric: string; letter: string }>>({});

  const handleScoreChange = (kodeMk: string, val: string) => {
    const numVal = parseInt(val, 10);
    let letter = 'E';
    if (!isNaN(numVal)) {
      if (numVal >= 85) letter = 'A';
      else if (numVal >= 80) letter = 'AB';
      else if (numVal >= 70) letter = 'B';
      else if (numVal >= 60) letter = 'BC';
      else if (numVal >= 50) letter = 'C';
      else if (numVal >= 40) letter = 'D';
      else letter = 'E';
    }
    setScoringInputs((prev) => ({
      ...prev,
      [kodeMk]: { numeric: val, letter: isNaN(numVal) ? '' : letter },
    }));
  };

  const handleSaveCourseGrade = (nim: string, kodeMk: string) => {
    const scoreState = scoringInputs[kodeMk];
    if (!scoreState || scoreState.numeric === '') {
      alert('Silakan masukkan nilai angka terlebih dahulu!');
      return;
    }
    const numVal = parseInt(scoreState.numeric, 10);
    if (isNaN(numVal) || numVal < 0 || numVal > 100) {
      alert('Nilai angka harus berada di rentang 0 - 100!');
      return;
    }
    onSaveGrade(nim, kodeMk, numVal, scoreState.letter);
  };

  // Auto-generate NIM logic (e.g. 2026 + 01 (program code) + sequence 001)
  const proposedNIM = useMemo(() => {
    const prefix = '2026010';
    // Get count of existing active students to sequence
    const activeCount = mahasiswa.filter((m) => m.status === 'Aktif').length;
    const seq = (activeCount + 1).toString().padStart(3, '0');
    return `${prefix}${seq}`;
  }, [mahasiswa]);

  // Find all applicants (role 'maba')
  const mabaList = useMemo(() => {
    return users
      .filter((u) => u.role === 'maba')
      .map((user) => {
        const mhs = mahasiswa.find((m) => m.id_user === user.id_user);
        const berkas = berkasList.find((b) => b.id_user === user.id_user);
        return { user, mhs, berkas };
      });
  }, [users, mahasiswa, berkasList]);

  // Active students computed with real GPA & total SKS completed
  const activeStudentsList = useMemo(() => {
    return mahasiswa
      .filter((m) => m.status === 'Aktif')
      .map((mhs) => {
        const studentGrades = nilaiList.filter((n) => n.nim === mhs.nim);
        let completedSKS = 0;
        let points = 0;
        studentGrades.forEach((g) => {
          const mk = mataKuliahList.find((mkItem) => mkItem.kode_mk === g.kode_mk);
          if (mk) {
            completedSKS += mk.sks;
            points += mk.sks * calculateGradeWeight(g.nilai_huruf);
          }
        });
        const ipk = completedSKS > 0 ? points / completedSKS : 0.0;
        return {
          ...mhs,
          completedSKS,
          ipk,
        };
      })
      .filter((mhs) =>
        mhs.nama.toLowerCase().includes(mhsSearchQuery.toLowerCase()) ||
        mhs.nim.toLowerCase().includes(mhsSearchQuery.toLowerCase())
      );
  }, [mahasiswa, nilaiList, mataKuliahList, mhsSearchQuery]);

  // Form submission to create a schedule
  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKodeMk || !hari || !jamMulai || !jamSelesai || !ruangan) {
      alert('Semua bidang isian harus diisi!');
      return;
    }

    // Clash validation for room scheduling: Same day, same room, overlapping hours
    const hasClash = jadwalKuliahList.some((existing) => {
      if (existing.hari !== hari || existing.ruangan !== ruangan) return false;

      const [exStartH, exStartM] = existing.jam_mulai.split(':').map(Number);
      const [exEndH, exEndM] = existing.jam_selesai.split(':').map(Number);
      const [newStartH, newStartM] = jamMulai.split(':').map(Number);
      const [newEndH, newEndM] = jamSelesai.split(':').map(Number);

      const exStart = exStartH * 60 + exStartM;
      const exEnd = exEndH * 60 + exEndM;
      const newStart = newStartH * 60 + newStartM;
      const newEnd = newEndH * 60 + newEndM;

      return newStart < exEnd && exStart < newEnd;
    });

    if (hasClash) {
      alert(`BENTROK JADWAL: Ruangan ${ruangan} sudah digunakan pada hari ${hari} jam ${jamMulai} - ${jamSelesai}!`);
      return;
    }

    onAddSchedule({
      kode_mk: selectedKodeMk,
      hari,
      jam_mulai: jamMulai,
      jam_selesai: jamSelesai,
      ruangan,
    });

    // Reset some form
    setHari('Senin');
    setJamMulai('08:00');
    setJamSelesai('10:30');
    setRuangan('Ruang Teori 101');
    alert('Jadwal kuliah baru berhasil disimpan ke basis data.');
  };

  const handleReviewClick = (userId: string) => {
    setReviewUserId(userId);
    setShowRejectInput(false);
    setRejectionCatatan('');
  };

  const handleApproveClick = (userId: string) => {
    onApproveMaba(userId, proposedNIM);
    setReviewUserId(null);
    alert(`Sukses memverifikasi berkas mahasiswa. NIM baru berhasil diterbitkan: ${proposedNIM}`);
  };

  const handleRejectClick = (userId: string) => {
    if (!rejectionCatatan) {
      alert('Tulis alasan penolakan berkas terlebih dahulu!');
      return;
    }
    onRejectMaba(userId, rejectionCatatan);
    setReviewUserId(null);
    alert('Berkas pendaftaran ditolak. Notifikasi perbaikan berkas dikirim ke calon mahasiswa.');
  };

  return (
    <div className="space-y-6" id="admin-view">
      {/* Top Roster Header card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6" id="admin-header">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 bg-indigo-650 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-600/20">
            A
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Administrator Akademik</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Role: Academic Admin Desk | Universitas Teknologi Akademik
            </p>
          </div>
        </div>

        {/* Dashboard sub tabs switcher */}
        <div className="bg-slate-50 border border-slate-200 p-1 rounded-xl flex gap-1 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('verification')}
            className={`flex-1 md:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'verification'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            id="tab-admin-verification"
          >
            Verifikasi Maba
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`flex-1 md:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'schedules'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            id="tab-admin-schedules"
          >
            Kurikulum & Jadwal
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 md:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            id="tab-admin-students"
          >
            Mahasiswa Aktif
          </button>
        </div>
      </div>

      {/* TAB 1: VERIFIKASI MABA */}
      {activeTab === 'verification' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="admin-verification-view">
          {/* Main applicants table list */}
          <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-650" />
              <span>Daftar Calon Mahasiswa Baru (Pendaftar)</span>
            </h3>
            
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="p-4 pl-5">Calon Mahasiswa</th>
                    <th className="p-4">File Dokumen SMA</th>
                    <th className="p-4 text-center">Verifikasi Status</th>
                    <th className="p-4 text-right pr-5">Aksi Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {mabaList.length > 0 ? (
                    mabaList.map(({ user, mhs, berkas }) => (
                      <tr key={user.id_user} className="hover:bg-slate-50/40 transition-colors duration-150">
                        <td className="p-4 pl-5">
                          <span className="font-bold text-slate-900 block text-xs">{mhs?.nama || user.username}</span>
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{user.email}</span>
                          <span className="text-[10px] text-slate-500 block mt-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded w-max">Lahir: {mhs?.tempat_lahir}, {mhs?.tanggal_lahir}</span>
                        </td>
                        <td className="p-4">
                          {berkas ? (
                            <div className="flex flex-col gap-1.5 max-w-[180px]">
                              <button
                                onClick={() => setPreviewFile({
                                  name: berkas.file_ijazah_name,
                                  type: 'ijazah',
                                  studentName: mhs?.nama || user.username
                                })}
                                className="inline-flex items-center gap-1.5 text-[10px] text-indigo-700 font-mono bg-indigo-50 border border-indigo-100/50 hover:border-indigo-300 hover:bg-indigo-100/60 px-2 py-1 rounded-lg text-left transition-all cursor-pointer group/file"
                                title="Klik untuk pratinjau Ijazah"
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0 group-hover/file:scale-110 transition-transform" />
                                <span className="truncate underline decoration-dotted group-hover/file:text-indigo-900">{berkas.file_ijazah_name}</span>
                              </button>
                              <button
                                onClick={() => setPreviewFile({
                                  name: berkas.file_transkrip_name,
                                  type: 'transkrip',
                                  studentName: mhs?.nama || user.username
                                })}
                                className="inline-flex items-center gap-1.5 text-[10px] text-emerald-700 font-mono bg-emerald-50 border border-emerald-100/50 hover:border-emerald-350 hover:bg-emerald-100/60 px-2 py-1 rounded-lg text-left transition-all cursor-pointer group/file"
                                title="Klik untuk pratinjau Transkrip"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0 group-hover/file:scale-110 transition-transform" />
                                <span className="truncate underline decoration-dotted group-hover/file:text-emerald-900">{berkas.file_transkrip_name}</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Belum mengunggah berkas</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {berkas ? (
                            berkas.status_verifikasi === 'Pending' ? (
                              <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                Pending Review
                              </span>
                            ) : berkas.status_verifikasi === 'Disetujui' ? (
                              <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                Disetujui (NIM Terbit)
                              </span>
                            ) : (
                              <span className="inline-block text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                                Ditolak / Revisi
                              </span>
                            )
                          ) : (
                            <span className="inline-block text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                              Belum Mengajukan
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right pr-5">
                          {berkas ? (
                            <button
                              onClick={() => handleReviewClick(user.id_user)}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-sm text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                            >
                              Tinjau Berkas
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Menunggu Berkas</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                        Tidak ada pendaftar mahasiswa baru di sistem saat ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Drawer-like Review Panel */}
          <div className="lg:col-span-4 space-y-6">
            {reviewUserId ? (
              (() => {
                const selectedMaba = mabaList.find((m) => m.user.id_user === reviewUserId);
                if (!selectedMaba) return null;
                const { user, mhs, berkas } = selectedMaba;

                return (
                  <div className="bg-white border border-indigo-250 rounded-3xl p-6 shadow-sm space-y-5" id="review-desk font-sans">
                    <div className="border-b border-slate-100 pb-3">
                      <span className="text-[10px] bg-indigo-650 text-white font-mono font-bold px-2 py-0.5 rounded-full">REVIEW DESK</span>
                      <h4 className="font-bold text-slate-900 text-sm mt-2">{mhs?.nama}</h4>
                      <p className="text-[11px] text-slate-500">{user.email}</p>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      {/* Document Simulation display */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">PRATINJAU DOKUMEN:</label>
                        
                        <div className="bg-slate-50 border border-slate-250 rounded-xl p-3 space-y-2 text-slate-600 font-medium font-mono text-[10px]">
                          <button
                            type="button"
                            onClick={() => setPreviewFile({
                              name: berkas?.file_ijazah_name || 'Ijazah.pdf',
                              type: 'ijazah',
                              studentName: mhs?.nama || 'Calon Mahasiswa'
                            })}
                            className="w-full flex justify-between items-center bg-white hover:bg-indigo-50/60 p-2 border border-slate-200 hover:border-indigo-300 rounded-lg transition-all cursor-pointer text-left group/btn"
                            title="Klik untuk melihat pratinjau Ijazah"
                          >
                            <span className="truncate max-w-[150px] underline decoration-dotted group-hover/btn:text-indigo-850">{berkas?.file_ijazah_name}</span>
                            <span className="text-indigo-600 font-sans font-bold flex items-center gap-1 shrink-0 bg-indigo-50 px-1.5 py-0.5 rounded text-[9px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-550" /> IJAZAH
                            </span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setPreviewFile({
                              name: berkas?.file_transkrip_name || 'Transkrip.pdf',
                              type: 'transkrip',
                              studentName: mhs?.nama || 'Calon Mahasiswa'
                            })}
                            className="w-full flex justify-between items-center bg-white hover:bg-emerald-50/60 p-2 border border-slate-200 hover:border-emerald-300 rounded-lg transition-all cursor-pointer text-left group/btn"
                            title="Klik untuk melihat pratinjau Transkrip"
                          >
                            <span className="truncate max-w-[150px] underline decoration-dotted group-hover/btn:text-emerald-850">{berkas?.file_transkrip_name}</span>
                            <span className="text-emerald-650 font-sans font-bold flex items-center gap-1 shrink-0 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-550" /> TRANSKRIP
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Automated NIM Notice */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] leading-relaxed text-slate-600">
                        <p className="font-bold text-slate-800">Sistem Otomasi NIM:</p>
                        <p className="mt-0.5">Jika disetujui, NIM pendaftar akan diterbitkan otomatis:</p>
                        <strong className="text-indigo-650 font-mono block mt-1 text-sm bg-white border border-slate-200 px-2 py-0.5 rounded w-max">
                          {proposedNIM}
                        </strong>
                      </div>

                      {/* Approval/Rejection buttons */}
                      {!showRejectInput ? (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button
                            onClick={() => setShowRejectInput(true)}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            <span>Tolak Berkas</span>
                          </button>
                          
                          <button
                            onClick={() => handleApproveClick(user.id_user)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1 shadow-sm shadow-emerald-600/10"
                          >
                            <Check className="w-4 h-4" />
                            <span>Setujui Berkas</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3.5 pt-2 border-t border-slate-150">
                          <div>
                            <label className="block text-xs font-bold text-rose-700 mb-1">
                              ALASAN PENOLAKAN DOKUMEN:
                            </label>
                            <textarea
                              value={rejectionCatatan}
                              onChange={(e) => setRejectionCatatan(e.target.value)}
                              placeholder="Contoh: Berkas ijazah tidak terbaca dengan jelas, silakan scan ulang dokumen asli."
                              className="w-full text-xs p-2.5 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-100 bg-white min-h-[80px]"
                              required
                            />
                          </div>
                          
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setShowRejectInput(false)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => handleRejectClick(user.id_user)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm"
                            >
                              Kirim Penolakan
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Tinjauan Berkas Belum Dibuka</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Silakan klik tombol "Tinjau Berkas" pada salah satu pendaftar di sebelah kiri untuk meninjau ijazah dan memberikan keputusan.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KELOLA KURIKULUM & JADWAL */}
      {activeTab === 'schedules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="admin-schedules-view">
          {/* Create course schedule form */}
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-indigo-600" />
              <span>Tambah Jadwal Kuliah Baru</span>
            </h3>
            
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">MATA KULIAH</label>
                <select
                  value={selectedKodeMk}
                  onChange={(e) => setSelectedKodeMk(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                >
                  {mataKuliahList.map((mk) => (
                    <option key={mk.kode_mk} value={mk.kode_mk}>
                      {mk.kode_mk} - {mk.nama_mk} ({mk.sks} SKS)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">HARI</label>
                  <select
                    value={hari}
                    onChange={(e) => setHari(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">RUANGAN</label>
                  <input
                    type="text"
                    value={ruangan}
                    onChange={(e) => setRuangan(e.target.value)}
                    placeholder="Contoh: Lab Komp 4"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">JAM MULAI</label>
                  <input
                    type="time"
                    value={jamMulai}
                    onChange={(e) => setJamMulai(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">JAM SELESAI</label>
                  <input
                    type="time"
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-2 text-[10px] leading-relaxed text-slate-500">
                <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>Sistem secara otomatis menolak penyimpanan jadwal apabila ruangan tersebut sudah terisi pada waktu yang sama.</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan Jadwal Kuliah</span>
              </button>
            </form>
          </div>

          {/* Master timetable list */}
          <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-650" />
              <span>Timetable Master Jadwal Kuliah Terdaftar</span>
            </h3>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3 pl-4">Kode / MK</th>
                    <th className="p-3">SKS</th>
                    <th className="p-3">Waktu Pelaksanaan</th>
                    <th className="p-3">Ruangan</th>
                    <th className="p-3 text-right pr-4">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {jadwalKuliahList.map((j) => {
                    const mk = mataKuliahList.find((m) => m.kode_mk === j.kode_mk)!;
                    return (
                      <tr key={j.id_jadwal} className="hover:bg-slate-50/50">
                        <td className="p-3 pl-4">
                          <span className="font-mono font-bold text-indigo-650 block">{j.kode_mk}</span>
                          <span className="font-semibold text-slate-900 text-[11px]">{mk.nama_mk}</span>
                        </td>
                        <td className="p-3 text-slate-600 font-semibold">{mk.sks} SKS</td>
                        <td className="p-3 text-slate-700">
                          <span className="inline-flex items-center gap-1 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {j.hari}, {j.jam_mulai} - {j.jam_selesai}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{j.ruangan}</td>
                        <td className="p-3 text-right pr-4">
                          {deletingId === j.id_jadwal ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  onDeleteSchedule(j.id_jadwal);
                                  setDeletingId(null);
                                }}
                                className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer transition-all duration-150 shadow-sm"
                              >
                                Yakin
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold cursor-pointer transition-all duration-150"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setDeletingId(j.id_jadwal);
                              }}
                              className="p-1.5 hover:bg-rose-50 rounded text-rose-500 border border-transparent hover:border-rose-100 transition-all duration-150 cursor-pointer"
                              title="Hapus Jadwal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DAFTAR MAHASISWA AKTIF */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="admin-students-view">
          {/* LEFT COLUMN: ROSTER LIST */}
          <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-650" />
                <span>Roster Mahasiswa Aktif</span>
              </h3>
              
              {/* Search filter for active roster */}
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={mhsSearchQuery}
                  onChange={(e) => setMhsSearchQuery(e.target.value)}
                  placeholder="Cari NIM atau nama..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                />
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-3 pl-4">NIM</th>
                      <th className="p-3">Nama Mahasiswa</th>
                      <th className="p-3">SKS Lulus</th>
                      <th className="p-3">IPK</th>
                      <th className="p-3 text-right pr-4">Aksi Evaluasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {activeStudentsList.length > 0 ? (
                      activeStudentsList.map((mhs) => {
                        const hasKrs = krsList.some((k) => k.nim === mhs.nim && k.semester_aktif === 3);
                        const isSelected = selectedStudentNim === mhs.nim;

                        return (
                          <tr key={mhs.nim} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                            <td className="p-3 pl-4 font-mono font-bold text-indigo-650">{mhs.nim}</td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-900 block">{mhs.nama}</span>
                              <span className="text-[9px] text-slate-400 font-medium block">
                                {mhs.tempat_lahir}, {new Date(mhs.tanggal_lahir).toLocaleDateString('id-ID')}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 font-bold">{mhs.completedSKS} SKS</td>
                            <td className="p-3 font-mono font-bold text-slate-800">{mhs.ipk.toFixed(2)}</td>
                            <td className="p-3 text-right pr-4">
                              <button
                                onClick={() => setSelectedStudentNim(mhs.nim)}
                                className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-all border flex items-center gap-1 ml-auto ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : hasKrs
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/50'
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {hasKrs ? (
                                  <>
                                    <CheckSquare className="w-3.5 h-3.5" />
                                    <span>Evaluasi KRS</span>
                                  </>
                                ) : (
                                  <span>Lihat Profil</span>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          Tidak ada mahasiswa aktif yang terdaftar atau cocok dengan pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: EVALUATION & KRS GRADING PANEL */}
          <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-indigo-650" />
              <span>Evaluasi & Penilaian KRS Mahasiswa</span>
            </h3>

            {selectedStudentNim ? (() => {
              const mhs = activeStudentsList.find((m) => m.nim === selectedStudentNim);
              if (!mhs) return null;

              const mhsKrs = krsList.find((k) => k.nim === mhs.nim && k.semester_aktif === currentSemester);
              
              // Get details of chosen courses
              const krsDetails = mhsKrs ? detailKrsList.filter((d) => d.id_krs === mhsKrs.id_krs) : [];
              const enrolledCourses = krsDetails.map((d) => {
                const schedule = jadwalKuliahList.find((j) => j.id_jadwal === d.id_jadwal);
                const mk = schedule ? mataKuliahList.find((m) => m.kode_mk === schedule.kode_mk) : null;
                return { schedule, mk };
              }).filter((item) => item.schedule && item.mk) as { schedule: JadwalKuliah; mk: MataKuliah }[];

              return (
                <div className="space-y-4">
                  {/* Student Profile Summary Card */}
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 font-extrabold rounded-full flex items-center justify-center text-sm">
                      {mhs.nama.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs uppercase">{mhs.nama}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">NIM. {mhs.nim} • {mhs.tempat_lahir}</p>
                    </div>
                  </div>

                  {/* KRS check */}
                  {mhsKrs ? (
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl">
                        <span className="text-[10px] font-bold text-indigo-850">KRS SEMESTER {currentSemester} (TERKUNCI)</span>
                        <span className="text-[9px] font-mono font-bold bg-white text-indigo-700 border border-indigo-150 px-2 py-0.5 rounded">
                          {enrolledCourses.reduce((sum, item) => sum + item.mk.sks, 0)} SKS Dipilih
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 font-medium">
                        Masukkan nilai angka (0 - 100) untuk mata kuliah yang telah dipilih oleh mahasiswa berikut:
                      </p>

                      <div className="space-y-3 overflow-y-auto max-h-[48vh] pr-1">
                        {enrolledCourses.map((item) => {
                          const existingGrade = nilaiList.find(
                            (n) => n.nim === mhs.nim && n.kode_mk === item.mk.kode_mk
                          );
                          const inputState = scoringInputs[item.mk.kode_mk] || {
                            numeric: existingGrade ? existingGrade.nilai_angka.toString() : '',
                            letter: existingGrade ? existingGrade.nilai_huruf : '',
                          };

                          return (
                            <div
                              key={item.mk.kode_mk}
                              className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-sm hover:border-slate-300 transition-all space-y-3"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] font-bold text-indigo-650 font-mono block">
                                    {item.mk.kode_mk}
                                  </span>
                                  <h5 className="font-bold text-slate-850 text-xs">{item.mk.nama_mk}</h5>
                                  <span className="text-[9px] text-slate-400 font-semibold">
                                    {item.mk.sks} SKS • Semester {item.mk.semester}
                                  </span>
                                </div>

                                {existingGrade && (
                                  <div className="bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[9px] font-bold px-2 py-1 rounded-xl flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span>Nilai Terbit: {existingGrade.nilai_angka} ({existingGrade.nilai_huruf})</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                                <div className="flex-1">
                                  <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Nilai Angka</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={inputState.numeric}
                                    onChange={(e) => handleScoreChange(item.mk.kode_mk, e.target.value)}
                                    placeholder="Contoh: 85"
                                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 font-mono"
                                  />
                                </div>

                                <div className="w-20">
                                  <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Indeks</label>
                                  <div className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-700 font-mono">
                                    {inputState.letter || '-'}
                                  </div>
                                </div>

                                <div className="self-end">
                                  <button
                                    onClick={() => handleSaveCourseGrade(mhs.nim, item.mk.kode_mk)}
                                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm shadow-indigo-600/10 cursor-pointer"
                                    title="Simpan Nilai"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Simpan</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50/70 border border-dashed border-amber-250 p-6 rounded-2xl text-center space-y-1.5">
                      <AlertCircle className="w-7 h-7 text-amber-600 mx-auto" />
                      <p className="text-xs font-bold text-amber-900">Belum Ada Pengajuan KRS</p>
                      <p className="text-[10px] text-amber-700 leading-relaxed">
                        Mahasiswa ini belum memilih atau menyimpan mata kuliah untuk semester aktif (Semester {currentSemester}). Penilaian baru dapat dilakukan setelah mahasiswa mengajukan KRS.
                      </p>
                    </div>
                  )}
                </div>
              );
            })() : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                <ClipboardList className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Pilih Mahasiswa Aktif</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Silakan klik tombol "Evaluasi KRS" pada baris mahasiswa di sebelah kiri untuk melihat daftar KRS mereka dan memberikan penilaian mata kuliah.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-fadeIn" id="doc-preview-modal">
          <div className="relative bg-white border border-slate-200 shadow-2xl rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70 rounded-t-3xl shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{previewFile.name}</h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Pratinjau Dokumen Calon Mahasiswa: <strong className="text-slate-700 font-semibold">{previewFile.studentName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                title="Tutup Pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Document Renderer */}
            <div className="p-6 bg-slate-100 overflow-y-auto flex justify-center items-center min-h-[400px]">
              {previewFile.type === 'ijazah' ? (
                /* OFFICIAL INDONESIAN DIPLOMA MOCK */
                <div className="w-full max-w-lg bg-[#fdfbf7] border-[10px] border-double border-amber-800/15 rounded-2xl p-8 shadow-md relative select-none font-serif text-slate-800 leading-relaxed text-xs">
                  {/* Decorative Vintage border */}
                  <div className="absolute inset-2 border border-amber-800/5 pointer-events-none rounded-lg"></div>
                  
                  {/* National Emblem emblem / Header */}
                  <div className="text-center space-y-1 mb-6 relative">
                    <div className="text-3xl filter saturate-50 opacity-90">🦅</div>
                    <h2 className="text-[10px] font-sans font-black tracking-widest text-slate-500 uppercase">Republik Indonesia</h2>
                    <h3 className="text-[9px] font-sans font-bold text-amber-900/80 uppercase tracking-wider">Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi</h3>
                  </div>

                  {/* Document Title */}
                  <div className="text-center space-y-1.5 mb-6">
                    <h1 className="text-xl font-bold tracking-wider text-amber-950 uppercase border-b border-amber-900/20 pb-1.5 inline-block px-8">I j a z a h</h1>
                    <p className="text-[9px] font-sans font-bold text-slate-500 uppercase tracking-widest">Sekolah Menengah Atas (SMA)</p>
                  </div>

                  {/* Main Declaration */}
                  <div className="space-y-4 text-[11px] leading-relaxed text-slate-700">
                    <p className="indent-8 text-justify">
                      Yang bertanda tangan di bawah ini, Kepala Sekolah Menengah Atas Swasta Karsa Indonesia menerangkan bahwa lulusan berikut:
                    </p>

                    <div className="grid grid-cols-12 gap-y-2 pl-4">
                      <div className="col-span-4 font-sans font-bold text-slate-500 text-[10px] uppercase">Nama Lengkap</div>
                      <div className="col-span-8 font-bold text-slate-900 border-b border-dotted border-slate-300 pb-0.5 text-xs font-serif uppercase tracking-wide">
                        {previewFile.studentName}
                      </div>

                      <div className="col-span-4 font-sans font-bold text-slate-500 text-[10px] uppercase">Tempat, Tgl Lahir</div>
                      <div className="col-span-8 border-b border-dotted border-slate-300 pb-0.5 text-slate-900 font-sans">
                        Bandung, 18 April 2007
                      </div>

                      <div className="col-span-4 font-sans font-bold text-slate-500 text-[10px] uppercase">Nama Orang Tua</div>
                      <div className="col-span-8 border-b border-dotted border-slate-300 pb-0.5 text-slate-900 font-sans">
                        Sudrajat Wibowo
                      </div>

                      <div className="col-span-4 font-sans font-bold text-slate-500 text-[10px] uppercase">Nomor Induk Siswa</div>
                      <div className="col-span-8 border-b border-dotted border-slate-300 pb-0.5 font-mono text-slate-900 font-bold">
                        NISN. 0078921355
                      </div>

                      <div className="col-span-4 font-sans font-bold text-slate-500 text-[10px] uppercase">Satuan Pendidikan</div>
                      <div className="col-span-8 border-b border-dotted border-slate-300 pb-0.5 text-slate-900 font-sans">
                        SMAS Karsa Indonesia (Terakreditasi A)
                      </div>
                    </div>

                    <p className="indent-8 text-justify">
                      telah memenuhi seluruh kriteria kelulusan dan dinyatakan <strong className="text-emerald-700 uppercase tracking-widest font-sans font-extrabold text-[12px]">L U L U S</strong> dari satuan pendidikan Sekolah Menengah Atas berdasarkan peraturan perundang-undangan yang berlaku.
                    </p>
                  </div>

                  {/* Signatures & Seal Box */}
                  <div className="grid grid-cols-12 gap-4 mt-8 pt-4 border-t border-slate-200/50">
                    {/* Photo Block 3x4 */}
                    <div className="col-span-4 flex justify-center items-center">
                      <div className="w-20 h-24 bg-slate-200 border-2 border-dashed border-slate-300 rounded-lg flex flex-col justify-center items-center text-center p-2 relative overflow-hidden">
                        <span className="text-[8px] font-sans font-bold text-slate-400 uppercase leading-tight">Foto 3 x 4<br />Calon Maba</span>
                        {/* Realistic Mock Cap/Stamp overlay */}
                        <div className="absolute -bottom-1 -right-1 w-14 h-14 rounded-full border-4 border-double border-indigo-600/30 text-indigo-700/40 text-[6px] font-sans font-black flex items-center justify-center rotate-12 bg-white/10 backdrop-blur-[0.5px]">
                          KARSA INDONESIA
                        </div>
                      </div>
                    </div>

                    {/* Left Thumb Print block */}
                    <div className="col-span-3 flex flex-col justify-end items-center">
                      <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-300 relative shadow-inner">
                        <span className="text-[6px] font-sans text-slate-400 font-bold uppercase text-center leading-none">Cap Ibu Jari<br/>Kiri</span>
                        {/* Mock fingerprint lines */}
                        <div className="absolute inset-1 rounded-full opacity-10 bg-[radial-gradient(circle,rgba(0,0,0,1)_1px,transparent_1px)] bg-[size:4px_4px]"></div>
                      </div>
                    </div>

                    {/* Signature block */}
                    <div className="col-span-5 text-right font-sans text-[10px] flex flex-col justify-between">
                      <div>
                        <p className="text-slate-500 font-medium text-[9px]">Bandung, 12 Juni 2024</p>
                        <p className="font-bold text-slate-800 text-[9px] mt-0.5">Kepala Sekolah,</p>
                      </div>
                      
                      {/* Fake Signature graphic */}
                      <div className="my-1.5 h-7 flex justify-end items-center relative pr-4">
                        <span className="text-indigo-600 font-serif italic text-xs select-none opacity-60 font-black -rotate-6">Drs. H. Hermawan</span>
                        {/* Blue Stamp Mockup */}
                        <div className="absolute right-2 top-[-8px] w-12 h-12 rounded-full border-2 border-indigo-500/25 flex items-center justify-center text-indigo-500/40 font-black text-[5px] rotate-12 leading-none text-center bg-transparent">
                          SEKOLAH<br/>SMAS<br/>KARSA
                        </div>
                      </div>

                      <div>
                        <p className="font-bold text-slate-900 border-b border-slate-400 inline-block">Drs. H. Hermawan, M.Pd.</p>
                        <p className="text-[8px] text-slate-400 font-mono mt-0.5">NIP. 196811051994031002</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* OFFICIAL HIGH SCHOOL ACADEMIC TRANSCRIPT MOCK */
                <div className="w-full max-w-lg bg-white border border-slate-300 rounded-2xl p-6 shadow-md select-none font-sans text-slate-800 text-xs">
                  {/* Header of school */}
                  <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                    <h2 className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Kementerian Pendidikan Dasar Dan Menengah</h2>
                    <h1 className="text-sm font-extrabold text-slate-900 uppercase">SMAS Karsa Indonesia</h1>
                    <p className="text-[9px] text-slate-400 font-medium">Alamat: Jl. Raya Pendidikan No. 45, Bandung • Telp (022) 789123</p>
                  </div>

                  {/* Title of document */}
                  <div className="text-center space-y-1 mb-4">
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Daftar Nilai Surat Keterangan Lulus</h3>
                    <p className="text-[9px] text-slate-500 font-mono">Nomor Dokumen: SKL/2024/09/241</p>
                  </div>

                  {/* Student details block */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] mb-4">
                    <div className="space-y-1">
                      <p><span className="text-slate-400 font-medium">NAMA LENGKAP:</span> <strong className="text-slate-800 font-bold block text-[11px] uppercase">{previewFile.studentName}</strong></p>
                      <p><span className="text-slate-400 font-medium">NISN / NIS:</span> <span className="font-mono text-slate-700 block">0078921355 / 24098</span></p>
                    </div>
                    <div className="space-y-1">
                      <p><span className="text-slate-400 font-medium">PROGRAM KEAHLIAN:</span> <strong className="text-slate-800 block">MIPA (Matematika & Ilmu Pengetahuan Alam)</strong></p>
                      <p><span className="text-slate-400 font-medium">TAHUN AJARAN:</span> <span className="text-slate-700 block">2023 / 2024</span></p>
                    </div>
                  </div>

                  {/* Grades Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-2 pl-3">Mata Pelajaran (Kurikulum Merdeka)</th>
                          <th className="p-2 text-center w-20">Nilai Pengetahuan</th>
                          <th className="p-2 text-center w-20">Nilai Keterampilan</th>
                          <th className="p-2 text-center w-20">Grade Kelulusan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-[10px] text-slate-700">
                        <tr>
                          <td className="p-2 pl-3 font-semibold text-slate-800">1. Pendidikan Agama & Budi Pekerti</td>
                          <td className="p-2 text-center font-mono font-bold">92</td>
                          <td className="p-2 text-center font-mono">90</td>
                          <td className="p-2 text-center font-bold text-emerald-600">A</td>
                        </tr>
                        <tr>
                          <td className="p-2 pl-3 font-semibold text-slate-800">2. Pendidikan Pancasila & Kewarganegaraan</td>
                          <td className="p-2 text-center font-mono font-bold">88</td>
                          <td className="p-2 text-center font-mono">89</td>
                          <td className="p-2 text-center font-bold text-emerald-600">A</td>
                        </tr>
                        <tr>
                          <td className="p-2 pl-3 font-semibold text-slate-800">3. Bahasa Indonesia (Wajib)</td>
                          <td className="p-2 text-center font-mono font-bold">94</td>
                          <td className="p-2 text-center font-mono">92</td>
                          <td className="p-2 text-center font-bold text-emerald-600">A</td>
                        </tr>
                        <tr>
                          <td className="p-2 pl-3 font-semibold text-slate-800">4. Bahasa Inggris (Wajib)</td>
                          <td className="p-2 text-center font-mono font-bold">91</td>
                          <td className="p-2 text-center font-mono">88</td>
                          <td className="p-2 text-center font-bold text-emerald-600">A</td>
                        </tr>
                        <tr>
                          <td className="p-2 pl-3 font-semibold text-slate-800">5. Matematika (Wajib)</td>
                          <td className="p-2 text-center font-mono font-bold">86</td>
                          <td className="p-2 text-center font-mono">85</td>
                          <td className="p-2 text-center font-bold text-amber-600">B</td>
                        </tr>
                        <tr>
                          <td className="p-2 pl-3 font-semibold text-slate-800">6. Sejarah Indonesia</td>
                          <td className="p-2 text-center font-mono font-bold">90</td>
                          <td className="p-2 text-center font-mono">91</td>
                          <td className="p-2 text-center font-bold text-emerald-600">A</td>
                        </tr>
                        <tr>
                          <td className="p-2 pl-3 font-semibold text-slate-800">7. Fisika (Peminatan MIPA)</td>
                          <td className="p-2 text-center font-mono font-bold">87</td>
                          <td className="p-2 text-center font-mono">86</td>
                          <td className="p-2 text-center font-bold text-amber-600">B</td>
                        </tr>
                        <tr>
                          <td className="p-2 pl-3 font-semibold text-slate-800">8. Kimia (Peminatan MIPA)</td>
                          <td className="p-2 text-center font-mono font-bold">89</td>
                          <td className="p-2 text-center font-mono">88</td>
                          <td className="p-2 text-center font-bold text-emerald-600">A</td>
                        </tr>
                        <tr>
                          <td className="p-2 pl-3 font-semibold text-slate-800">9. Biologi (Peminatan MIPA)</td>
                          <td className="p-2 text-center font-mono font-bold">93</td>
                          <td className="p-2 text-center font-mono">91</td>
                          <td className="p-2 text-center font-bold text-emerald-600">A</td>
                        </tr>
                        <tr>
                          <td className="p-2 pl-3 font-semibold text-slate-800">10. Seni Budaya / Prakarya</td>
                          <td className="p-2 text-center font-mono font-bold">92</td>
                          <td className="p-2 text-center font-mono">94</td>
                          <td className="p-2 text-center font-bold text-emerald-600">A</td>
                        </tr>
                        {/* Summary average row */}
                        <tr className="bg-slate-50 font-bold border-t border-slate-200">
                          <td className="p-2.5 pl-3 text-slate-900">Rata-Rata Nilai Kelulusan</td>
                          <td className="p-2.5 text-center font-mono text-indigo-700 text-[11px] font-black" colSpan={2}>90.2 / 100</td>
                          <td className="p-2.5 text-center text-indigo-750 text-[9px] uppercase tracking-wide">Sangat Baik</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Verification stamps */}
                  <div className="flex justify-between items-center text-[9px] text-slate-500 pt-2 border-t border-slate-100">
                    <div>
                      <p>Catatan:</p>
                      <p className="font-mono">Dokumen tervalidasi secara digital</p>
                    </div>
                    <div className="text-right">
                      <p>Bandung, 12 Juni 2024</p>
                      <p className="font-bold text-slate-850">Kepala Sekolah SMAS Karsa</p>
                      <p className="text-[8px] text-slate-400 font-serif mt-4">Drs. H. Hermawan, M.Pd.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 rounded-b-3xl flex justify-end shrink-0">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-5 py-2 bg-slate-950 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
