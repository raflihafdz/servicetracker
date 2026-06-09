'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Trash2, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Truck, 
  Activity, 
  ShieldCheck, 
  ShieldAlert,
  Calendar,
  User,
  Filter
} from 'lucide-react';
import { deleteChecklist } from '@/app/actions/checklist';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  plateNumber: string | null;
}

interface Checklist {
  id: string;
  vehicleId: string;
  date: Date;
  status: string;
  approved: boolean;
  approvedBy: string;
  inspectors: any; // JSON array of { name, signature }
  vehicle: Vehicle;
}

interface DashboardClientProps {
  initialChecklists: Checklist[];
  vehicles: Vehicle[];
}

export default function DashboardClient({ initialChecklists, vehicles }: DashboardClientProps) {
  const [checklists, setChecklists] = useState<Checklist[]>(initialChecklists);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter checklists
  const filteredChecklists = checklists.filter(item => {
    const matchesSearch = item.vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.approvedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || item.vehicle.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus checklist ini? Tindakan ini tidak dapat dibatalkan.')) return;
    
    setDeletingId(id);
    const result = await deleteChecklist(id);
    if (result.success) {
      setChecklists(prev => prev.filter(c => c.id !== id));
    } else {
      alert(result.error);
    }
    setDeletingId(null);
  };

  // Stats calculation
  const totalCount = checklists.length;
  const approvedCount = checklists.filter(c => c.approved).length;
  const pendingCount = totalCount - approvedCount;
  
  const lulusCount = checklists.filter(c => c.status === 'LULUS').length;
  const ditahanCount = checklists.filter(c => c.status === 'DITAHAN').length;
  const tidakLulusCount = checklists.filter(c => c.status === 'TIDAK_LULUS').length;

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

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'TRUCK':
        return <Truck className="w-8 h-8 text-sky-500" />;
      case 'AMBULANCE':
        return <Activity className="w-8 h-8 text-rose-500" />;
      case 'RIV':
        return <Truck className="w-8 h-8 text-emerald-500 rotate-12" />; // A styling variant
      default:
        return <Truck className="w-8 h-8 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Sistem Checklist Rutin Kendaraan
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Kantor Unit Penyelenggaraan Bandar Udara Kelas III Raja Haji Abdullah
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Link
            href="/checklists/new"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-lg hover:shadow-sky-500/20 transition-all duration-150 transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 mr-2" />
            Checklist Baru
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Checklist Card */}
        <div className="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-sky-100 dark:bg-sky-950 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Checklist
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {totalCount}
              </h3>
            </div>
          </div>
        </div>

        {/* Lulus status card */}
        <div className="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-emerald-100 dark:bg-emerald-950 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status Lulus
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {lulusCount}
              </h3>
            </div>
          </div>
        </div>

        {/* Ditahan status card */}
        <div className="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-amber-100 dark:bg-amber-950 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status Ditahan / Rusak
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {ditahanCount + tidakLulusCount}
              </h3>
            </div>
          </div>
        </div>

        {/* Approval Card */}
        <div className="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-950 p-3 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Sudah Disetujui
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {approvedCount} <span className="text-xs font-normal text-slate-500">/ {totalCount}</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Cards Grid */}
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
        <Truck className="w-5 h-5 mr-2 text-sky-500" />
        Daftar Kendaraan Operasional
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {vehicles.map((v) => {
          const vehicleChecklists = checklists.filter(c => c.vehicleId === v.id);
          const lastChecklist = vehicleChecklists[0];
          
          return (
            <div 
              key={v.id}
              className="bg-white dark:bg-slate-800 shadow rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-sky-400 dark:hover:border-sky-500 transition-all duration-200 group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl group-hover:scale-110 transition-transform duration-200">
                    {getVehicleIcon(v.type)}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-300">
                    {v.type}
                  </span>
                </div>
                
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                  {v.name}
                </h3>
                {v.plateNumber && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {v.plateNumber}
                  </p>
                )}
                
                <div className="mt-4 border-t border-slate-100 dark:border-slate-900 pt-3 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Total Inspeksi:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{vehicleChecklists.length}</span>
                </div>

                {lastChecklist && (
                  <div className="mt-2 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Inspeksi Terakhir:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {new Date(lastChecklist.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-t border-slate-100 dark:border-slate-800/80">
                <Link
                  href={`/checklists/new?vehicleId=${v.id}`}
                  className="text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center justify-center w-full"
                >
                  Mulai Inspeksi
                  <Plus className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* History Checklist Section */}
      <div className="bg-white dark:bg-slate-800 shadow rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Riwayat Checklist Kendaraan
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" />
              <input
                type="text"
                placeholder="Cari kendaraan atau pemeriksa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 w-full sm:w-64"
              />
            </div>

            {/* Filter Status */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-900 dark:text-white appearance-none cursor-pointer w-full"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="LULUS">Lulus</option>
                  <option value="DITAHAN">Ditahan</option>
                  <option value="TIDAK_LULUS">Tidak Lulus</option>
                </select>
                <Filter className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Filter Type */}
              <div className="relative flex-1">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-900 dark:text-white appearance-none cursor-pointer w-full"
                >
                  <option value="ALL">Semua Jenis</option>
                  <option value="TRUCK">Truck</option>
                  <option value="RIV">RIV</option>
                  <option value="AMBULANCE">Ambulance</option>
                </select>
                <Filter className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredChecklists.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="font-semibold text-lg">Tidak ada riwayat checklist</p>
            <p className="text-sm mt-1">Silakan buat checklist baru terlebih dahulu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tanggal Inspeksi
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Nama Kendaraan
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Jenis
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Pemeriksa
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Persetujuan
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                {filteredChecklists.map((c) => {
                  let parsedInspectors: { name: string }[] = [];
                  try {
                    parsedInspectors = typeof c.inspectors === 'string' 
                      ? JSON.parse(c.inspectors) 
                      : (c.inspectors as any) || [];
                  } catch (e) {
                    parsedInspectors = [];
                  }

                  const inspectorNames = parsedInspectors.map(i => i.name).join(', ');

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                        <span className="font-mono">{formatDateIndonesian(c.date)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">
                        {c.vehicle.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-300">
                          {c.vehicle.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5" title={inspectorNames}>
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[180px]">{inspectorNames || 'Tidak ada'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {c.status === 'LULUS' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/35 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                            <CheckCircle className="w-3 h-3" />
                            Lulus
                          </span>
                        ) : c.status === 'DITAHAN' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/35 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                            <AlertTriangle className="w-3 h-3" />
                            Ditahan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/35 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                            <XCircle className="w-3 h-3" />
                            Tidak Lulus
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {c.approved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/35 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50">
                            <ShieldCheck className="w-3 h-3" />
                            Disetujui
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                            <Clock className="w-3 h-3" />
                            Menunggu Approval
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/checklists/${c.id}`}
                            className="p-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
                            title="Lihat Detail & Ekspor"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            className="p-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors border border-slate-200 dark:border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Hapus Checklist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
