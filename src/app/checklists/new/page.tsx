import { getVehicles } from '@/app/actions/checklist';
import NewChecklistForm from '@/components/NewChecklistForm';
import Link from 'next/link';
import { ArrowLeft, Truck } from 'lucide-react';

export const revalidate = 0;

export default async function NewChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleId?: string }>;
}) {
  const vehicles = await getVehicles();
  const { vehicleId } = await searchParams;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link 
              href="/"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="bg-sky-600 p-1.5 rounded-lg text-white">
                <Truck className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-md tracking-tight text-slate-900 dark:text-white">
                Checklist Baru
              </span>
            </div>
          </div>
          
          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Raja Haji Abdullah Airport
          </div>
        </div>
      </header>

      {/* Checklist Form Client */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <NewChecklistForm vehicles={vehicles} initialVehicleId={vehicleId} />
      </main>
    </div>
  );
}
