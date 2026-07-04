import React, { useState } from 'react';
import { User, Mahasiswa } from '../types';
import { Shield, UserCheck, Clock, RefreshCw, Plus, Check, X } from 'lucide-react';

export function getSemesterLabel(N: number) {
  const yearOffset = Math.floor((N - 1) / 2);
  const startYear = 2024 + yearOffset;
  const endYear = 2025 + yearOffset;
  const term = N % 2 === 1 ? 'Ganjil' : 'Genap';
  return `Semester ${N} (${term} ${startYear}/${endYear})`;
}

interface SimulatorBarProps {
  users: User[];
  mahasiswa: Mahasiswa[];
  currentUser: User | null;
  onSwitchUser: (userId: string) => void;
  onResetData: () => void;
  currentSemester: number;
  onChangeSemester: (sem: number) => void;
  semesters: number[];
  onAddSemester: (sem: number) => void;
}

export default function SimulatorBar({
  users,
  mahasiswa,
  currentUser,
  onSwitchUser,
  onResetData,
  currentSemester,
  onChangeSemester,
  semesters,
  onAddSemester,
}: SimulatorBarProps) {
  // Find predefined or current state users for easy swapping
  const adminUser = users.find((u) => u.id_user === 'U_ADMIN' || u.role === 'admin');
  const activeMhs = users.find((u) => u.id_user === 'U_MHS_ACTIVE') || users.find((u) => u.role === 'mahasiswa' && u.id_user !== 'U_MHS_PENDING');
  
  // Find maba: use current user if they are a maba/calon, otherwise find any maba user, or fall back to U_MHS_PENDING (Budi Santoso)
  const isCurrentMaba = currentUser && (currentUser.role === 'maba' || mahasiswa.find(m => m.id_user === currentUser.id_user)?.status === 'Calon');
  const mabaMhs = isCurrentMaba 
    ? currentUser 
    : (users.find((u) => u.role === 'maba') || users.find((u) => u.id_user === 'U_MHS_PENDING'));

  const getMahasiswaName = (userId: string) => {
    const mhs = mahasiswa.find((m) => m.id_user === userId);
    return mhs ? mhs.nama : 'Unknown';
  };

  const getMahasiswaStatus = (userId: string) => {
    const mhs = mahasiswa.find((m) => m.id_user === userId);
    return mhs ? mhs.status : '';
  };

  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isAddingSemester, setIsAddingSemester] = useState(false);
  const [newSemesterNum, setNewSemesterNum] = useState('');

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 shadow-lg" id="simulator-bar">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Side: Explanation */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/30 rounded-lg text-indigo-400 border border-indigo-500/20">
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <span>Aktor Simulator</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                Interactive Testing
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Pilih akun di bawah untuk mensimulasikan alur verifikasi berkas hingga pengisian KRS.
            </p>
          </div>
        </div>

        {/* Center: Swapper Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Calon Maba Button */}
          {mabaMhs && (
            <button
              onClick={() => onSwitchUser(mabaMhs.id_user)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                currentUser?.id_user === mabaMhs.id_user
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-900/30 font-bold scale-105'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
              id="sim-btn-maba"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>1. Maba: {getMahasiswaName(mabaMhs.id_user)}</span>
              <span className="text-[9px] bg-slate-900/40 px-1 rounded text-amber-300 border border-amber-500/20">
                {getMahasiswaStatus(mabaMhs.id_user)}
              </span>
            </button>
          )}

          {/* Admin Button */}
          {adminUser && (
            <button
              onClick={() => onSwitchUser(adminUser.id_user)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                currentUser?.id_user === adminUser.id_user
                  ? 'bg-indigo-650 text-white border-indigo-500 shadow-md shadow-indigo-950/30 font-bold scale-105'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
              id="sim-btn-admin"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>2. Admin Akademik</span>
            </button>
          )}

          {/* Active Mahasiswa Button */}
          {activeMhs && (
            <button
              onClick={() => onSwitchUser(activeMhs.id_user)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                currentUser?.id_user === activeMhs.id_user
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/30 font-bold scale-105'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
              id="sim-btn-mhs"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>3. Mhs Aktif: {getMahasiswaName(activeMhs.id_user)}</span>
            </button>
          )}
        </div>

        {/* Center-Right: Active Semester Selector */}
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-1.5 shadow-inner">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Periode Aktif:</span>
          <div className="flex items-center gap-1">
            <select
              value={currentSemester}
              onChange={(e) => onChangeSemester(Number(e.target.value))}
              className="bg-transparent text-xs font-extrabold text-indigo-400 focus:outline-none cursor-pointer border-none p-0 pr-1 select-none"
              id="sim-select-semester"
            >
              {semesters.map((sem) => (
                <option key={sem} value={sem} className="bg-slate-900 text-slate-100 font-sans">
                  {getSemesterLabel(sem)}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsAddingSemester(true)}
              className="p-1 hover:bg-slate-700 rounded text-indigo-400 transition-colors cursor-pointer"
              title="Tambah Semester/Periode Baru"
              id="sim-btn-add-semester-toggle"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Reset */}
        <div className="flex items-center md:border-l md:border-slate-800 md:pl-4">
          {showConfirm ? (
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <span className="text-[10px] text-rose-400 font-medium">Yakin reset?</span>
              <button
                onClick={() => {
                  onResetData();
                  setShowConfirm(false);
                }}
                className="text-[10px] bg-rose-650 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded cursor-pointer transition-colors"
                id="sim-btn-reset-confirm"
              >
                Ya
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold px-2 py-1 rounded cursor-pointer transition-colors"
                id="sim-btn-reset-cancel"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-[11px] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-mono cursor-pointer"
              title="Reset ulang semua data ke kondisi awal"
              id="sim-btn-reset"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Demo Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal Tambah Semester/Periode */}
      {isAddingSemester && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-5 animate-scaleUp">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Tambah Periode Baru</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddingSemester(false);
                  setNewSemesterNum('');
                }}
                className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                id="modal-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="modal-sem-input" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Nomor Semester (1 - 20)
              </label>
              <input
                id="modal-sem-input"
                type="number"
                min="1"
                max="20"
                placeholder="Contoh: 5"
                value={newSemesterNum}
                onChange={(e) => setNewSemesterNum(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                autoFocus
              />
            </div>

            {/* Dynamic Label preview */}
            {newSemesterNum && parseInt(newSemesterNum) > 0 && (
              <div className="bg-slate-950/40 border border-slate-800/65 rounded-xl p-3.5 space-y-1">
                <span className="block text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Format Label Akademik:</span>
                <span className="block text-xs font-bold text-slate-200">
                  {getSemesterLabel(parseInt(newSemesterNum))}
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingSemester(false);
                  setNewSemesterNum('');
                }}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                id="modal-btn-cancel"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!newSemesterNum || isNaN(parseInt(newSemesterNum)) || parseInt(newSemesterNum) <= 0}
                onClick={() => {
                  const num = parseInt(newSemesterNum);
                  if (!isNaN(num) && num > 0) {
                    if (semesters.includes(num)) {
                      alert('Semester tersebut sudah ada!');
                    } else {
                      onAddSemester(num);
                      setIsAddingSemester(false);
                      setNewSemesterNum('');
                    }
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                id="modal-btn-submit"
              >
                Tambah Periode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
