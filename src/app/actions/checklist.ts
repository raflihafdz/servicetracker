'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getVehicles() {
  try {
    return await prisma.vehicle.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw new Error('Gagal mengambil data kendaraan.');
  }
}

export async function getChecklists() {
  try {
    return await prisma.checklist.findMany({
      include: {
        vehicle: true,
      },
      orderBy: { date: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching checklists:', error);
    throw new Error('Gagal mengambil data checklist.');
  }
}

export async function getChecklistById(id: string) {
  try {
    return await prisma.checklist.findUnique({
      where: { id },
      include: {
        vehicle: true,
        items: {
          orderBy: { name: 'asc' }, // We can also sort them or match default order
        },
      },
    });
  } catch (error) {
    console.error('Error fetching checklist details:', error);
    throw new Error('Gagal mengambil detail checklist.');
  }
}

interface CreateChecklistInput {
  vehicleId: string;
  date: string;
  status: string;
  notes?: string;
  inspectors: { name: string; signature: string }[];
  items: {
    name: string;
    category: string;
    method: string;
    result: string;
    notes?: string;
  }[];
}

export async function createChecklist(data: CreateChecklistInput) {
  try {
    const checklist = await prisma.checklist.create({
      data: {
        vehicleId: data.vehicleId,
        date: new Date(data.date),
        status: data.status,
        notes: data.notes || '',
        inspectors: data.inspectors,
        items: {
          create: data.items.map((item) => ({
            name: item.name,
            category: item.category,
            method: item.method,
            result: item.result,
            notes: item.notes || '',
          })),
        },
      },
    });

    revalidatePath('/');
    revalidatePath(`/checklists/${checklist.id}`);
    return { success: true, checklistId: checklist.id };
  } catch (error) {
    console.error('Error creating checklist:', error);
    return { success: false, error: 'Gagal membuat checklist kendaraan.' };
  }
}

interface ApproveChecklistInput {
  approvedBy: string;
  approvedNip: string;
  approvedTitle: string;
  approvalSignature: string;
}

export async function approveChecklist(id: string, data: ApproveChecklistInput) {
  try {
    await prisma.checklist.update({
      where: { id },
      data: {
        approved: true,
        approvedBy: data.approvedBy,
        approvedNip: data.approvedNip,
        approvedTitle: data.approvedTitle,
        approvedAt: new Date(),
        approvalSignature: data.approvalSignature,
      },
    });

    revalidatePath('/');
    revalidatePath(`/checklists/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error approving checklist:', error);
    return { success: false, error: 'Gagal menyetujui checklist kendaraan.' };
  }
}

export async function deleteChecklist(id: string) {
  try {
    await prisma.checklist.delete({
      where: { id },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting checklist:', error);
    return { success: false, error: 'Gagal menghapus checklist kendaraan.' };
  }
}
