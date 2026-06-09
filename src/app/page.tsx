import { getChecklists, getVehicles } from '@/app/actions/checklist';
import DashboardClient from '@/components/DashboardClient';
import { Truck } from 'lucide-react';

export const revalidate = 0; // Disable caching so data is always fresh

export default async function Home() {
  const [checklists, vehicles] = await Promise.all([
    getChecklists(),
    getVehicles()
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mini Top Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-sky-600 p-2 rounded-xl text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
                ServiceTracker
              </span>
              <span className="text-xs block text-slate-500 dark:text-slate-400 -mt-1 font-semibold">
                PKP-PK AIRPORT APP
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/45 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-850">
              Raja Haji Abdullah Airport
            </span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Client content */}
      <DashboardClient 
        initialChecklists={checklists as any} 
        vehicles={vehicles} 
      />

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} PKP-PK - Kantor Unit Penyelenggaraan Bandar Udara Kelas III Raja Haji Abdullah.</p>
          <p className="mt-1 font-mono text-[10px] text-slate-400">Digital Vehicle Inspection Checklist System</p>
        </div>
      </footer>
    </div>
  );
}
