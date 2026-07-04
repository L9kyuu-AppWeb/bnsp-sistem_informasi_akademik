import React from 'react';
import { User, Mahasiswa } from '../types';
import { GraduationCap, LogOut, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  mahasiswa: Mahasiswa | undefined;
  onLogout: () => void;
}

export default function Header({ currentUser, mahasiswa, onLogout }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-650 to-indigo-550 text-white rounded-xl shadow-md shadow-indigo-600/10">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 leading-none">
                Sistem Informasi Akademik
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-1">
                Portal Mahasiswa & Kurikulum
              </span>
            </div>
          </div>

          {/* User Info & Logout */}
          {currentUser && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800">
                  {mahasiswa?.nama || currentUser.username}
                </span>
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full mt-0.5 uppercase tracking-wider self-end font-mono">
                  {currentUser.role === 'maba' ? 'Calon Mahasiswa' : currentUser.role}
                </span>
              </div>
              <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-600">
                <UserIcon className="w-4.5 h-4.5" />
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Log Out dari Sistem"
                id="btn-logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
