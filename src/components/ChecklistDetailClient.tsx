'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Printer, 
  ShieldCheck, 
  AlertCircle,
  FileDown
} from 'lucide-react';
import { approveChecklist } from '@/app/actions/checklist';
import SignaturePad from './SignaturePad';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { DEFAULT_ITEMS } from '@/lib/vehicleItems';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  plateNumber: string | null;
}

interface ChecklistItem {
  id: string;
  name: string;
  category: string;
  method: string;
  result: string;
  notes: string | null;
}

interface Checklist {
  id: string;
  vehicleId: string;
  date: Date;
  status: string;
  notes: string | null;
  inspectors: any; // string or array
  approved: boolean;
  approvedBy: string;
  approvedNip: string;
  approvedTitle: string;
  approvedAt: Date | null;
  approvalSignature: string | null;
  vehicle: Vehicle;
  items: ChecklistItem[];
}

interface ChecklistDetailClientProps {
  checklist: Checklist;
}

// Helper to determine the vehicle photo based on its seeded name & type
const getVehicleImage = (vehicleName: string, vehicleType: string) => {
  const nameUpper = vehicleName.toUpperCase();
  if (nameUpper.includes('SCANIA') || nameUpper.includes('FOAM TENDER 1')) {
    return '/Truck Foam 1.jpeg';
  } else if (nameUpper.includes('ZIEGLER') || nameUpper.includes('HINO') || nameUpper.includes('FOAM TENDER 2')) {
    return '/Truck Foam 2.jpeg';
  } else if (vehicleType === 'RIV') {
    return '/RIV.jpeg';
  } else if (vehicleType === 'AMBULANCE') {
    return '/Ambulance.jpeg';
  } else if (vehicleType === 'TRUCK') {
    return '/Truck Foam 1.jpeg'; // fallback
  }
  return null;
};

