export interface DefaultChecklistItem {
  name: string;
  category: 'UMUM' | 'PERLENGKAPAN';
  method: 'TAMPILAN' | 'FUNGSI';
}

export const DEFAULT_ITEMS: Record<string, DefaultChecklistItem[]> = {
  TRUCK: [
    // UMUM
    { name: "Bahan Bakar", category: "UMUM", method: "TAMPILAN" },
    { name: "Oli Mesin", category: "UMUM", method: "TAMPILAN" },
    { name: "Minyak Rem", category: "UMUM", method: "TAMPILAN" },
    { name: "Air Radiator", category: "UMUM", method: "TAMPILAN" },
    { name: "Baterai/Accu", category: "UMUM", method: "TAMPILAN" },
    { name: "Ban dan Roda", category: "UMUM", method: "FUNGSI" },
    { name: "Kaca Spion", category: "UMUM", method: "FUNGSI" },
    { name: "Mesin Menyala", category: "UMUM", method: "FUNGSI" },
    { name: "Rem Kaki", category: "UMUM", method: "FUNGSI" },
    { name: "Rem Tangan", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Utama", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Sign", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Hazard", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Rem", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Mundur", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Rotary", category: "UMUM", method: "FUNGSI" },
    { name: "Klakson", category: "UMUM", method: "FUNGSI" },
    { name: "Sirine", category: "UMUM", method: "FUNGSI" },
    { name: "Wiper", category: "UMUM", method: "FUNGSI" },
    { name: "Radio Komunikasi", category: "UMUM", method: "FUNGSI" },
    { name: "Turret", category: "UMUM", method: "FUNGSI" },
    // PERLENGKAPAN
    { name: "BA SET", category: "PERLENGKAPAN", method: "FUNGSI" },
    { name: "Selang Pemadam", category: "PERLENGKAPAN", method: "FUNGSI" },
    { name: "Hose Reel", category: "PERLENGKAPAN", method: "FUNGSI" },
    { name: "Nozzle", category: "PERLENGKAPAN", method: "FUNGSI" },
    { name: "APD", category: "PERLENGKAPAN", method: "FUNGSI" },
    { name: "Tangga", category: "PERLENGKAPAN", method: "FUNGSI" },
    { name: "Tali", category: "PERLENGKAPAN", method: "FUNGSI" },
    { name: "Chainsaw", category: "PERLENGKAPAN", method: "FUNGSI" }
  ],
  RIV: [
    // UMUM
    { name: "Bahan Bakar", category: "UMUM", method: "TAMPILAN" },
    { name: "Oli Mesin", category: "UMUM", method: "TAMPILAN" },
    { name: "Minyak Rem", category: "UMUM", method: "TAMPILAN" },
    { name: "Air Radiator", category: "UMUM", method: "TAMPILAN" },
    { name: "Baterai/Accu", category: "UMUM", method: "TAMPILAN" },
    { name: "Ban dan Roda", category: "UMUM", method: "FUNGSI" },
    { name: "Kaca Spion", category: "UMUM", method: "FUNGSI" },
    { name: "Mesin Menyala", category: "UMUM", method: "FUNGSI" },
    { name: "Rem Kaki", category: "UMUM", method: "FUNGSI" },
    { name: "Rem Tangan", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Utama", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Sign", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Hazard", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Rem", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Mundur", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Rotary", category: "UMUM", method: "FUNGSI" },
    { name: "Klakson", category: "UMUM", method: "FUNGSI" },
    { name: "Sirine", category: "UMUM", method: "FUNGSI" },
    { name: "Wiper", category: "UMUM", method: "FUNGSI" },
    { name: "Radio Komunikasi", category: "UMUM", method: "FUNGSI" },
    // PERLENGKAPAN
    { name: "Dongkrak", category: "PERLENGKAPAN", method: "FUNGSI" }
  ],
  AMBULANCE: [
    // UMUM
    { name: "Bahan Bakar", category: "UMUM", method: "TAMPILAN" },
    { name: "Oli Mesin", category: "UMUM", method: "TAMPILAN" },
    { name: "Minyak Rem", category: "UMUM", method: "TAMPILAN" },
    { name: "Air Radiator", category: "UMUM", method: "TAMPILAN" },
    { name: "Baterai/Accu", category: "UMUM", method: "TAMPILAN" },
    { name: "Ban dan Roda", category: "UMUM", method: "FUNGSI" },
    { name: "Kaca Spion", category: "UMUM", method: "FUNGSI" },
    { name: "Mesin Menyala", category: "UMUM", method: "FUNGSI" },
    { name: "Rem Kaki", category: "UMUM", method: "FUNGSI" },
    { name: "Rem Tangan", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Utama", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Sign", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Hazard", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Rem", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Mundur", category: "UMUM", method: "FUNGSI" },
    { name: "Lampu Rotary", category: "UMUM", method: "FUNGSI" },
    { name: "Klakson", category: "UMUM", method: "FUNGSI" },
    { name: "Sirine", category: "UMUM", method: "FUNGSI" },
    { name: "Wiper", category: "UMUM", method: "FUNGSI" },
    { name: "Radio Komunikasi", category: "UMUM", method: "FUNGSI" },
    // PERLENGKAPAN
    { name: "Tandu", category: "PERLENGKAPAN", method: "FUNGSI" },
    { name: "Oksigen", category: "PERLENGKAPAN", method: "FUNGSI" },
    { name: "Peralatan P3K", category: "PERLENGKAPAN", method: "FUNGSI" },
    { name: "Dongkrak", category: "PERLENGKAPAN", method: "FUNGSI" }
  ]
};
