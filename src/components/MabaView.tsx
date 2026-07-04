import React, { useState, useRef } from 'react';
import { User, Mahasiswa, BerkasPendaftaran } from '../types';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User as UserIcon,
  MapPin,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Check,
} from 'lucide-react';

interface MabaViewProps {
  currentUser: User;
  mahasiswa: Mahasiswa | undefined;
  berkas: BerkasPendaftaran | undefined;
  onUpdateProfile: (nama: string, tempat: string, tgl: string) => void;
  onUploadBerkas: (ijazahName: string, transkripName: string) => void;
  onSwitchToActiveStudent: () => void;
}

export default function MabaView({
  currentUser,
  mahasiswa,
  berkas,
  onUpdateProfile,
  onUploadBerkas,
  onSwitchToActiveStudent,
}: MabaViewProps) {
  // Input states for updating profile
  const [nama, setNama] = useState(mahasiswa?.nama || '');
  const [tempatLahir, setTempatLahir] = useState(mahasiswa?.tempat_lahir || '');
  const [tanggalLahir, setTanggalLahir] = useState(mahasiswa?.tanggal_lahir || '');
  const [isEditingProfile, setIsEditingProfile] = useState(!mahasiswa?.nama);

  // File states (mocking uploads)
  const [ijazahFile, setIjazahFile] = useState<string | null>(berkas?.file_ijazah_name || null);
  const [transkripFile, setTranskripFile] = useState<string | null>(berkas?.file_transkrip_name || null);
  const [dragActiveIjazah, setDragActiveIjazah] = useState(false);
  const [dragActiveTranskrip, setDragActiveTranskrip] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const ijazahInputRef = useRef<HTMLInputElement>(null);
  const transkripInputRef = useRef<HTMLInputElement>(null);

  // Handle profile form submit
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !tempatLahir || !tanggalLahir) return;
    onUpdateProfile(nama, tempatLahir, tanggalLahir);
    setIsEditingProfile(false);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent, type: 'ijazah' | 'transkrip') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      if (type === 'ijazah') setDragActiveIjazah(true);
      else setDragActiveTranskrip(true);
    } else if (e.type === 'dragleave') {
      if (type === 'ijazah') setDragActiveIjazah(false);
      else setDragActiveTranskrip(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'ijazah' | 'transkrip') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'ijazah') {
      setDragActiveIjazah(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        setIjazahFile(e.dataTransfer.files[0].name);
      }
    } else {
      setDragActiveTranskrip(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        setTranskripFile(e.dataTransfer.files[0].name);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ijazah' | 'transkrip') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'ijazah') {
        setIjazahFile(e.target.files[0].name);
      } else {
        setTranskripFile(e.target.files[0].name);
      }
    }
  };

  // Submit mock documents
  const handleSubmitBerkas = () => {
    if (!ijazahFile || !transkripFile) return;
    setIsUploading(true);
    // Simulate short network delay
    setTimeout(() => {
      onUploadBerkas(ijazahFile, transkripFile);
      setIsUploading(false);
    }, 1200);
  };

  // Define steps status
  const isProfileDone = !!mahasiswa?.nama && !isEditingProfile;
  const isBerkasDone = !!berkas && berkas.status_verifikasi !== 'Ditolak';
  const isApproved = berkas?.status_verifikasi === 'Disetujui' && mahasiswa?.status === 'Aktif';
  const isPending = berkas?.status_verifikasi === 'Pending';
  const isRejected = berkas?.status_verifikasi === 'Ditolak';

  return (
    <div className="space-y-8" id="maba-view">
      {/* Celebration Alert if Approved */}
      {isApproved && (
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border border-emerald-650 rounded-3xl p-8 shadow-lg shadow-emerald-900/10 relative overflow-hidden" id="maba-approved-card">
          <div className="absolute right-0 top-0 w-44 h-44 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Selamat! Pendaftaran Anda Disetujui</h2>
                <p className="text-xs text-emerald-100 mt-1.5 max-w-xl leading-relaxed">
                  Berkas pendaftaran Anda telah divalidasi oleh Admin Akademik. Anda sekarang resmi terdaftar sebagai mahasiswa aktif di sistem perguruan tinggi.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-xl px-4 py-2">
                    <span className="text-[10px] text-emerald-200 block font-bold uppercase tracking-wider">NIM Anda</span>
                    <span className="text-base font-mono font-bold text-white tracking-widest block">
                      {mahasiswa?.nim}
                    </span>
                  </div>
                  <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-xl px-4 py-2">
                    <span className="text-[10px] text-emerald-200 block font-bold uppercase tracking-wider">Status Akademik</span>
                    <span className="text-xs font-bold text-white bg-emerald-500/30 px-2.5 py-0.5 rounded-full border border-white/20 inline-block mt-0.5 uppercase tracking-wide">
                      Mahasiswa Aktif
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onSwitchToActiveStudent}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-emerald-700 font-bold rounded-xl transition-all shadow-xl cursor-pointer text-xs whitespace-nowrap self-stretch md:self-auto shrink-0"
              id="btn-switch-mhs"
            >
              <span>Mulai Isi KRS Semester 3</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Rejection Alert if Rejected */}
      {isRejected && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 flex gap-4 items-start" id="maba-rejected-card">
          <div className="p-2.5 bg-rose-100 text-rose-600 rounded-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-rose-900">Berkas Pendaftaran Ditolak</h3>
            <p className="text-sm text-rose-700 mt-1">
              Mohon maaf, berkas pendaftaran Anda tidak disetujui oleh admin karena alasan berikut:
            </p>
            <div className="bg-white border border-rose-100 rounded-lg p-3 mt-3 text-sm font-medium text-slate-700 italic border-l-4 border-l-rose-500">
              "{berkas?.catatan || 'Berkas ijazah atau transkrip nilai kurang lengkap/jelas.'}"
            </div>
            <p className="text-xs text-rose-600 mt-3 font-semibold">
              Silakan unggah kembali berkas yang valid di bawah untuk diajukan ulang.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Info and Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Hand: Timeline / Steps Tracker */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Siklus Pendaftaran</h3>
            
            <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {/* Step 1 */}
              <div className="flex gap-4 relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border z-10 ${
                  isProfileDone 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white text-slate-400 border-slate-300'
                }`}>
                  {isProfileDone ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-xs font-bold text-slate-900">Formulir Profil</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Lengkapi data diri pendaftar calon mahasiswa baru.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border z-10 ${
                  isBerkasDone 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : !isProfileDone 
                      ? 'bg-slate-50 text-slate-300 border-slate-200' 
                      : ijazahFile && transkripFile && berkas 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white text-slate-700 border-indigo-600 ring-2 ring-indigo-100'
                }`}>
                  {isBerkasDone ? <Check className="w-4 h-4" /> : '2'}
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-xs font-bold text-slate-900">Unggah Berkas Pendaftaran</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Unggah pindaian berkas asli Ijazah & Transkrip SMA/Sederajat.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border z-10 ${
                  isApproved 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : isPending 
                      ? 'bg-amber-500 text-white border-amber-500 animate-pulse'
                      : isRejected
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-slate-50 text-slate-300 border-slate-200'
                }`}>
                  {isApproved ? <Check className="w-4 h-4" /> : '3'}
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-xs font-bold text-slate-900">Verifikasi Berkas</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    {isPending ? (
                      <span className="text-amber-600 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Sedang Diberkas Admin
                      </span>
                    ) : isRejected ? (
                      <span className="text-rose-600 font-bold">Berkas Ditolak</span>
                    ) : isApproved ? (
                      <span className="text-emerald-600">Berkas Terverifikasi</span>
                    ) : (
                      'Pemeriksaan keabsahan dokumen oleh admin.'
                    )}
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border z-10 ${
                  isApproved 
                    ? 'bg-emerald-500 text-white border-emerald-500' 
                    : 'bg-slate-50 text-slate-300 border-slate-200'
                }`}>
                  {isApproved ? <Check className="w-4 h-4" /> : '4'}
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-xs font-bold text-slate-900">Penerbitan NIM Otomatis</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Nomor Induk Mahasiswa aktif terbit untuk login akademik.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand: Interactive Workspaces */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Phase A: Profile Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-1.5">
                <UserIcon className="w-4.5 h-4.5 text-indigo-600" />
                <span>Profil Calon Mahasiswa</span>
              </h3>
              {!isEditingProfile && mahasiswa?.nama && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="text-xs text-indigo-650 hover:underline font-semibold"
                  id="btn-edit-profile"
                >
                  Edit Profil
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4" id="maba-profile-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NAMA LENGKAP <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Nama sesuai ijazah"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      EMAIL PENDAFTARAN
                    </label>
                    <input
                      type="email"
                      value={currentUser.email}
                      disabled
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      TEMPAT LAHIR <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={tempatLahir}
                      onChange={(e) => setTempatLahir(e.target.value)}
                      placeholder="Kota lahir"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      TANGGAL LAHIR <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={tanggalLahir}
                      onChange={(e) => setTanggalLahir(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm cursor-pointer"
                    id="btn-save-profile"
                  >
                    Simpan Data Profil
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4" id="maba-profile-display">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Nama Lengkap</span>
                    <span className="text-sm font-semibold text-slate-800">{mahasiswa?.nama}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Tempat Lahir</span>
                    <span className="text-sm font-semibold text-slate-800">{mahasiswa?.tempat_lahir}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Tanggal Lahir</span>
                    <span className="text-sm font-semibold text-slate-800">{mahasiswa?.tanggal_lahir}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Phase B: Document Upload Form Card */}
          <div className={`bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm transition-opacity duration-300 ${
            !isProfileDone ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-1.5 mb-2 border-b border-slate-100 pb-2">
              <UploadCloud className="w-4.5 h-4.5 text-indigo-600" />
              <span>Unggah Berkas Administrasi</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Sesuai dengan alur sistem informasi akademik, unggah pindaian ijazah dan transkrip nilai resmi SMA/SMK sederajat Anda dalam format PDF/Gambar.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Ijazah Drag Box */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  FILE IJAZAH ASLI <span className="text-rose-500">*</span>
                </label>
                <div
                  onDragEnter={(e) => handleDrag(e, 'ijazah')}
                  onDragLeave={(e) => handleDrag(e, 'ijazah')}
                  onDragOver={(e) => handleDrag(e, 'ijazah')}
                  onDrop={(e) => handleDrop(e, 'ijazah')}
                  onClick={() => ijazahInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                    dragActiveIjazah
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : ijazahFile
                        ? 'border-emerald-300 bg-emerald-50/10'
                        : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                  }`}
                  id="dropzone-ijazah"
                >
                  <input
                    type="file"
                    ref={ijazahInputRef}
                    onChange={(e) => handleFileChange(e, 'ijazah')}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                  {ijazahFile ? (
                    <>
                      <FileText className="w-8 h-8 text-emerald-600 mb-2" />
                      <span className="text-xs font-semibold text-slate-800 break-all px-2 max-w-full block">
                        {ijazahFile}
                      </span>
                      <span className="text-[10px] text-emerald-650 mt-1 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                        Berkas Terpilih (Siap Unggah)
                      </span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-semibold text-slate-700">Tarik berkas atau klik di sini</span>
                      <span className="text-[10px] text-slate-400 mt-1">PDF, JPG, atau PNG (Maks. 5MB)</span>
                    </>
                  )}
                </div>
              </div>

              {/* Transkrip Drag Box */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  FILE TRANSKRIP NILAI / SKHUN <span className="text-rose-500">*</span>
                </label>
                <div
                  onDragEnter={(e) => handleDrag(e, 'transkrip')}
                  onDragLeave={(e) => handleDrag(e, 'transkrip')}
                  onDragOver={(e) => handleDrag(e, 'transkrip')}
                  onDrop={(e) => handleDrop(e, 'transkrip')}
                  onClick={() => transkripInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                    dragActiveTranskrip
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : transkripFile
                        ? 'border-emerald-300 bg-emerald-50/10'
                        : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                  }`}
                  id="dropzone-transkrip"
                >
                  <input
                    type="file"
                    ref={transkripInputRef}
                    onChange={(e) => handleFileChange(e, 'transkrip')}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                  {transkripFile ? (
                    <>
                      <FileText className="w-8 h-8 text-emerald-600 mb-2" />
                      <span className="text-xs font-semibold text-slate-800 break-all px-2 max-w-full block">
                        {transkripFile}
                      </span>
                      <span className="text-[10px] text-emerald-650 mt-1 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                        Berkas Terpilih (Siap Unggah)
                      </span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-semibold text-slate-700">Tarik berkas atau klik di sini</span>
                      <span className="text-[10px] text-slate-400 mt-1">PDF, JPG, atau PNG (Maks. 5MB)</span>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Upload Action */}
            {ijazahFile && transkripFile && (!berkas || berkas.status_verifikasi === 'Ditolak') && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSubmitBerkas}
                  disabled={isUploading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-lg flex items-center gap-2 shadow-sm cursor-pointer"
                  id="btn-upload-submit"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengunggah Berkas...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Kirim Berkas untuk Diverifikasi</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Current Status Badge inside the Upload Panel */}
            {berkas && (
              <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="uploaded-status-bar">
                <div className="flex gap-3 items-center">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Berkas Terunggah:</h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5 max-w-xs truncate">
                      {berkas.file_ijazah_name} | {berkas.file_transkrip_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Status Verifikasi:</span>
                  {berkas.status_verifikasi === 'Pending' ? (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/50 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                      Pending Review
                    </span>
                  ) : berkas.status_verifikasi === 'Disetujui' ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/50 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Disetujui
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200/50 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                      Ditolak
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Guidelines info card */}
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 flex gap-3 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>
            <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Catatan Penting Sistem Akademik:</h5>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                NIM akan otomatis digenerate oleh sistem setelah berkas pendaftaran divalidasi oleh Admin. Akun mahasiswa aktif Anda terikat secara aman dengan data pendaftaran ini. Anda dapat masuk menggunakan NIM Anda untuk menginput KRS.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
