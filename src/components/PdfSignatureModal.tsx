'use client';

import React, { useState, useEffect } from 'react';
import {
  IconFileText,
  IconUser,
  IconCrown,
  IconX,
  IconPrinter,
  IconCheck,
  IconSignature
} from '@tabler/icons-react';

interface PdfSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (staffName: string, ownerName: string) => void;
  defaultStaffName?: string;
  defaultOwnerName?: string;
  businessName?: string;
}

export default function PdfSignatureModal({
  isOpen,
  onClose,
  onConfirm,
  defaultStaffName = '',
  defaultOwnerName = '',
  businessName = 'Usaha Anda'
}: PdfSignatureModalProps) {
  const [staffName, setStaffName] = useState(defaultStaffName || 'Staff Administrasi');
  const [ownerName, setOwnerName] = useState(defaultOwnerName || businessName);

  // Auto-sync defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultStaffName) {
        setStaffName(defaultStaffName);
      } else {
        try {
          const raw = localStorage.getItem('user');
          if (raw) {
            const u = JSON.parse(raw);
            if (u.name) setStaffName(u.name);
          }
        } catch {}
      }

      if (defaultOwnerName) {
        setOwnerName(defaultOwnerName);
      } else {
        setOwnerName(businessName || 'Pemilik Usaha');
      }
    }
  }, [isOpen, defaultStaffName, defaultOwnerName, businessName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStaff = staffName.trim() || 'Staff Administrasi';
    const finalOwner = ownerName.trim() || businessName || 'Pemilik Usaha';
    onConfirm(finalStaff, finalOwner);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in font-jakarta">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-200/90 transform transition-all animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <IconSignature className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 leading-tight">
                Tanda Tangan Laporan PDF
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Isi nama penanggung jawab untuk dicantumkan pada kolom tanda tangan resmi
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input 1: Nama Staff */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Nama Staf (Disiapkan Oleh) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <IconUser className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                required
                placeholder="Contoh: Budi Santoso (Staff Keuangan)"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Nama orang/staf yang membuat dan menyusun rekap pembukuan ini.
            </p>
          </div>

          {/* Input 2: Nama Owner */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Nama Owner / Pemilik Usaha (Disetujui Oleh) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <IconCrown className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                placeholder={`Contoh: H. Ahmad / Owner ${businessName}`}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Nama pemilik usaha / manajer yang menyetujui laporan akhir.
            </p>
          </div>

          {/* Live Preview Box */}
          <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-4 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-2.5">
              Pratinjau Kolom Tanda Tangan di PDF:
            </span>
            <div className="grid grid-cols-2 gap-4 text-center bg-white p-3.5 rounded-xl border border-zinc-200/70 shadow-2xs">
              <div className="border-r border-zinc-100 pr-2">
                <span className="text-[11px] text-zinc-400 block mb-5">Disiapkan Oleh,</span>
                <span className="font-bold text-zinc-900 text-xs block underline decoration-zinc-300 underline-offset-4">
                  {staffName || 'Staff Administrasi'}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-1">Staff Administrasi</span>
              </div>
              <div className="pl-2">
                <span className="text-[11px] text-zinc-400 block mb-5">Disetujui Oleh,</span>
                <span className="font-bold text-zinc-900 text-xs block underline decoration-zinc-300 underline-offset-4">
                  {ownerName || businessName}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-1">Pemilik Usaha ({businessName})</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              <IconPrinter className="w-4 h-4" />
              <span>Cetak & Unduh Dokumen PDF</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

