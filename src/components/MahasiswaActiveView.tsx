import React, { useState, useMemo } from 'react';
import { User, Mahasiswa, MataKuliah, JadwalKuliah, Nilai, KRS, DetailKRS } from '../types';
import { calculateGradeWeight } from '../data';
import {
  User as UserIcon,
  BookOpen,
  FileSpreadsheet,
  Printer,
  Search,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Award,
  BookMarked,
  Info,
  ChevronRight,
  Download,
} from 'lucide-react';

interface MahasiswaActiveViewProps {
  currentUser: User;
  mahasiswa: Mahasiswa;
  mataKuliahList: MataKuliah[];
  jadwalKuliahList: JadwalKuliah[];
  nilaiList: Nilai[];
  krsList: KRS[];
  detailKrsList: DetailKRS[];
  onSaveKRS: (selectedJadwalIds: string[]) => void;
  currentSemester: number;
}

export default function MahasiswaActiveView({
  currentUser,
  mahasiswa,
  mataKuliahList,
  jadwalKuliahList,
  nilaiList,
  krsList,
  detailKrsList,
  onSaveKRS,
  currentSemester,
}: MahasiswaActiveViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'krs' | 'khs'>('summary');
  
  // Search & filter states for KRS Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<string>('all');

  // Find if this student already has a saved KRS for the current active semester
  const savedKRS = useMemo(() => {
    return krsList.find((k) => k.nim === mahasiswa.nim && k.semester_aktif === currentSemester);
  }, [krsList, mahasiswa.nim, currentSemester]);

  // If a KRS already exists, pre-load the selected schedules from database
  const savedJadwalIds = useMemo(() => {
    if (!savedKRS) return [];
    return detailKrsList
      .filter((d) => d.id_krs === savedKRS.id_krs)
      .map((d) => d.id_jadwal);
  }, [savedKRS, detailKrsList]);

  // Selected schedules state (in cart during editing)
  const [selectedJadwalIds, setSelectedJadwalIds] = useState<string[]>(savedJadwalIds);
  const [isEditingKrs, setIsEditingKrs] = useState(!savedKRS);

  // Print Transcript Modal state
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Sync state if saved KRS changes
  React.useEffect(() => {
    setSelectedJadwalIds(savedJadwalIds);
    setIsEditingKrs(!savedKRS);
  }, [savedJadwalIds, savedKRS]);

  // Calculate Cumulative GPA (IPK) and SKS based on past grades (nilaiList)
  const stats = useMemo(() => {
    const studentGrades = nilaiList.filter((n) => n.nim === mahasiswa.nim);
    let totalSKSCompleted = 0;
    let totalGradePoints = 0;

    studentGrades.forEach((g) => {
      const mk = mataKuliahList.find((m) => m.kode_mk === g.kode_mk);
      if (mk) {
        const weight = calculateGradeWeight(g.nilai_huruf);
        totalSKSCompleted += mk.sks;
        totalGradePoints += weight * mk.sks;
      }
    });

    const ipk = totalSKSCompleted > 0 ? Number((totalGradePoints / totalSKSCompleted).toFixed(2)) : 0.0;

    // SKS limit calculation based on GPA (IPK)
    // GPA >= 3.00: 24 SKS
    // 2.00 <= GPA < 3.00: 21 SKS
    // GPA < 2.00: 18 SKS
    let sksLimit = 20; // default for new students or 0 GPA
    if (ipk >= 3.0) sksLimit = 24;
    else if (ipk >= 2.0) sksLimit = 21;
    else if (ipk > 0) sksLimit = 18;

    return {
      ipk,
      totalSKSCompleted,
      totalGradePoints,
      sksLimit,
      studentGrades,
    };
  }, [nilaiList, mahasiswa.nim, mataKuliahList]);

  // Compute available semesters dynamically based on grades, active KRS, and current system semester
  const availableSemesters = useMemo(() => {
    const sems = new Set<number>();
    sems.add(1);
    sems.add(2);
    sems.add(currentSemester);
    stats.studentGrades.forEach((g) => {
      const mk = mataKuliahList.find((m) => m.kode_mk === g.kode_mk);
      if (mk) sems.add(mk.semester);
    });
    krsList.filter((k) => k.nim === mahasiswa.nim).forEach((k) => {
      sems.add(k.semester_aktif);
    });
    return Array.from(sems).sort((a, b) => a - b);
  }, [currentSemester, stats.studentGrades, mataKuliahList, krsList, mahasiswa.nim]);

  // Gather current selected courses details
  const selectedSchedulesDetails = useMemo(() => {
    return selectedJadwalIds
      .map((id) => {
        const schedule = jadwalKuliahList.find((j) => j.id_jadwal === id);
        const mk = schedule ? mataKuliahList.find((m) => m.kode_mk === schedule.kode_mk) : null;
        return { schedule, mk };
      })
      .filter((item) => item.schedule && item.mk) as { schedule: JadwalKuliah; mk: MataKuliah }[];
  }, [selectedJadwalIds, jadwalKuliahList, mataKuliahList]);

  // Compute current SKS selected in editing
  const currentSelectedSKS = useMemo(() => {
    return selectedSchedulesDetails.reduce((sum, item) => sum + item.mk.sks, 0);
  }, [selectedSchedulesDetails]);

  // Filter available schedules for selection
  const filteredSchedules = useMemo(() => {
    return jadwalKuliahList.filter((j) => {
      const mk = mataKuliahList.find((m) => m.kode_mk === j.kode_mk);
      if (!mk) return false;

      // Filter by Search Query (Course Name or Code)
      const matchesSearch =
        mk.nama_mk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mk.kode_mk.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by Semester
      const matchesSemester =
        semesterFilter === 'all' || mk.semester.toString() === semesterFilter;

      return matchesSearch && matchesSemester;
    });
  }, [jadwalKuliahList, mataKuliahList, searchQuery, semesterFilter]);

  // Handle choosing a schedule
  const handleSelectSchedule = (jadwalId: string) => {
    const scheduleToAdd = jadwalKuliahList.find((j) => j.id_jadwal === jadwalId);
    const mkToAdd = scheduleToAdd ? mataKuliahList.find((m) => m.kode_mk === scheduleToAdd.kode_mk) : null;
    
    if (!scheduleToAdd || !mkToAdd) return;

    // 1. Check if course already added (cannot take multiple schedules for the same course)
    const alreadyHasCourse = selectedSchedulesDetails.some(
      (item) => item.mk.kode_mk === mkToAdd.kode_mk
    );
    if (alreadyHasCourse) {
      alert(`Mata kuliah ${mkToAdd.nama_mk} sudah dipilih!`);
      return;
    }

    // 2. Check SKS limit
    if (currentSelectedSKS + mkToAdd.sks > stats.sksLimit) {
      alert(`Batas SKS Anda (${stats.sksLimit} SKS) terlampaui!`);
      return;
    }

    // 3. Check Schedule clash (same day and overlapping times)
    const hasClash = selectedSchedulesDetails.some((item) => {
      const existing = item.schedule;
      if (existing.hari !== scheduleToAdd.hari) return false;

      // Simple hour check
      const [exStartH, exStartM] = existing.jam_mulai.split(':').map(Number);
      const [exEndH, exEndM] = existing.jam_selesai.split(':').map(Number);
      const [newStartH, newStartM] = scheduleToAdd.jam_mulai.split(':').map(Number);
      const [newEndH, newEndM] = scheduleToAdd.jam_selesai.split(':').map(Number);

      const exStart = exStartH * 60 + exStartM;
      const exEnd = exEndH * 60 + exEndM;
      const newStart = newStartH * 60 + newStartM;
      const newEnd = newEndH * 60 + newEndM;

      // Overlap condition: start1 < end2 AND start2 < end1
      return newStart < exEnd && exStart < newEnd;
    });

    if (hasClash) {
      alert(`Jadwal bentrok dengan mata kuliah yang sudah dipilih pada hari ${scheduleToAdd.hari}!`);
      return;
    }

    setSelectedJadwalIds((prev) => [...prev, jadwalId]);
  };

  // Remove a selected schedule
  const handleRemoveSchedule = (jadwalId: string) => {
    setSelectedJadwalIds((prev) => prev.filter((id) => id !== jadwalId));
  };

  // Save the KRS selection
  const handleSaveKrsClick = () => {
    if (selectedJadwalIds.length === 0) {
      alert('Pilih minimal satu mata kuliah untuk KRS!');
      return;
    }
    onSaveKRS(selectedJadwalIds);
    setIsEditingKrs(false);
  };

  return (
    <div className="space-y-6" id="mahasiswa-active-view">
      {/* Mini Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6" id="mhs-header-profile">
        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-bold text-xl border border-indigo-200 shadow-inner">
            {mahasiswa.nama.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{mahasiswa.nama}</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              NIM: {mahasiswa.nim} | Program Studi Teknik Informatika
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {mahasiswa.status}
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Semester {currentSemester}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Nav Tabs */}
        <div className="bg-slate-50 border border-slate-200 p-1 rounded-xl flex gap-1 self-stretch md:self-auto">
          <button
            onClick={() => setActiveSubTab('summary')}
            className={`flex-1 md:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'summary'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            id="tab-mhs-summary"
          >
            Ringkasan
          </button>
          <button
            onClick={() => setActiveSubTab('krs')}
            className={`flex-1 md:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'krs'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            id="tab-mhs-krs"
          >
            Rencana Studi (KRS)
          </button>
          <button
            onClick={() => setActiveSubTab('khs')}
            className={`flex-1 md:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'khs'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            id="tab-mhs-khs"
          >
            KHS & Transkrip
          </button>
        </div>
      </div>

      {/* SUBTAB 1: SUMMARY / DASHBOARD */}
      {activeSubTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="mhs-summary-view">
          {/* Key Academic KPI Grid */}
          <div className="md:col-span-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* GPA Card */}
              <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center gap-2 text-center relative overflow-hidden group hover:border-indigo-200 hover:shadow-md transition-all duration-300">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IPK Kumulatif</span>
                <span className="text-5xl font-black text-slate-900 leading-none">{stats.ipk.toFixed(2)}</span>
                <div className="px-3 py-1 bg-green-100/80 text-green-700 rounded-full text-[10px] font-extrabold uppercase tracking-tight">
                  ↑ Cum Laude
                </div>
              </div>

              {/* SKS Completed Card */}
              <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center gap-2 text-center relative overflow-hidden group hover:border-indigo-200 hover:shadow-md transition-all duration-300">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-50/50 rounded-full blur-2xl pointer-events-none"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total SKS</span>
                <span className="text-5xl font-black text-slate-900 leading-none tracking-tighter">{stats.totalSKSCompleted}</span>
                <span className="text-[10px] text-slate-500 font-medium">Target: 144 SKS</span>
              </div>

              {/* SKS Limit Card */}
              <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center gap-2 text-center relative overflow-hidden group hover:border-indigo-200 hover:shadow-md transition-all duration-300">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-50/50 rounded-full blur-2xl pointer-events-none"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jatah SKS KRS</span>
                <span className="text-5xl font-black text-slate-900 leading-none tracking-tighter">{stats.sksLimit}</span>
                <span className="text-[10px] text-slate-500 font-medium">Batas Maksimal</span>
              </div>
            </div>

            {/* Welcome Card (Hero) - Quick Informative Banner */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[200px] shadow-lg shadow-indigo-900/10 hover:shadow-indigo-900/20 transition-all duration-300">
              <div className="relative z-10">
                <h3 className="text-2xl font-black tracking-tight mb-2">Selamat Datang Kembali!</h3>
                <p className="text-indigo-100 text-xs mt-2 max-w-lg leading-relaxed font-medium">
                  Sistem verifikasi berkas pendaftaran Anda telah disetujui. Silakan selesaikan pengisian Rencana Studi (KRS) sebelum batas waktu periode aktif berakhir.
                </p>
              </div>
              <div className="flex gap-3 relative z-10 mt-6">
                {savedKRS ? (
                  <div className="px-5 py-3 bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-xl font-bold text-xs flex items-center gap-2">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                    <span>KRS Semester {currentSemester} Berhasil Disimpan & Kunci</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveSubTab('krs')}
                    className="px-6 py-3 bg-white hover:bg-slate-50 text-indigo-600 rounded-xl font-bold text-xs shadow-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Isi KRS Sekarang</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setActiveSubTab('khs')}
                  className="px-5 py-3 bg-indigo-500/30 border border-indigo-400/30 backdrop-blur-md rounded-xl font-bold text-xs hover:bg-indigo-500/50 transition-colors"
                >
                  Lihat Transkrip Nilai
                </button>
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute top-5 right-10 text-8xl opacity-10 font-black tracking-tighter select-none pointer-events-none">2026</div>
            </div>

            {/* Current Active KRS Summary (if any) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Mata Kuliah Semester Ini (Semester {currentSemester})</h3>
              
              {savedKRS && savedJadwalIds.length > 0 ? (
                <div className="space-y-3">
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="p-3 pl-4">Kode MK</th>
                          <th className="p-3">Nama Mata Kuliah</th>
                          <th className="p-3">SKS</th>
                          <th className="p-3">Jadwal Kelas</th>
                          <th className="p-3">Ruangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {selectedSchedulesDetails.map(({ schedule, mk }) => (
                          <tr key={schedule.id_jadwal} className="hover:bg-slate-50/50">
                            <td className="p-3 pl-4 font-mono font-bold text-slate-800">{mk.kode_mk}</td>
                            <td className="p-3 font-semibold text-slate-900">{mk.nama_mk}</td>
                            <td className="p-3 text-slate-600 font-medium">{mk.sks} SKS</td>
                            <td className="p-3 text-slate-600">
                              <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                                {schedule.hari}, {schedule.jam_mulai} - {schedule.jam_selesai}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 font-mono">{schedule.ruangan}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 px-1 mt-2">
                    <span>Terakhir disimpan pada: {new Date(savedKRS.tanggal_krs).toLocaleDateString('id-ID')}</span>
                    <span className="font-bold text-slate-900">Total: {currentSelectedSKS} SKS</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Anda belum menginput atau memfinalisasi KRS semester ini.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Silakan buka tab "Rencana Studi (KRS)" untuk memilih kelas.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Hand: Institutional Information / Help desk */}
          <div className="md:col-span-4 space-y-6">
            {/* Academic Info Guidelines */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Info className="w-4 h-4 text-indigo-500" />
                <span>Pedoman Akademik KRS</span>
              </h4>
              
              <ul className="space-y-3 text-xs text-slate-600">
                <li className="flex gap-2">
                  <span className="text-indigo-600 font-bold shrink-0">1.</span>
                  <span>Batas maksimal SKS didasarkan secara ketat pada IP Semester sebelumnya.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-600 font-bold shrink-0">2.</span>
                  <span>IPK &gt;= 3.00 berhak memprogram hingga maksimal <strong>24 SKS</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-600 font-bold shrink-0">3.</span>
                  <span>IPK 2.00 - 2.99 berhak memprogram hingga maksimal <strong>21 SKS</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-600 font-bold shrink-0">4.</span>
                  <span>Perhatikan agar tidak memilih jadwal mata kuliah yang bentrok di hari/jam yang sama.</span>
                </li>
              </ul>
            </div>

            {/* Academic Advisor Contact card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm text-center relative overflow-hidden group hover:border-indigo-200 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600"></div>
              <div className="w-12 h-12 bg-white border border-slate-200 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <UserIcon className="w-6 h-6" />
              </div>
              <h5 className="font-bold text-slate-800 text-xs">Dosen Wali Akademik</h5>
              <p className="text-xs text-slate-900 font-semibold mt-1">Prof. Dr. Ir. H. Hermawan, M.T.</p>
              <p className="text-[10px] text-slate-500">NIP: 197805122003121002</p>
              <div className="border-t border-slate-200/60 mt-3 pt-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Konsultasi</span>
                <span className="text-[11px] font-semibold text-slate-700 block mt-0.5">Senin - Kamis, 14:00 - 16:00</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: KRS SELECTION */}
      {activeSubTab === 'krs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="mhs-krs-view">
          {/* SKS Limit Indicator floating banner / top bar */}
          <div className="lg:col-span-12">
            <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div className="flex gap-3 items-center">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Lembar Pemilihan Mata Kuliah Akademik</h4>
                  <p className="text-xs text-slate-400">
                    SKS Terpilih: <strong className="text-indigo-400 font-mono text-sm">{currentSelectedSKS}</strong> dari maksimal <strong className="text-amber-400 font-mono text-sm">{stats.sksLimit} SKS</strong>
                  </p>
                </div>
              </div>

              {/* Real-time progress bar */}
              <div className="w-full sm:w-48 bg-slate-850 h-2.5 rounded-full overflow-hidden border border-slate-750">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    currentSelectedSKS > stats.sksLimit
                      ? 'bg-rose-500'
                      : currentSelectedSKS === stats.sksLimit
                        ? 'bg-emerald-500'
                        : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, (currentSelectedSKS / stats.sksLimit) * 100)}%` }}
                ></div>
              </div>

              <div className="flex gap-2">
                {isEditingKrs ? (
                  <button
                    onClick={handleSaveKrsClick}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm shadow-indigo-600/10 cursor-pointer"
                    id="btn-save-krs"
                  >
                    Simpan KRS Semester {currentSemester}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingKrs(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                    id="btn-edit-krs-toggle"
                  >
                    Ubah Pilihan KRS
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Left Column: Course Selection Catalog */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari kode atau nama mata kuliah..."
                    className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                  />
                </div>
                
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                >
                  <option value="all">Semua Semester</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                </select>
              </div>

              {/* Course Catalog Table */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-3 pl-4">Kode / MK</th>
                      <th className="p-3">SKS & Sem</th>
                      <th className="p-3">Jadwal Kuliah</th>
                      <th className="p-3 text-right pr-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredSchedules.length > 0 ? (
                      filteredSchedules.map((schedule) => {
                        const mk = mataKuliahList.find((m) => m.kode_mk === schedule.kode_mk)!;
                        const isSelected = selectedJadwalIds.includes(schedule.id_jadwal);
                        const isCourseAdded = selectedSchedulesDetails.some(
                          (item) => item.mk.kode_mk === mk.kode_mk
                        );

                        return (
                          <tr key={schedule.id_jadwal} className="hover:bg-slate-50/50">
                            <td className="p-3 pl-4">
                              <span className="font-mono font-bold text-indigo-650 block">{mk.kode_mk}</span>
                              <span className="font-semibold text-slate-800 text-[11px]">{mk.nama_mk}</span>
                            </td>
                            <td className="p-3 text-slate-600">
                              <span className="block font-semibold">{mk.sks} SKS</span>
                              <span className="text-[10px] text-slate-400">Semester {mk.semester}</span>
                            </td>
                            <td className="p-3 text-slate-600">
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {schedule.hari}, {schedule.jam_mulai} - {schedule.jam_selesai}
                                </span>
                                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {schedule.ruangan}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-right pr-4">
                              {isSelected ? (
                                <button
                                  disabled={!isEditingKrs}
                                  onClick={() => handleRemoveSchedule(schedule.id_jadwal)}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 disabled:bg-slate-55 disabled:text-slate-400 text-[11px] font-bold rounded-lg border border-rose-200 transition-colors cursor-pointer"
                                  title="Hapus dari KRS"
                                >
                                  <Trash2 className="w-3.5 h-3.5 inline" />
                                </button>
                              ) : (
                                <button
                                  disabled={!isEditingKrs || isCourseAdded}
                                  onClick={() => handleSelectSchedule(schedule.id_jadwal)}
                                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 ml-auto cursor-pointer ${
                                    isCourseAdded
                                      ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                  }`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>{isCourseAdded ? 'Terpilih' : 'Pilih'}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                          Tidak ditemukan kelas kuliah yang cocok dengan pencarian Anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Active KRS Selected Cart / Real-time Review */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BookOpen className="w-4.5 h-4.5 text-indigo-600" />
                  <span>KRS Draft Review</span>
                </h3>
                <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold px-2 py-0.5 rounded font-mono">
                  {selectedJadwalIds.length} Kelas
                </span>
              </div>

              {selectedSchedulesDetails.length > 0 ? (
                <div className="space-y-3">
                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {selectedSchedulesDetails.map(({ schedule, mk }) => (
                      <div key={schedule.id_jadwal} className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-bold font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase">
                            {mk.kode_mk}
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 mt-1">{mk.nama_mk}</h4>
                          <span className="text-[10px] text-slate-500 font-semibold">{mk.sks} SKS • Semester {mk.semester}</span>
                          <div className="flex gap-2 items-center mt-2 text-[10px] text-slate-600 font-medium">
                            <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-[0_1px_1px_rgba(0,0,0,0.02)]">
                              {schedule.hari} {schedule.jam_mulai}
                            </span>
                            <span className="text-slate-400">|</span>
                            <span>{schedule.ruangan}</span>
                          </div>
                        </div>
                        {isEditingKrs && (
                          <button
                            onClick={() => handleRemoveSchedule(schedule.id_jadwal)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Total SKS Terpilih:</span>
                      <span className={`font-bold font-mono ${
                        currentSelectedSKS > stats.sksLimit ? 'text-rose-600' : 'text-slate-900'
                      }`}>
                        {currentSelectedSKS} SKS / {stats.sksLimit} SKS
                      </span>
                    </div>

                    {currentSelectedSKS > stats.sksLimit && (
                      <div className="bg-rose-50 border border-rose-100 rounded-lg p-2.5 flex gap-2 items-start text-[10px] text-rose-700 font-semibold">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>SKS yang dipilih melebihi jatah akademik Anda! Hapus beberapa kelas kuliah.</span>
                      </div>
                    )}
                  </div>

                  {isEditingKrs && (
                    <button
                      onClick={handleSaveKrsClick}
                      disabled={currentSelectedSKS > stats.sksLimit || currentSelectedSKS === 0}
                      className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer text-center"
                    >
                      Kunci & Finalisasi KRS
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs font-semibold">Belum ada kelas dipilih.</p>
                  <p className="text-[10px] mt-1">Silakan pilih mata kuliah dari katalog di sebelah kiri.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: KHS & TRANSKRIP */}
      {activeSubTab === 'khs' && (
        <div className="space-y-6" id="mhs-khs-view">
          {/* Dashboard Header of KHS */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Kartu Hasil Studi (KHS) Kumulatif</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nilai dan IPK dihitung secara real-time berdasarkan bobot SKS resmi.
              </p>
            </div>
            
            {/* Interactive Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                id="btn-print-transcript"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Transkrip Mandiri</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Grade breakdown tables per semester */}
            <div className="md:col-span-8 space-y-6">
              {/* Group grades by semester dynamically */}
              {availableSemesters.map((sem) => {
                const semesterGrades = stats.studentGrades.filter((g) => {
                  const mk = mataKuliahList.find((m) => m.kode_mk === g.kode_mk);
                  return mk?.semester === sem;
                });

                // Find saved KRS for this specific semester 'sem'
                const semKrs = krsList.find((k) => k.nim === mahasiswa.nim && k.semester_aktif === sem);
                const semKrsDetails = semKrs ? detailKrsList.filter((d) => d.id_krs === semKrs.id_krs) : [];
                const semesterActiveCourses = semKrsDetails
                  .map((d) => {
                    const schedule = jadwalKuliahList.find((j) => j.id_jadwal === d.id_jadwal);
                    const mk = schedule ? mataKuliahList.find((m) => m.kode_mk === schedule.kode_mk) : null;
                    return { schedule, mk };
                  })
                  .filter((item) => item.schedule && item.mk) as { schedule: JadwalKuliah; mk: MataKuliah }[];

                // Skip showing empty semesters only if they are not the active semester or if they don't have grades
                const hasGrades = semesterGrades.length > 0;
                const hasKrs = semesterActiveCourses.length > 0;
                if (!hasGrades && !hasKrs && sem !== currentSemester) return null;

                return (
                  <div key={sem} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3">
                    <h4 className="font-bold text-slate-850 text-xs border-b border-slate-100 pb-2 uppercase tracking-wider flex justify-between">
                      <span>Semester {sem}</span>
                      <span className="text-slate-400">
                        {sem % 2 === 1 ? 'Ganjil' : 'Genap'} {2024 + Math.floor((sem - 1) / 2)}/{2025 + Math.floor((sem - 1) / 2)}
                      </span>
                    </h4>
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="p-3 pl-4">Kode MK</th>
                            <th className="p-3">Nama Mata Kuliah</th>
                            <th className="p-3">SKS</th>
                            <th className="p-3">Nilai Huruf</th>
                            <th className="p-3">Bobot</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {semesterGrades.map((g) => {
                            const mk = mataKuliahList.find((m) => m.kode_mk === g.kode_mk)!;
                            return (
                              <tr key={g.id_nilai}>
                                <td className="p-3 pl-4 font-mono font-bold text-indigo-650">{mk.kode_mk}</td>
                                <td className="p-3 font-semibold text-slate-800">{mk.nama_mk}</td>
                                <td className="p-3 text-slate-600 font-medium">{mk.sks} SKS</td>
                                <td className="p-3">
                                  <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 border border-emerald-250 text-emerald-850">
                                    {g.nilai_huruf} ({g.nilai_angka})
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-slate-700 font-semibold">{calculateGradeWeight(g.nilai_huruf).toFixed(2)}</td>
                              </tr>
                            );
                          })}

                          {/* Enrolled but ungraded courses */}
                          {semesterActiveCourses
                            .filter(({ mk }) => !semesterGrades.some((g) => g.kode_mk === mk.kode_mk))
                            .map(({ schedule, mk }) => (
                              <tr key={schedule.id_jadwal} className="bg-slate-50/40 italic">
                                <td className="p-3 pl-4 font-mono font-semibold text-slate-400">{mk.kode_mk}</td>
                                <td className="p-3 font-medium text-slate-500">{mk.nama_mk}</td>
                                <td className="p-3 text-slate-400 font-medium">{mk.sks} SKS</td>
                                <td className="p-3">
                                  <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 not-italic uppercase tracking-wide">
                                    Sedang Ditempuh
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-slate-400">-</td>
                              </tr>
                            ))}

                          {semesterGrades.length === 0 && semesterActiveCourses.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                                Belum ada mata kuliah yang diambil/dinilai pada semester ini.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* GPA summary cards details */}
            <div className="md:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Metrik Nilai</h4>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Total SKS Tempuh</span>
                    <span className="font-bold text-slate-800">{stats.totalSKSCompleted} SKS</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Total Mutu (Kredit*Bobot)</span>
                    <span className="font-bold text-slate-800">{stats.totalGradePoints.toFixed(1)}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500 font-bold">Indeks Prestasi Kumulatif</span>
                    <span className="font-extrabold text-indigo-600 text-sm font-mono">{stats.ipk.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Informative Help Box */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 flex gap-3 text-xs leading-relaxed text-slate-600 relative overflow-hidden group hover:border-indigo-200 transition-colors">
                <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>
                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-850">Kalkulasi Mandiri:</h5>
                  <p className="mt-1 text-slate-500 text-[11px]">
                    IPK diperoleh dengan mengalikan SKS tiap mata kuliah dengan bobot angka nilai hurufnya, dijumlahkan seluruhnya, lalu dibagi total SKS yang diselesaikan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRANSCRIPT PRINT PREVIEW MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-55 flex items-center justify-center p-4 overflow-y-auto" id="transcript-modal">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Modal Controls Bar */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex gap-2 items-center">
                <Printer className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Pratinjau Cetak Transkrip Nilai Akademik</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak (System)</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Modal Printable Sheet Container */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
              {/* Outer sheet wrapper with strict academic form layout */}
              <div className="bg-white border border-slate-350 shadow-md p-10 max-w-[210mm] mx-auto min-h-[297mm] relative text-slate-900 font-serif print:border-none print:shadow-none" id="print-sheet">
                
                {/* 1. Official Kop Surat Academic Header */}
                <div className="border-b-4 border-double border-slate-900 pb-4 text-center">
                  <span className="font-serif font-extrabold uppercase tracking-wide text-sm block">Kementerian Pendidikan Tinggi, Riset, dan Teknologi</span>
                  <h1 className="font-serif font-black text-xl uppercase tracking-wider mt-1 text-slate-950">UNIVERSITAS TEKNOLOGI AKADEMIK</h1>
                  <span className="font-serif font-bold text-xs uppercase block mt-0.5">FAKULTAS TEKNOLOGI INFORMASI</span>
                  <p className="text-[10px] italic text-slate-500 font-sans mt-1">
                    Jl. Kampus Merdeka No. 404, Surabaya • Telp: (031) 555-0101 • Email: info@akademik.ac.id
                  </p>
                </div>

                {/* 2. Document Title */}
                <div className="text-center my-6">
                  <h2 className="font-serif font-black uppercase tracking-wider text-base border-b border-slate-950 inline-block px-6 pb-1">
                    TRANSKRIP NILAI AKADEMIK SEMENTARA
                  </h2>
                </div>

                {/* 3. Student Metadata Columns */}
                <div className="grid grid-cols-2 gap-x-8 text-xs font-sans text-slate-800 mb-6">
                  <table className="w-full text-left border-collapse">
                    <tbody>
                      <tr>
                        <td className="py-1 font-bold w-1/3">NAMA</td>
                        <td className="py-1">: {mahasiswa.nama.toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-bold">NIM</td>
                        <td className="py-1">: {mahasiswa.nim}</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-bold">TEMPAT LAHIR</td>
                        <td className="py-1">: {mahasiswa.tempat_lahir.toUpperCase()}</td>
                      </tr>
                    </tbody>
                  </table>
                  <table className="w-full text-left border-collapse">
                    <tbody>
                      <tr>
                        <td className="py-1 font-bold w-1/3">PROGRAM STUDI</td>
                        <td className="py-1">: TEKNIK INFORMATIKA (S1)</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-bold">FAKULTAS</td>
                        <td className="py-1">: TEKNOLOGI INFORMASI</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-bold">TANGGAL LAHIR</td>
                        <td className="py-1">: {new Date(mahasiswa.tanggal_lahir).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}).toUpperCase()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 4. Complete Academic Table (Grades list) */}
                <div className="border border-slate-950 font-sans text-[11px] mb-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-950 text-[10px] font-bold text-slate-800 uppercase text-center">
                        <th className="p-2 border-r border-slate-950 text-left pl-4">No</th>
                        <th className="p-2 border-r border-slate-950 text-left">Kode MK</th>
                        <th className="p-2 border-r border-slate-950 text-left">Nama Mata Kuliah</th>
                        <th className="p-2 border-r border-slate-950">SKS (K)</th>
                        <th className="p-2 border-r border-slate-950">Nilai (N)</th>
                        <th className="p-2 border-r border-slate-950">Bobot (B)</th>
                        <th className="p-2">Kredit * Bobot (KxB)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-350">
                      {/* All historical grades */}
                      {stats.studentGrades.map((g, index) => {
                        const mk = mataKuliahList.find((m) => m.kode_mk === g.kode_mk)!;
                        const weight = calculateGradeWeight(g.nilai_huruf);
                        const kxb = mk.sks * weight;
                        return (
                          <tr key={g.id_nilai} className="hover:bg-slate-50/50">
                            <td className="p-2 border-r border-slate-350 text-center">{index + 1}</td>
                            <td className="p-2 border-r border-slate-350 font-mono font-bold">{mk.kode_mk}</td>
                            <td className="p-2 border-r border-slate-350 font-medium">{mk.nama_mk}</td>
                            <td className="p-2 border-r border-slate-350 text-center font-bold">{mk.sks}</td>
                            <td className="p-2 border-r border-slate-350 text-center font-bold">{g.nilai_huruf}</td>
                            <td className="p-2 border-r border-slate-350 text-center font-mono">{weight.toFixed(2)}</td>
                            <td className="p-2 text-center font-mono font-bold">{kxb.toFixed(2)}</td>
                          </tr>
                        );
                      })}

                      {/* Display currently active KRS selection as 'IP / In Progress' to meet real system requirements */}
                      {savedKRS && selectedSchedulesDetails
                        .filter(({ mk }) => !stats.studentGrades.some((g) => g.kode_mk === mk.kode_mk))
                        .map(({ schedule, mk }, index) => {
                          return (
                            <tr key={schedule.id_jadwal} className="bg-amber-50/20 italic">
                              <td className="p-2 border-r border-slate-350 text-center">{stats.studentGrades.length + index + 1}</td>
                              <td className="p-2 border-r border-slate-350 font-mono font-bold">{mk.kode_mk}</td>
                              <td className="p-2 border-r border-slate-350 font-medium">{mk.nama_mk} (KRS Aktif)</td>
                              <td className="p-2 border-r border-slate-350 text-center font-bold">{mk.sks}</td>
                              <td className="p-2 border-r border-slate-350 text-center text-slate-400 font-semibold font-sans">-</td>
                              <td className="p-2 border-r border-slate-350 text-center text-slate-400 font-sans">-</td>
                              <td className="p-2 text-center text-slate-400 font-sans">Sedang Ditempuh</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* 5. Calculations / Summary Statistics block */}
                <div className="border border-slate-950 font-sans p-4 rounded-lg bg-slate-50/30 flex justify-between gap-12 text-xs mb-8">
                  <div>
                    <div className="flex justify-between py-1 border-b border-slate-200 gap-4">
                      <span className="text-slate-600 font-medium">TOTAL SKS (K) LULUS</span>
                      <span className="font-bold text-slate-900">{stats.totalSKSCompleted} SKS</span>
                    </div>
                    {savedKRS && (
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600 font-medium">SKS SEDANG DITEMPUH</span>
                        <span className="font-bold text-slate-900">{currentSelectedSKS} SKS</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">TOTAL SKS TERDAFTAR</span>
                      <span className="font-bold text-slate-900">
                        {stats.totalSKSCompleted + (savedKRS ? currentSelectedSKS : 0)} SKS
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between py-1 border-b border-slate-200 gap-4">
                      <span className="text-slate-600 font-medium">TOTAL BOBOT PRESTASI (KxB)</span>
                      <span className="font-bold text-slate-900">{stats.totalGradePoints.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600 font-bold uppercase">Indeks Prestasi Kumulatif (IPK)</span>
                      <span className="font-extrabold text-slate-950 text-sm font-mono border-b border-slate-950">
                        {stats.ipk.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. Signature / Stamp Layout Block */}
                <div className="grid grid-cols-2 gap-8 text-xs font-sans mt-12 pt-8 border-t border-slate-200/50">
                  <div className="space-y-1 text-slate-400">
                    <p className="font-bold text-slate-600">Catatan:</p>
                    <p>1. Transkrip ini dicetak mandiri dari Sistem Informasi Akademik.</p>
                    <p>2. Keabsahan data didasarkan pada database universitas.</p>
                  </div>
                  <div className="text-center space-y-16 ml-auto w-64">
                    <div>
                      <p className="text-slate-700">Surabaya, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                      <p className="font-bold text-slate-900">Wakil Dekan Bidang Akademik,</p>
                    </div>
                    
                    {/* Placeholder for Signature Stamp */}
                    <div className="relative inline-block">
                      <div className="absolute inset-0 border-2 border-double border-indigo-500/30 text-indigo-500/30 font-black rounded-full text-[10px] flex items-center justify-center rotate-12 -translate-y-8 uppercase tracking-widest font-sans pointer-events-none p-4 h-16 w-32 border-indigo-650">
                        VERIFIED IA
                      </div>
                      <div className="border-b border-slate-900 w-full font-bold text-slate-900">
                        Prof. Ir. Bambang Triyono, Ph.D.
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">NIP. 196510201991031003</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
