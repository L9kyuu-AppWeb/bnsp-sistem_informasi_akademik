import React, { useState } from 'react';
import { Shield, Clock, UserCheck, GraduationCap, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (identifier: string) => boolean | Promise<boolean>;
  onRegister: (data: {
    username: string;
    email: string;
    nama: string;
    tempatLahir: string;
    tanggalLahir: string;
  }) => void;
  onSwitchToSimulationUser: (userId: string) => void;
}

export default function AuthScreen({
  onLogin,
  onRegister,
  onSwitchToSimulationUser,
}: AuthScreenProps) {
  const [activeForm, setActiveForm] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNama, setRegNama] = useState('');
  const [regTempatLahir, setRegTempatLahir] = useState('');
  const [regTanggalLahir, setRegTanggalLahir] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier) return;
    const success = await onLogin(loginIdentifier);
    if (!success) {
      alert('Kredensial tidak ditemukan! Gunakan identifier berikut untuk uji coba: "admin", "ahmad", atau "budi".');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regEmail || !regNama || !regTempatLahir || !regTanggalLahir) {
      alert('Mohon isi semua formulir pendaftaran!');
      return;
    }

    onRegister({
      username: regUsername,
      email: regEmail,
      nama: regNama,
      tempatLahir: regTempatLahir,
      tanggalLahir: regTanggalLahir,
    });
    
    // Clear registration fields
    setRegUsername('');
    setRegEmail('');
    setRegNama('');
    setRegTempatLahir('');
    setRegTanggalLahir('');
    
    alert('Registrasi Calon Maba Berhasil! Silakan verifikasi berkas pendaftaran Anda.');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50" id="auth-screen">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
        
        {/* Left column: Visual branding & Simulation bypass */}
        <div className="md:col-span-5 bg-slate-900 text-white p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle geometric circles in background */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-600/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-44 h-44 bg-indigo-550/10 rounded-full blur-2xl"></div>

          <div className="space-y-4 relative z-10">
            <div className="inline-flex p-3 bg-indigo-600 rounded-2xl shadow-lg text-white">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide">UNIVERSITAS TEKNOLOGI</h2>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">Sistem Informasi Akademik</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pt-2">
              Portal akademik terintegrasi untuk pendaftaran mahasiswa baru, penginputan kartu rencana studi (KRS), kalkulator IPK kumulatif, dan pencetakan transkrip mandiri.
            </p>
          </div>

          {/* SIMULATION HELP BOX */}
          <div className="mt-8 border-t border-slate-800 pt-6 space-y-4 relative z-10" id="simulation-quick-start">
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Uji Coba Instan (Bypass):</h4>
              <p className="text-[10px] text-slate-500 mt-1">Gunakan akun demo terpopuler berikut untuk simulasi cepat:</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onSwitchToSimulationUser('U_MHS_PENDING')}
                className="w-full flex items-center justify-between p-2.5 bg-slate-800/60 hover:bg-slate-800 text-left rounded-xl transition-all border border-slate-850 hover:border-indigo-500/20 text-xs text-slate-300 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Calon Maba (Budi)</span>
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>

              <button
                onClick={() => onSwitchToSimulationUser('U_ADMIN')}
                className="w-full flex items-center justify-between p-2.5 bg-slate-800/60 hover:bg-slate-800 text-left rounded-xl transition-all border border-slate-850 hover:border-indigo-500/20 text-xs text-slate-300 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Admin Akademik (Ibu Endang)</span>
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>

              <button
                onClick={() => onSwitchToSimulationUser('U_MHS_ACTIVE')}
                className="w-full flex items-center justify-between p-2.5 bg-slate-800/60 hover:bg-slate-800 text-left rounded-xl transition-all border border-slate-850 hover:border-indigo-500/20 text-xs text-slate-300 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Mahasiswa Aktif (Ahmad)</span>
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Form selection */}
        <div className="md:col-span-7 p-8 flex flex-col justify-center">
          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveForm('login')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all px-4 cursor-pointer ${
                activeForm === 'login'
                  ? 'border-indigo-600 text-slate-950'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              Log In Portal
            </button>
            <button
              onClick={() => setActiveForm('register')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all px-4 cursor-pointer ${
                activeForm === 'register'
                  ? 'border-indigo-600 text-slate-950'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              Registrasi Maba Baru
            </button>
          </div>

          {/* FORM: LOGIN */}
          {activeForm === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-form">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Username / NIM / Email
                </label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Contoh: 'admin', 'ahmad', atau NIM '202401012'"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Password
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold cursor-pointer hover:underline">Lupa Password?</span>
                </div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Masuk Akademik
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Kredensial login akademik dilindungi enkripsi. Hubungi Bagian Administrasi Akademik (BAA) jika akun Anda belum aktif atau bermasalah.
              </p>
            </form>
          ) : (
            /* FORM: REGISTER */
            <form onSubmit={handleRegisterSubmit} className="space-y-4" id="register-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">
                    Username Akun
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Contoh: budis"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">
                    Email Kontak
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Contoh: budi@gmail.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                    required
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">
                    Nama Lengkap (Sesuai Ijazah)
                  </label>
                  <input
                    type="text"
                    value={regNama}
                    onChange={(e) => setRegNama(e.target.value)}
                    placeholder="Nama lengkap pendaftar"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    value={regTempatLahir}
                    onChange={(e) => setRegTempatLahir(e.target.value)}
                    placeholder="Kota kelahiran"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={regTanggalLahir}
                    onChange={(e) => setRegTanggalLahir(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Registrasi Calon Mahasiswa Baru
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Dengan mendaftar, Anda menyetujui bahwa data yang diunggah akan divalidasi oleh sistem akademik secara berkala untuk kepentingan penerbitan NIM resmi.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
