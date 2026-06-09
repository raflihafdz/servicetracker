import { getChecklistById } from '@/app/actions/checklist';
import ChecklistDetailClient from '@/components/ChecklistDetailClient';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export default async function ChecklistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const checklist = await getChecklistById(id);

  if (!checklist) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Detail Client component handles rendering and exports */}
      <ChecklistDetailClient checklist={checklist as any} />
    </div>
  );
}
