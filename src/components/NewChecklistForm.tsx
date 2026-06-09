'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Check, 
  Truck, 
  Activity, 
  ShieldAlert, 
  Calendar, 
  User, 
  FileText, 
  AlertCircle,
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { DEFAULT_ITEMS, DefaultChecklistItem } from '@/lib/vehicleItems';
import SignaturePad from './SignaturePad';
import { createChecklist } from '@/app/actions/checklist';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  plateNumber: string | null;
}

interface NewChecklistFormProps {
  vehicles: Vehicle[];
  initialVehicleId?: string;
}

interface ItemState {
  name: string;
  category: 'UMUM' | 'PERLENGKAPAN';
  method: 'TAMPILAN' | 'FUNGSI';
  result: 'BAGUS' | 'KURANG' | 'RUSAK';
  notes: string;
}

export default function NewChecklistForm({ vehicles, initialVehicleId }: NewChecklistFormProps) {
  const router = useRouter();
  
  // State variables
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<ItemState[]>([]);
  const [status, setStatus] = useState<'LULUS' | 'DITAHAN' | 'TIDAK_LULUS'>('LULUS');
  const [notes, setNotes] = useState('');
  
  // Inspectors state (names prefilled from photos)
  const [inspectors, setInspectors] = useState([
    { name: 'FRISKI', signature: '' },
    { name: 'YUSUF', signature: '' },
    { name: 'IRA', signature: '' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set selected vehicle if initialVehicleId is provided
  useEffect(() => {
    if (initialVehicleId) {
      const v = vehicles.find(item => item.id === initialVehicleId);
      if (v) {
        handleVehicleSelect(v);
      }
    }
  }, [initialVehicleId, vehicles]);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    
    // Generate initial checklist items based on vehicle type
    const defaultItems = DEFAULT_ITEMS[vehicle.type] || [];
    const initialItemsState: ItemState[] = defaultItems.map(item => ({
      name: item.name,
      category: item.category,
      method: item.method,
      result: 'BAGUS', // default to Bagus
      notes: ''
    }));
    
    // Set Zulwina as third inspector for SCANIA / D-MAX and IRA for Ziegler / Ambulance (per photos)
    const thirdName = (vehicle.name.includes('SCANIA') || vehicle.name.includes('D-MAX')) ? 'ZULWINA' : 'IRA';
    setInspectors([
      { name: 'FRISKI', signature: '' },
      { name: 'YUSUF', signature: '' },
      { name: `${thirdName}`, signature: '' }
    ]);
    
    setItems(initialItemsState);
    setError(null);
  };

  const handleItemResultChange = (index: number, result: 'BAGUS' | 'KURANG' | 'RUSAK') => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], result };
      
      // Auto-set checklist status to DITAHAN or TIDAK_LULUS if items are rusak/kurang
      const hasRusak = updated.some(i => i.result === 'RUSAK');
      const hasKurang = updated.some(i => i.result === 'KURANG');
      
      if (hasRusak) {
        setStatus('TIDAK_LULUS');
      } else if (hasKurang) {
        setStatus('DITAHAN');
      } else {
        setStatus('LULUS');
      }
      
      return updated;
    });
  };

  const handleItemNotesChange = (index: number, notes: string) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], notes };
      return updated;
    });
  };

  const handleInspectorNameChange = (index: number, name: string) => {
    setInspectors(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name };
      return updated;
    });
  };

  const handleInspectorSignatureChange = (index: number, signature: string) => {
    setInspectors(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], signature };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    // Check if at least one inspector has signed
    const missingSignatures = inspectors.some(ins => !ins.signature);
    if (missingSignatures) {
      setError('Semua pemeriksa (3 orang) harus membubuhkan tanda tangan.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createChecklist({
      vehicleId: selectedVehicle.id,
      date,
      status,
      notes,
      inspectors,
      items
    });

    if (result.success && result.checklistId) {
      router.push(`/checklists/${result.checklistId}`);
    } else {
      setError(result.error || 'Terjadi kesalahan saat menyimpan.');
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'TRUCK':
        return <Truck className="w-12 h-12 text-sky-500" />;
      case 'AMBULANCE':
        return <Activity className="w-12 h-12 text-rose-500" />;
      case 'RIV':
        return <Truck className="w-12 h-12 text-emerald-500 rotate-12" />;
      default:
        return <Truck className="w-12 h-12 text-slate-500" />;
    }
  };

  // Step 1: Select Vehicle
  if (!selectedVehicle) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-sky-50 dark:bg-sky-950 flex items-center justify-center rounded-2xl mb-4">
            <ClipboardList className="w-8 h-8 text-sky-600 dark:text-sky-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Pilih Kendaraan Operasional</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Pilih salah satu kendaraan di bawah ini untuk memulai pengisian checklist rutin harian.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => handleVehicleSelect(v)}
              className="flex items-center p-6 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-lg hover:shadow-sky-500/5 transition-all text-left group"
            >
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl group-hover:scale-110 transition-transform">
                {getVehicleIcon(v.type)}
              </div>
              <div className="ml-5 flex-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                  {v.type}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {v.name}
                </h3>
                {v.plateNumber && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{v.plateNumber}</p>
                )}
              </div>
              <ArrowRight className="w-5 h-5 text-slate-350 dark:text-slate-655 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Split items into UMUM and PERLENGKAPAN for display
  const generalItems = items.filter(i => i.category === 'UMUM');
  const equipItems = items.filter(i => i.category === 'PERLENGKAPAN');

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
      {/* Alert Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-xl flex items-start space-x-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</div>
        </div>
      )}

      {/* Selected Vehicle Info & Date Picker */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl">
            {getVehicleIcon(selectedVehicle.type)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-400 px-2.5 py-0.5 rounded-full">
                {selectedVehicle.type}
              </span>
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="text-xs font-semibold text-red-500 hover:text-red-600"
              >
                (Ubah Kendaraan)
              </button>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {selectedVehicle.name}
            </h2>
          </div>
        </div>

        <div className="w-full md:w-auto flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-600 flex-shrink-0" />
          <div className="flex-1 md:flex-none">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Tanggal Checklist
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-semibold"
            />
          </div>
        </div>
      </div>

      {/* 1. UMUM TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">1. UMUM</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900/30">
              <tr>
                <th scope="col" className="w-12 px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">No</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Item Pengecekan</th>
                <th scope="col" className="w-40 px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Metode</th>
                <th scope="col" className="w-72 px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Hasil Pengecekan</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Keterangan</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
              {generalItems.map((item, idx) => {
                // Find index in main items state array
                const mainIndex = items.findIndex(i => i.name === item.name && i.category === 'UMUM');
                
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <td className="px-4 py-3 text-center text-sm font-mono text-slate-500">{idx + 1}.</td>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white">{item.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.method === 'TAMPILAN' 
                          ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-400' 
                          : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400'
                      }`}>
                        {item.method === 'TAMPILAN' ? 'Tampilan' : 'Fungsi'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <label className={`flex items-center space-x-1 cursor-pointer px-2.5 py-1.5 rounded-lg border text-xs font-bold select-none ${
                          item.result === 'BAGUS' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 text-emerald-700 dark:text-emerald-400' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}>
                          <input
                            type="radio"
                            name={`umum-result-${idx}`}
                            checked={item.result === 'BAGUS'}
                            onChange={() => handleItemResultChange(mainIndex, 'BAGUS')}
                            className="sr-only"
                          />
                          <span>Bagus</span>
                        </label>

                        <label className={`flex items-center space-x-1 cursor-pointer px-2.5 py-1.5 rounded-lg border text-xs font-bold select-none ${
                          item.result === 'KURANG' 
                            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-400 text-amber-700 dark:text-amber-400' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}>
                          <input
                            type="radio"
                            name={`umum-result-${idx}`}
                            checked={item.result === 'KURANG'}
                            onChange={() => handleItemResultChange(mainIndex, 'KURANG')}
                            className="sr-only"
                          />
                          <span>Kurang</span>
                        </label>

                        <label className={`flex items-center space-x-1 cursor-pointer px-2.5 py-1.5 rounded-lg border text-xs font-bold select-none ${
                          item.result === 'RUSAK' 
                            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-400 text-rose-700 dark:text-rose-400' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}>
                          <input
                            type="radio"
                            name={`umum-result-${idx}`}
                            checked={item.result === 'RUSAK'}
                            onChange={() => handleItemResultChange(mainIndex, 'RUSAK')}
                            className="sr-only"
                          />
                          <span>Rusak</span>
                        </label>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => handleItemNotesChange(mainIndex, e.target.value)}
                        placeholder="Catatan..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-transparent"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. PERLENGKAPAN TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">2. PERLENGKAPAN</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900/30">
              <tr>
                <th scope="col" className="w-12 px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">No</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Perlengkapan</th>
                <th scope="col" className="w-40 px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Metode</th>
                <th scope="col" className="w-72 px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Hasil Pengecekan</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Keterangan</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
              {equipItems.map((item, idx) => {
                // Find index in main items state array
                const mainIndex = items.findIndex(i => i.name === item.name && i.category === 'PERLENGKAPAN');
                
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <td className="px-4 py-3 text-center text-sm font-mono text-slate-500">{idx + 1}.</td>
                    <td className="px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white">{item.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
                        Fungsi
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <label className={`flex items-center space-x-1 cursor-pointer px-2.5 py-1.5 rounded-lg border text-xs font-bold select-none ${
                          item.result === 'BAGUS' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 text-emerald-700 dark:text-emerald-400' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}>
                          <input
                            type="radio"
                            name={`perlengkapan-result-${idx}`}
                            checked={item.result === 'BAGUS'}
                            onChange={() => handleItemResultChange(mainIndex, 'BAGUS')}
                            className="sr-only"
                          />
                          <span>Bagus</span>
                        </label>

                        <label className={`flex items-center space-x-1 cursor-pointer px-2.5 py-1.5 rounded-lg border text-xs font-bold select-none ${
                          item.result === 'KURANG' 
                            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-400 text-amber-700 dark:text-amber-400' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}>
                          <input
                            type="radio"
                            name={`perlengkapan-result-${idx}`}
                            checked={item.result === 'KURANG'}
                            onChange={() => handleItemResultChange(mainIndex, 'KURANG')}
                            className="sr-only"
                          />
                          <span>Kurang</span>
                        </label>

                        <label className={`flex items-center space-x-1 cursor-pointer px-2.5 py-1.5 rounded-lg border text-xs font-bold select-none ${
                          item.result === 'RUSAK' 
                            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-400 text-rose-700 dark:text-rose-400' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}>
                          <input
                            type="radio"
                            name={`perlengkapan-result-${idx}`}
                            checked={item.result === 'RUSAK'}
                            onChange={() => handleItemResultChange(mainIndex, 'RUSAK')}
                            className="sr-only"
                          />
                          <span>Rusak</span>
                        </label>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => handleItemNotesChange(mainIndex, e.target.value)}
                        placeholder="Catatan..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-transparent"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. STATUS PENGECEKAN & GENERAL NOTES */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">3. Status Kelayakan Kendaraan</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <label className={`flex items-center p-4 border rounded-xl cursor-pointer ${
            status === 'LULUS' 
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-800 dark:text-emerald-350' 
              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}>
            <input
              type="radio"
              name="status-pengecekan"
              checked={status === 'LULUS'}
              onChange={() => setStatus('LULUS')}
              className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 mr-3"
            />
            <div>
              <span className="block font-bold text-sm">Lulus</span>
              <span className="block text-xs opacity-75 mt-0.5">Kendaraan siap operasional.</span>
            </div>
          </label>

          <label className={`flex items-center p-4 border rounded-xl cursor-pointer ${
            status === 'DITAHAN' 
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-amber-850 dark:text-amber-350' 
              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}>
            <input
              type="radio"
              name="status-pengecekan"
              checked={status === 'DITAHAN'}
              onChange={() => setStatus('DITAHAN')}
              className="w-4 h-4 text-amber-605 border-slate-300 focus:ring-amber-500 mr-3"
            />
            <div>
              <span className="block font-bold text-sm">Ditahan</span>
              <span className="block text-xs opacity-75 mt-0.5">Ada temuan minor, butuh perbaikan.</span>
            </div>
          </label>

          <label className={`flex items-center p-4 border rounded-xl cursor-pointer ${
            status === 'TIDAK_LULUS' 
              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-800 dark:text-rose-350' 
              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}>
            <input
              type="radio"
              name="status-pengecekan"
              checked={status === 'TIDAK_LULUS'}
              onChange={() => setStatus('TIDAK_LULUS')}
              className="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500 mr-3"
            />
            <div>
              <span className="block font-bold text-sm">Tidak Lulus</span>
              <span className="block text-xs opacity-75 mt-0.5">Temuan fatal, dilarang jalan.</span>
            </div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Catatan Tambahan (Keterangan Umum / Temuan Khusus)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Tuliskan temuan atau kerusakan khusus pada kendaraan jika ada..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder-slate-400"
          />
        </div>
      </div>

      {/* DIPERIKSA OLEH (3 INSPECTORS SIGNATURE SECTION) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-sky-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Diperiksa Oleh (Pemeriksa)</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Harap tuliskan nama lengkap dan bubuhkan tanda tangan di pad gambar untuk masing-masing pemeriksa.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {inspectors.map((inspector, idx) => (
            <div key={idx} className="space-y-3 p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                Pemeriksa {idx + 1}
              </label>
              <input
                type="text"
                value={inspector.name}
                onChange={(e) => handleInspectorNameChange(idx, e.target.value.toUpperCase())}
                required
                placeholder="Nama Lengkap..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-semibold uppercase"
              />
              
              <div className="mt-2">
                <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1">
                  Tanda Tangan
                </label>
                <SignaturePad
                  onChange={(sig) => handleInspectorSignatureChange(idx, sig)}
                  height={110}
                  placeholder={`Ttd Pemeriksa ${idx + 1}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SUBMIT BUTTONS */}
      <div className="flex items-center justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-slate-300 dark:border-slate-700 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-lg hover:shadow-sky-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Checklist'}
        </button>
      </div>
    </form>
  );
}