export default function ChecklistDetailClient({ checklist }: ChecklistDetailClientProps) {
  const router = useRouter();
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Approval Form State
  const [approvedBy, setApprovedBy] = useState('HERRY PANGESTUADI');
  const [approvedNip, setApprovedNip] = useState('198805262010121004');
  const [approvedTitle, setApprovedTitle] = useState(
    checklist.vehicle.name.includes('SCANIA') ? 'Koordinator Unit PKP-PK' : 'Kepala Unit PKP-PK'
  );
  const [approvalSignature, setApprovalSignature] = useState('');
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  // Format Date (e.g. JUMAT, 03 APRIL 2026)
  const formatDateIndonesian = (dateVal: Date | string) => {
    const d = new Date(dateVal);
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const months = [
      'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
    ];
    
    const dayName = days[d.getDay()];
    const dateNum = String(d.getDate()).padStart(2, '0');
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    
    return `${dayName}, ${dateNum} ${monthName} ${year}`;
  };

  // Parsing inspectors from database
  let parsedInspectors: { name: string; signature: string }[] = [];
  try {
    parsedInspectors = typeof checklist.inspectors === 'string'
      ? JSON.parse(checklist.inspectors)
      : (checklist.inspectors as any) || [];
  } catch (e) {
    parsedInspectors = [];
  }

  // Get the default items for this vehicle type to use as sorting key
  const defaultItemsList = DEFAULT_ITEMS[checklist.vehicle.type] || [];
  
  // Sort function based on the index in DEFAULT_ITEMS
  const getSortIndex = (itemName: string, category: string) => {
    const idx = defaultItemsList.findIndex(
      (item) => item.name === itemName && item.category === category
    );
    return idx === -1 ? 999 : idx;
  };

  // Sort the items before filtering/displaying to preserve the exact physical template structure
  const sortedItems = [...checklist.items].sort((a, b) => {
    return getSortIndex(a.name, a.category) - getSortIndex(b.name, b.category);
  });

  // Split items into UMUM and PERLENGKAPAN
  const generalItems = sortedItems.filter(i => i.category === 'UMUM');
  const equipItems = sortedItems.filter(i => i.category === 'PERLENGKAPAN');

  // Trigger Approval Submit
  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalSignature) {
      setApprovalError('Tanda tangan diperlukan.');
      return;
    }

    setIsApproving(true);
    setApprovalError(null);

    const res = await approveChecklist(checklist.id, {
      approvedBy,
      approvedNip,
      approvedTitle,
      approvalSignature
    });

    if (res.success) {
      setIsApprovalModalOpen(false);
      router.refresh();
    } else {
      setApprovalError(res.error || 'Gagal menyimpan persetujuan.');
      setIsApproving(false);
    }
  };

  // Trigger Native PDF Generation using html2canvas & jsPDF
  const exportPDF = async () => {
    const element = document.getElementById('checklist-paper');
    if (!element) return;

    setIsExporting(true);

    try {
      // Temporarily remove shadow and border class for clean canvas render
      const originalClassName = element.className;
      element.className = "w-[794px] pdf-bg-white pdf-text-black p-8 font-sans leading-tight relative";

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution scale
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Restore class name
      element.className = originalClassName;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      // A4 dimensions in pixels at 96 DPI: 595 x 842. Since our container is 794px wide, let's fit it.
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const fileDate = new Date(checklist.date).toISOString().split('T')[0];
      const fileName = `checklist_${checklist.vehicle.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${fileDate}.pdf`;
      
      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Gagal mendownload PDF. Silakan coba Cetak manual (Ctrl+P).');
    } finally {
      setIsExporting(false);
    }
  };

  const vehicleImageUrl = getVehicleImage(checklist.vehicle.name, checklist.vehicle.type);

  return (
    <>
      {/* LOCAL STYLES FOR THE PDF CONTAINER TO AVOID TAILWIND V4 OKLCH/LAB COLOR PARSING ERRORS */}
      <style dangerouslySetInnerHTML={{__html: `
        .pdf-bg-white { background-color: #ffffff !important; }
        .pdf-text-black { color: #000000 !important; }
        .pdf-text-slate-400 { color: #94a3b8 !important; }
        .pdf-text-slate-500 { color: #64748b !important; }
        .pdf-text-slate-600 { color: #475569 !important; }
        .pdf-text-slate-700 { color: #334155 !important; }
        .pdf-text-slate-800 { color: #1e293b !important; }
        .pdf-bg-slate-50 { background-color: #f8fafc !important; }
        .pdf-bg-slate-100 { background-color: #f1f5f9 !important; }
        .pdf-border-slate-100 { border-color: #f1f5f9 !important; }
        .pdf-border-slate-200 { border-color: #e2e8f0 !important; }
        .pdf-border-slate-300 { border-color: #cbd5e1 !important; }
        
        .pdf-bg-emerald-50 { background-color: #ecfdf5 !important; }
        .pdf-text-emerald-600 { color: #059669 !important; }
        .pdf-text-emerald-700 { color: #047857 !important; }
        
        .pdf-bg-amber-50 { background-color: #fffbeb !important; }
        .pdf-text-amber-600 { color: #d97706 !important; }
        .pdf-text-amber-700 { color: #b45309 !important; }
        
        .pdf-bg-rose-50 { background-color: #fff1f2 !important; }
        .pdf-text-rose-600 { color: #e11d48 !important; }
        .pdf-text-rose-700 { color: #be123c !important; }
      `}} />

      {/* Non-Printable Floating Action Bar */}
      <div className="no-print bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Kembali
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {/* Approval Button for Unit Head */}
            {!checklist.approved && (
              <button
                onClick={() => setIsApprovalModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold rounded-lg text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 transition-colors shadow-md"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                Approve & Ttd
              </button>
            )}

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Cetak
            </button>

            {/* PDF Export Button */}
            <button
              onClick={exportPDF}
              disabled={isExporting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold rounded-lg text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50 transition-colors shadow-md shadow-sky-500/10"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5" />
              {isExporting ? 'Memproses...' : 'Unduh PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* PAPER CONTAINER (This corresponds precisely to the physical paper layouts) */}
      <div className="flex-1 overflow-x-auto py-8 px-4 flex justify-center">
        <div 
          id="checklist-paper"
          className="print-page w-[794px] min-h-[1123px] pdf-bg-white pdf-text-black p-8 font-sans leading-normal relative border pdf-border-slate-200 shadow-xl"
          style={{ contentVisibility: 'auto' }}
        >
          {/* TOP HEADER SECTION */}
          <div className="flex items-start justify-between border-b-2 border-black pb-4 mb-4">
            <div className="flex items-center">
              {/* Official Kemenhub Logo Image from Public folder */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/Logo_Kemenhub.png" 
                alt="Logo Kemenhub" 
                className="w-16 h-16 mr-3 object-contain"
              />
              <div>
                <h2 className="text-[12px] font-bold tracking-wide leading-tight">Check List Rutin</h2>
                <h3 className="text-[11px] font-bold leading-tight uppercase">Kendaraan Operasional PKP-PK</h3>
                <h4 className="text-[10px] font-semibold leading-tight">Kantor Unit Penyelenggaraan Bandar Udara</h4>
                <p className="text-[10px] font-semibold leading-tight pdf-text-slate-700">Kelas III Raja Haji Abdullah</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              {/* Official Vehicle Image from Public folder */}
              {vehicleImageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={vehicleImageUrl} 
                  alt={checklist.vehicle.name} 
                  className="w-32 h-16 object-cover border pdf-border-slate-300"
                />
              )}
              <h1 className="text-[13px] font-extrabold tracking-wider mt-2 uppercase text-slate-800 text-right pdf-text-slate-800">
                {checklist.vehicle.name}
              </h1>
              {checklist.vehicle.plateNumber && (
                <span className="text-[9px] font-mono font-bold pdf-bg-slate-100 pdf-text-slate-800 px-2 py-0.5 rounded mt-0.5 border pdf-border-slate-200">
                  {checklist.vehicle.plateNumber}
                </span>
              )}
            </div>
          </div>

          {/* DATE SECTION */}
          <div className="text-center my-4">
            <span className="text-[12px] font-black tracking-widest border-b border-black pb-0.5">
              {formatDateIndonesian(checklist.date)}
            </span>
          </div>

          {/* 1. UMUM TABLE */}
          <div className="mb-4">
            <h4 className="text-[11px] font-extrabold uppercase mb-1 flex items-center">
              1. UMUM
            </h4>
            <table className="w-full border-collapse border border-black text-[9.5px]">
              <thead>
                <tr className="pdf-bg-slate-100 text-center font-bold">
                  <th rowSpan={2} className="border border-black px-1.5 py-1 w-6">No</th>
                  <th rowSpan={2} className="border border-black px-3 py-1 text-left">Item Pengecekan</th>
                  <th colSpan={2} className="border border-black px-2 py-0.5">Metode Pengecekan</th>
                  <th colSpan={3} className="border border-black px-2 py-0.5">Hasil Pengecekan</th>
                  <th rowSpan={2} className="border border-black px-3 py-1 text-left w-48">Keterangan</th>
                </tr>
                <tr className="pdf-bg-slate-50 text-center font-bold">
                  <th className="border border-black px-1.5 py-0.5 w-16">Tampilan</th>
                  <th className="border border-black px-1.5 py-0.5 w-16">Fungsi</th>
                  <th className="border border-black px-1.5 py-0.5 w-12">Bagus</th>
                  <th className="border border-black px-1.5 py-0.5 w-12">kurang</th>
                  <th className="border border-black px-1.5 py-0.5 w-12">Rusak</th>
                </tr>
              </thead>
              <tbody>
                {generalItems.map((item, idx) => (
                  <tr key={item.id} className="hover:pdf-bg-slate-50">
                    <td className="border border-black text-center py-0.5">{idx + 1}.</td>
                    <td className="border border-black px-3 py-0.5 font-medium">{item.name}</td>
                    <td className="border border-black text-center py-0.5 text-[11px] font-bold pdf-text-slate-700">
                      {item.method === 'TAMPILAN' ? '✓' : ''}
                    </td>
                    <td className="border border-black text-center py-0.5 text-[11px] font-bold pdf-text-slate-700">
                      {item.method === 'FUNGSI' ? '✓' : ''}
                    </td>
                    <td className="border border-black text-center py-0.5 text-[11px] font-black pdf-text-emerald-600">
                      {item.result === 'BAGUS' ? '✓' : ''}
                    </td>
                    <td className="border border-black text-center py-0.5 text-[11px] font-black pdf-text-amber-600">
                      {item.result === 'KURANG' ? '✓' : ''}
                    </td>
                    <td className="border border-black text-center py-0.5 text-[11px] font-black pdf-text-rose-600">
                      {item.result === 'RUSAK' ? '✓' : ''}
                    </td>
                    <td className="border border-black px-3 py-0.5 italic pdf-text-slate-600 truncate max-w-xs">
                      {item.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 2. PERLENGKAPAN TABLE */}
          <div className="mb-5">
            <h4 className="text-[11px] font-extrabold uppercase mb-1">
              2. PERLENGKAPAN
            </h4>
            <table className="w-full border-collapse border border-black text-[9.5px]">
              <thead>
                <tr className="pdf-bg-slate-100 text-center font-bold">
                  <th className="border border-black px-1.5 py-1 w-6">No</th>
                  <th className="border border-black px-3 py-1 text-left">Nama Perlengkapan</th>
                  <th className="border border-black px-1.5 py-1 w-16">Tampilan</th>
                  <th className="border border-black px-1.5 py-1 w-16">Fungsi</th>
                  <th className="border border-black px-1.5 py-1 w-12">Bagus</th>
                  <th className="border border-black px-1.5 py-1 w-12">kurang</th>
                  <th className="border border-black px-1.5 py-1 w-12">Rusak</th>
                  <th className="border border-black px-3 py-1 text-left w-48">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {equipItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-black text-center py-2 pdf-text-slate-400 italic">
                      Tidak ada perlengkapan yang perlu dichecklist untuk jenis kendaraan ini.
                    </td>
                  </tr>
                ) : (
                  equipItems.map((item, idx) => (
                    <tr key={item.id} className="hover:pdf-bg-slate-50">
                      <td className="border border-black text-center py-0.5">{idx + 1}.</td>
                      <td className="border border-black px-3 py-0.5 font-medium">{item.name}</td>
                      <td className="border border-black text-center py-0.5 text-[11px] font-bold pdf-text-slate-700">
                        {item.method === 'TAMPILAN' ? '✓' : ''}
                      </td>
                      <td className="border border-black text-center py-0.5 text-[11px] font-bold pdf-text-slate-700">
                        {item.method === 'FUNGSI' ? '✓' : ''}
                      </td>
                      <td className="border border-black text-center py-0.5 text-[11px] font-black pdf-text-emerald-600">
                        {item.result === 'BAGUS' ? '✓' : ''}
                      </td>
                      <td className="border border-black text-center py-0.5 text-[11px] font-black pdf-text-amber-600">
                        {item.result === 'KURANG' ? '✓' : ''}
                      </td>
                      <td className="border border-black text-center py-0.5 text-[11px] font-black pdf-text-rose-600">
                        {item.result === 'RUSAK' ? '✓' : ''}
                      </td>
                      <td className="border border-black px-3 py-0.5 italic pdf-text-slate-600 truncate max-w-xs">
                        {item.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 3. STATUS PENGECEKAN */}
          <div className="flex items-center space-x-6 border border-black p-2 mb-6 text-[10px]">
            <span className="font-extrabold uppercase">3. Status Pengecekan</span>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className={`inline-flex items-center justify-center w-4 h-4 border border-black mr-2 font-black ${
                  checklist.status === 'LULUS' ? 'pdf-bg-emerald-50 pdf-text-emerald-700' : ''
                }`}>
                  {checklist.status === 'LULUS' ? '✓' : ''}
                </span>
                <span className={checklist.status === 'LULUS' ? 'font-bold' : ''}>Lulus</span>
              </div>

              <div className="flex items-center">
                <span className={`inline-flex items-center justify-center w-4 h-4 border border-black mr-2 font-black ${
                  checklist.status === 'DITAHAN' ? 'pdf-bg-amber-50 pdf-text-amber-700' : ''
                }`}>
                  {checklist.status === 'DITAHAN' ? '✓' : ''}
                </span>
                <span className={checklist.status === 'DITAHAN' ? 'font-bold' : ''}>Ditahan</span>
              </div>

              <div className="flex items-center">
                <span className={`inline-flex items-center justify-center w-4 h-4 border border-black mr-2 font-black ${
                  checklist.status === 'TIDAK_LULUS' ? 'pdf-bg-rose-50 pdf-text-rose-700' : ''
                }`}>
                  {checklist.status === 'TIDAK_LULUS' ? '✓' : ''}
                </span>
                <span className={checklist.status === 'TIDAK_LULUS' ? 'font-bold' : ''}>Tidak Lulus</span>
              </div>
            </div>

            {checklist.notes && (
              <div className="flex-1 border-l pdf-border-slate-300 pl-4 italic pdf-text-slate-600 truncate">
                Catatan: {checklist.notes}
              </div>
            )}
          </div>

          {/* SIGNATURES SECTION */}
          <div className="grid grid-cols-2 mt-4 text-[9.5px]">
            {/* LEFT SIDE: PEMERIKSA (INSPECTORS) */}
            <div className="flex flex-col">
              <span className="font-bold mb-2">Diperiksa Oleh:</span>
              
              <div className="space-y-4">
                {parsedInspectors.map((inspector, idx) => (
                  <div key={idx} className="flex items-center space-x-4">
                    <span className="w-16 font-semibold">{idx + 1}. {inspector.name}</span>
                    <span className="w-3 text-center">:</span>
                    <div className="w-24 h-8 relative border pdf-border-slate-100 flex items-center justify-center">
                      {inspector.signature ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={inspector.signature} 
                          alt={`Ttd ${inspector.name}`} 
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[7px] pdf-text-slate-400 italic">Belum ttd</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT SIDE: DISETUJUI OLEH (APPROVAL) */}
            <div className="flex flex-col items-center justify-between text-center pl-10">
              <div className="flex flex-col items-center">
                <span className="font-bold">Disetujui Oleh:</span>
                <span className="font-semibold">{checklist.approvedTitle}</span>
              </div>
              
              <div className="w-36 h-16 relative border border-dashed pdf-border-slate-200 dark:border-transparent flex items-center justify-center my-2">
                {checklist.approved && checklist.approvalSignature ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img 
                    src={checklist.approvalSignature} 
                    alt={`Ttd ${checklist.approvedBy}`} 
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="no-print flex flex-col items-center">
                    <span className="text-[8px] pdf-text-slate-400 italic mb-1.5">Belum disetujui</span>
                    <button
                      onClick={() => setIsApprovalModalOpen(true)}
                      className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded text-[8px] font-bold"
                    >
                      Beri Approval
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center">
                <span className="font-bold border-b border-black px-4 uppercase">{checklist.approvedBy}</span>
                {checklist.approvedNip && (
                  <span className="font-mono text-[8.5px] mt-0.5">NIP. {checklist.approvedNip}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* APPROVAL MODAL (NON-PRINTABLE) */}
      {isApprovalModalOpen && (
        <div className="no-print fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2.5 text-purple-650 dark:text-purple-400 mb-4">
              <ShieldCheck className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Persetujuan & Tanda Tangan</h3>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Silakan periksa kembali detail checklist sebelum menandatangani persetujuan ini sebagai Kepala/Koordinator Unit PKP-PK.
            </p>

            {approvalError && (
              <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-3 mb-4 rounded flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-red-700 dark:text-red-400">{approvalError}</span>
              </div>
            )}

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Nama Kepala/Koordinator Unit
                </label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-305 dark:border-slate-705 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  NIP
                </label>
                <input
                  type="text"
                  value={approvedNip}
                  onChange={(e) => setApprovedNip(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-305 dark:border-slate-705 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Jabatan
                </label>
                <input
                  type="text"
                  value={approvedTitle}
                  onChange={(e) => setApprovedTitle(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-305 dark:border-slate-705 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Tanda Tangan Kepala Unit
                </label>
                <SignaturePad
                  onChange={setApprovalSignature}
                  height={120}
                  placeholder="Gambarkan tanda tangan di sini"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isApproving}
                  className="px-5 py-2 border border-transparent text-xs font-bold rounded-lg text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 shadow-md disabled:opacity-50"
                >
                  {isApproving ? 'Menyimpan...' : 'Simpan & Setujui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
