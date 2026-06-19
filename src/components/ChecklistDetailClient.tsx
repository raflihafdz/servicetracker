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
    return '/foam1.jpeg';
  } else if (nameUpper.includes('ZIEGLER') || nameUpper.includes('HINO') || nameUpper.includes('FOAM TENDER 2')) {
    return '/foam2.jpeg';
  } else if (vehicleType === 'RIV') {
    return '/RIV.jpeg';
  } else if (vehicleType === 'AMBULANCE') {
    return '/Ambulance.jpeg';
  } else if (vehicleType === 'TRUCK') {
    return '/foam1.jpeg'; // fallback
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

  // Trigger Native PDF Generation using html2canvas & jsPDF (multi-page support)
  const exportPDF = async () => {
    const element = document.getElementById('checklist-paper');
    if (!element) return;

    setIsExporting(true);

    try {
      const originalClassName = element.className;
      element.className = 'w-[794px] pdf-bg-white pdf-text-black px-8 py-6 font-sans leading-normal relative';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      });

      element.className = originalClassName;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pageWidthPt  = pdf.internal.pageSize.getWidth();  // 595.28 pt
      const pageHeightPt = pdf.internal.pageSize.getHeight(); // 841.89 pt

      // Always scale-to-fit: shrink (or expand) the entire canvas to fill exactly 1 page
      const canvasAspect = canvas.height / canvas.width;
      const contentHeightPt = pageWidthPt * canvasAspect;

      if (contentHeightPt <= pageHeightPt) {
        // Content fits in one page — place it at the top, leave bottom blank
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidthPt, contentHeightPt);
      } else {
        // Content is taller than one page — scale down to fit height
        const scale = pageHeightPt / contentHeightPt;
        const scaledWidth = pageWidthPt * scale;
        const xOffset = (pageWidthPt - scaledWidth) / 2;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, 0, scaledWidth, pageHeightPt);
      }

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

      {/* PAPER CONTAINER */}
      <div className="flex-1 overflow-x-auto py-8 px-4 flex justify-center">
        <div
          id="checklist-paper"
          className="print-page w-[794px] pdf-bg-white pdf-text-black px-8 py-6 font-sans leading-tight relative border pdf-border-slate-200 shadow-xl"
        >
          {/* TOP HEADER SECTION */}
          <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3">
            <div className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Logo_Kemenhub.png"
                alt="Logo Kemenhub"
                className="w-14 h-14 mr-3 object-contain flex-shrink-0"
              />
              <div>
                <p className="text-[11px] font-bold leading-snug">KEMENTERIAN PERHUBUNGAN</p>
                <p className="text-[10px] font-semibold leading-snug">Direktorat Jenderal Perhubungan Udara</p>
                <h2 className="text-[12px] font-extrabold leading-snug mt-0.5 uppercase">Check List Rutin</h2>
                <h3 className="text-[10.5px] font-bold leading-snug uppercase">Kendaraan Operasional PKP-PK</h3>
                <p className="text-[9.5px] font-semibold leading-snug pdf-text-slate-700">KUPBU Kelas III Raja Haji Abdullah</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              {vehicleImageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={vehicleImageUrl}
                  alt={checklist.vehicle.name}
                  style={{ width: '140px', maxHeight: '80px', objectFit: 'contain', border: '1px solid #cbd5e1', display: 'block' }}
                />
              )}
              <h1 className="text-[12px] font-extrabold tracking-wide mt-1.5 uppercase text-right pdf-text-slate-800">
                {checklist.vehicle.name}
              </h1>
              {checklist.vehicle.plateNumber && (
                <span className="text-[9px] font-mono font-bold pdf-bg-slate-100 pdf-text-slate-800 px-2 py-0.5 mt-0.5 border pdf-border-slate-200">
                  {checklist.vehicle.plateNumber}
                </span>
              )}
            </div>
          </div>

          {/* DATE */}
          <div style={{ textAlign: 'center', margin: '10px 0 12px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 900,
              letterSpacing: '0.08em',
              borderBottom: '2px solid black',
              paddingBottom: '4px',
              display: 'inline-block',
              lineHeight: 1.6,
            }}>
              {formatDateIndonesian(checklist.date)}
            </span>
          </div>

          {/* 1. UMUM TABLE */}
          <div className="mb-3">
            <p className="text-[10px] font-extrabold uppercase mb-1">1. UMUM</p>
            <table className="w-full border-collapse text-[8.5px]" style={{borderSpacing:0}}>
              <colgroup>
                <col style={{width:'22px'}} />
                <col />
                <col style={{width:'46px'}} />
                <col style={{width:'46px'}} />
                <col style={{width:'40px'}} />
                <col style={{width:'40px'}} />
                <col style={{width:'40px'}} />
                <col style={{width:'130px'}} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 700, textAlign: 'center' }}>
                  <th rowSpan={2} style={{ border: '1px solid black', padding: '5px 3px', verticalAlign: 'middle', lineHeight: 1.3 }}>No</th>
                  <th rowSpan={2} style={{ border: '1px solid black', padding: '5px 6px', verticalAlign: 'middle', textAlign: 'left', lineHeight: 1.3 }}>Item Pengecekan</th>
                  <th colSpan={2} style={{ border: '1px solid black', padding: '5px 3px', lineHeight: 1.3 }}>Metode</th>
                  <th colSpan={3} style={{ border: '1px solid black', padding: '5px 3px', lineHeight: 1.3 }}>Hasil Pengecekan</th>
                  <th rowSpan={2} style={{ border: '1px solid black', padding: '5px 6px', verticalAlign: 'middle', textAlign: 'left', lineHeight: 1.3 }}>Keterangan</th>
                </tr>
                <tr style={{ backgroundColor: '#f8fafc', fontWeight: 700, textAlign: 'center' }}>
                  <th style={{ border: '1px solid black', padding: '4px 3px', lineHeight: 1.3 }}>Tampilan</th>
                  <th style={{ border: '1px solid black', padding: '4px 3px', lineHeight: 1.3 }}>Fungsi</th>
                  <th style={{ border: '1px solid black', padding: '4px 3px', lineHeight: 1.3 }}>Bagus</th>
                  <th style={{ border: '1px solid black', padding: '4px 3px', lineHeight: 1.3 }}>Kurang</th>
                  <th style={{ border: '1px solid black', padding: '4px 3px', lineHeight: 1.3 }}>Rusak</th>
                </tr>
              </thead>
              <tbody>
                {generalItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{border:'1px solid black', textAlign:'center', padding:'3px 3px', lineHeight:1.4}}>{idx + 1}.</td>
                    <td style={{border:'1px solid black', padding:'3px 6px', fontWeight:500, lineHeight:1.4}}>{item.name}</td>
                    <td style={{border:'1px solid black', textAlign:'center', padding:'3px 3px', fontWeight:700, color:'#334155', lineHeight:1.4}}>
                      {item.method === 'TAMPILAN' ? '✓' : ''}
                    </td>
                    <td style={{border:'1px solid black', textAlign:'center', padding:'3px 3px', fontWeight:700, color:'#334155', lineHeight:1.4}}>
                      {item.method === 'FUNGSI' ? '✓' : ''}
                    </td>
                    <td style={{border:'1px solid black', textAlign:'center', padding:'3px 3px', fontWeight:800, color:'#16a34a', lineHeight:1.4}}>
                      {item.result === 'BAGUS' ? '✓' : ''}
                    </td>
                    <td style={{border:'1px solid black', textAlign:'center', padding:'3px 3px', fontWeight:800, color:'#d97706', lineHeight:1.4}}>
                      {item.result === 'KURANG' ? '✓' : ''}
                    </td>
                    <td style={{border:'1px solid black', textAlign:'center', padding:'3px 3px', fontWeight:800, color:'#dc2626', lineHeight:1.4}}>
                      {item.result === 'RUSAK' ? '✓' : ''}
                    </td>
                    <td style={{border:'1px solid black', padding:'3px 6px', fontStyle:'italic', color:'#475569', lineHeight:1.4}}>
                      {item.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 2. PERLENGKAPAN TABLE */}
          <div className="mb-3">
            <p className="text-[10px] font-extrabold uppercase mb-1">2. PERLENGKAPAN</p>
            <table className="w-full border-collapse text-[8.5px]" style={{borderSpacing:0}}>
              <colgroup>
                <col style={{width:'22px'}} />
                <col />
                <col style={{width:'46px'}} />
                <col style={{width:'46px'}} />
                <col style={{width:'40px'}} />
                <col style={{width:'40px'}} />
                <col style={{width:'40px'}} />
                <col style={{width:'130px'}} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 700, textAlign: 'center' }}>
                  <th style={{ border: '1px solid black', padding: '5px 3px', lineHeight: 1.3 }}>No</th>
                  <th style={{ border: '1px solid black', padding: '5px 6px', textAlign: 'left', lineHeight: 1.3 }}>Nama Perlengkapan</th>
                  <th style={{ border: '1px solid black', padding: '5px 3px', lineHeight: 1.3 }}>Tampilan</th>
                  <th style={{ border: '1px solid black', padding: '5px 3px', lineHeight: 1.3 }}>Fungsi</th>
                  <th style={{ border: '1px solid black', padding: '5px 3px', lineHeight: 1.3 }}>Bagus</th>
                  <th style={{ border: '1px solid black', padding: '5px 3px', lineHeight: 1.3 }}>Kurang</th>
                  <th style={{ border: '1px solid black', padding: '5px 3px', lineHeight: 1.3 }}>Rusak</th>
                  <th style={{ border: '1px solid black', padding: '5px 6px', textAlign: 'left', lineHeight: 1.3 }}>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {equipItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-black text-center py-2" style={{color:'#94a3b8', fontStyle:'italic'}}>
                      Tidak ada perlengkapan untuk kendaraan ini.
                    </td>
                  </tr>
                ) : (
                  equipItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{border:'1px solid black', textAlign:'center', padding:'3px 3px', lineHeight:1.4}}>{idx + 1}.</td>
                      <td style={{border:'1px solid black', padding:'3px 6px', fontWeight:500, lineHeight:1.4}}>{item.name}</td>
                      <td style={{border:'1px solid black', textAlign:'center', padding:'3px 3px', fontWeight:700, color:'#334155', lineHeight:1.4}}>
                        {item.method === 'TAMPILAN' ? '✓' : ''}
                      </td>
                      <td style={{border:'1px solid black', textAlign:'center', padding:'3px 3px', fontWeight:700, color:'#334155', lineHeight:1.4}}>
                        {item.method === 'FUNGSI' ? '✓' : ''}
                      </td>
                      <td style={{border:'1px solid black', textAlign:'center', padding:'3px 3px', fontWeight:800, color:'#16a34a', lineHeight:1.4}}>
                        {item.result === 'BAGUS' ? '✓' : ''}
                      </td>
                      <td style={{border:'1px solid black', textAlign:'center', padding:'3px 3px', fontWeight:800, color:'#d97706', lineHeight:1.4}}>
                        {item.result === 'KURANG' ? '✓' : ''}
                      </td>
                      <td style={{border:'1px solid black', textAlign:'center', padding:'3px 3px', fontWeight:800, color:'#dc2626', lineHeight:1.4}}>
                        {item.result === 'RUSAK' ? '✓' : ''}
                      </td>
                      <td style={{border:'1px solid black', padding:'3px 6px', fontStyle:'italic', color:'#475569', lineHeight:1.4}}>
                        {item.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 3. STATUS PENGECEKAN */}
          <div className="flex items-center border border-black mb-3 text-[9px]" style={{padding:'5px 8px', gap:'16px'}}>
            <span style={{fontWeight:800, letterSpacing:'0.05em'}}>3. STATUS PENGECEKAN</span>
            <div className="flex items-center" style={{gap:'14px'}}>
              {[
                {label:'Lulus', val:'LULUS', color:'#16a34a'},
                {label:'Ditahan', val:'DITAHAN', color:'#d97706'},
                {label:'Tidak Lulus', val:'TIDAK_LULUS', color:'#dc2626'},
              ].map(({label, val, color}) => (
                <div key={val} className="flex items-center" style={{gap:'5px'}}>
                  <span style={{
                    display:'inline-flex', alignItems:'center', justifyContent:'center',
                    width:'14px', height:'14px', border:'1px solid black',
                    fontWeight:900, fontSize:'10px',
                    color: checklist.status === val ? color : 'transparent',
                    backgroundColor: checklist.status === val ? '#f9fafb' : 'transparent',
                  }}>✓</span>
                  <span style={{fontWeight: checklist.status === val ? 700 : 400}}>{label}</span>
                </div>
              ))}
            </div>
            {checklist.notes && (
              <span style={{borderLeft:'1px solid #cbd5e1', paddingLeft:'10px', fontStyle:'italic', color:'#475569', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                Catatan: {checklist.notes}
              </span>
            )}
          </div>

          {/* SIGNATURES SECTION */}
          <div className="grid grid-cols-2 mt-4" style={{fontSize:'9px'}}>
            {/* LEFT: PEMERIKSA */}
            <div>
            <p style={{fontWeight:700, marginBottom:'6px'}}>Diperiksa Oleh:</p>
              <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                {parsedInspectors.map((inspector, idx) => (
                  <div key={idx} style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <span style={{width:'80px', fontWeight:600}}>{idx + 1}. {inspector.name}</span>
                    <span>:</span>
                    <div style={{width:'90px', height:'28px', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      {inspector.signature ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={inspector.signature} alt={`Ttd ${inspector.name}`} style={{maxHeight:'100%', maxWidth:'100%', objectFit:'contain'}} />
                      ) : (
                        <span style={{fontSize:'7px', color:'#94a3b8', fontStyle:'italic'}}>Belum ttd</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: DISETUJUI */}
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', textAlign:'center'}}>
              <div>
                <p style={{fontWeight:700}}>Disetujui Oleh:</p>
                <p style={{fontWeight:600}}>{checklist.approvedTitle || 'Kepala Unit PKP-PK'}</p>
              </div>
              <div style={{width:'120px', height:'48px', border:'1px dashed #cbd5e1', display:'flex', alignItems:'center', justifyContent:'center', margin:'6px 0'}}>
                {checklist.approved && checklist.approvalSignature ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={checklist.approvalSignature} alt={`Ttd ${checklist.approvedBy}`} style={{maxHeight:'100%', maxWidth:'100%', objectFit:'contain'}} />
                ) : (
                  <div className="no-print" style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                    <span style={{fontSize:'7px', color:'#94a3b8', fontStyle:'italic', marginBottom:'4px'}}>Belum disetujui</span>
                    <button
                      onClick={() => setIsApprovalModalOpen(true)}
                      style={{padding:'1px 6px', background:'#f5f3ff', color:'#7c3aed', border:'1px solid #ddd6fe', fontSize:'7px', fontWeight:700, cursor:'pointer'}}
                    >
                      Beri Approval
                    </button>
                  </div>
                )}
              </div>
              <div>
                <p style={{fontWeight:700, borderBottom:'1px solid black', paddingBottom:'1px', letterSpacing:'0.03em'}}>{checklist.approvedBy || '____________________'}</p>
                {checklist.approvedNip && (
                  <p style={{fontFamily:'monospace', fontSize:'8px', marginTop:'2px'}}>NIP. {checklist.approvedNip}</p>
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
