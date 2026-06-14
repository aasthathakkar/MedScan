export const MEDICINES = [
  {
    id: 'm1',
    name: 'Paracetamol',
    aka: ['Calpol', 'Dolo 650', 'Crocin'],
    treats: ['Fever', 'Headache', 'Muscle pain', 'Toothache'],
    side_effects: ['Nausea', 'Rash', 'Liver strain (high dose)'],
    warnings: [
      'Do not exceed 4g per day',
      'Avoid alcohol while taking this medicine',
      'Consult doctor if fever persists beyond 3 days',
    ],
    interactions: ['Warfarin', 'Alcohol'],
    min_age: null,
  },
  {
    id: 'm2',
    name: 'Ibuprofen',
    aka: ['Brufen', 'Combiflam', 'Advil'],
    treats: ['Fever', 'Pain', 'Inflammation', 'Arthritis', 'Menstrual cramps'],
    side_effects: ['Stomach upset', 'Nausea', 'Dizziness', 'Heartburn'],
    warnings: [
      'Take with food to reduce stomach irritation',
      'Avoid if you have kidney problems',
      'Not recommended for heart patients',
    ],
    interactions: ['Aspirin', 'Blood thinners', 'Lithium'],
    min_age: 6,
  },
  {
    id: 'm3',
    name: 'Cetirizine',
    aka: ['Zyrtec', 'Cetzine', 'Alerid'],
    treats: ['Allergy', 'Hay fever', 'Hives', 'Runny nose', 'Itchy eyes'],
    side_effects: ['Drowsiness', 'Dry mouth', 'Fatigue'],
    warnings: ['May cause drowsiness — avoid driving', 'Avoid alcohol'],
    interactions: ['Alcohol', 'Sedatives'],
    min_age: 2,
  },
  {
    id: 'm4',
    name: 'Omeprazole',
    aka: ['Omez', 'Pan D', 'Prilosec'],
    treats: ['Acidity', 'GERD', 'Stomach ulcers', 'Heartburn'],
    side_effects: ['Headache', 'Diarrhoea', 'Nausea', 'Stomach pain'],
    warnings: [
      'Long-term use may reduce magnesium levels',
      'Inform doctor if you have liver problems',
    ],
    interactions: ['Clopidogrel', 'Methotrexate'],
    min_age: null,
  },
  {
    id: 'm5',
    name: 'Amoxicillin',
    aka: ['Mox', 'Novamox', 'Amoxil'],
    treats: ['Bacterial infections', 'Throat infection', 'Ear infection', 'Pneumonia'],
    side_effects: ['Diarrhoea', 'Rash', 'Nausea', 'Vomiting'],
    warnings: [
      'Complete the full course even if you feel better',
      'Inform doctor if allergic to penicillin',
    ],
    interactions: ['Warfarin', 'Methotrexate', 'Oral contraceptives'],
    min_age: null,
  },
  {
    id: 'm6',
    name: 'Metformin',
    aka: ['Glucophage', 'Glycomet', 'Obimet'],
    treats: ['Type 2 diabetes', 'High blood sugar', 'PCOD'],
    side_effects: ['Nausea', 'Diarrhoea', 'Stomach pain', 'Loss of appetite'],
    warnings: [
      'Take with meals to reduce stomach side effects',
      'Avoid alcohol',
      'Monitor kidney function regularly',
    ],
    interactions: ['Alcohol', 'Contrast dye (CT scans)', 'Diuretics'],
    min_age: 10,
  },
  {
    id: 'm7',
    name: 'Aspirin',
    aka: ['Ecosprin', 'Disprin', 'Bayer Aspirin'],
    treats: ['Fever', 'Pain', 'Heart attack prevention', 'Blood clot prevention'],
    side_effects: ['Stomach bleeding', 'Nausea', 'Ringing in ears'],
    warnings: [
      "Do not give to children under 16 (Reye's syndrome risk)",
      'Stop 7 days before surgery',
      'Can cause stomach bleeding',
    ],
    interactions: ['Ibuprofen', 'Warfarin', 'SSRIs'],
    min_age: 16,
  },
  {
    id: 'm8',
    name: 'Atorvastatin',
    aka: ['Lipitor', 'Storvas', 'Tonact'],
    treats: ['High cholesterol', 'Heart disease prevention'],
    side_effects: ['Muscle pain', 'Headache', 'Nausea', 'Joint pain'],
    warnings: [
      'Report unexplained muscle pain or weakness immediately',
      'Avoid grapefruit juice',
      'Avoid during pregnancy',
    ],
    interactions: ['Fibrates', 'Erythromycin', 'Antifungals'],
    min_age: 10,
  },
];

export const CABINET_ITEMS = [
  {
    id: 'c1',
    name: 'Paracetamol 500mg',
    expiry: '08/2027',
    notes: 'Keep in cool dry place',
    added_at: '2026-01-01T10:00:00Z',
  },
  {
    id: 'c2',
    name: 'Cetirizine 10mg',
    expiry: '03/2027',  // FIX: was 03/2026, already expired
    notes: 'Bedside drawer',
    added_at: '2025-12-15T09:00:00Z',
  },
  {
    id: 'c3',
    name: 'Atorvastatin 10mg',
    expiry: '12/2027',
    notes: 'Night dose — do not skip',
    added_at: '2025-12-12T08:00:00Z',
  },
];

export const HISTORY_DATA = {
  symptom_checks: [
    {
      id: 'h1',
      query: 'Persistent dry cough for 3 days',
      top_medicine: 'Benadryl DR',
      timestamp: '2026-06-12T17:02:00Z',  // FIX: was 2025
    },
    {
      id: 'h2',
      query: 'Severe migraine with nausea',
      top_medicine: 'Rizatriptan',
      timestamp: '2026-06-10T02:45:00Z',
    },
    {
      id: 'h3',
      query: 'Fever and body ache since yesterday',
      top_medicine: 'Dolo 650',
      timestamp: '2026-06-08T14:30:00Z',
    },
  ],
  scans: [
    {
      id: 's1',
      medicine_name: 'Paracetamol',
      expiry: '08/2027',
      status: 'valid',
      timestamp: '2026-06-11T11:00:00Z',
    },
    {
      id: 's2',
      medicine_name: 'Amoxicillin',
      expiry: '02/2025',
      status: 'expired',
      timestamp: '2026-06-09T16:20:00Z',
    },
  ],
};

export function mockSymptomSearch(text) {
  const q = text.toLowerCase();
  const keywords = {
    fever: ['Paracetamol', 'Ibuprofen', 'Aspirin'],
    headache: ['Paracetamol', 'Ibuprofen'],
    cough: ['Cetirizine'],
    cold: ['Cetirizine'],
    allergy: ['Cetirizine'],
    acidity: ['Omeprazole'],
    heartburn: ['Omeprazole'],
    stomach: ['Omeprazole'],
    pain: ['Paracetamol', 'Ibuprofen'],
    nausea: ['Omeprazole'],
    diabetes: ['Metformin'],
    sugar: ['Metformin'],
    infection: ['Amoxicillin'],
    throat: ['Amoxicillin'],
    cholesterol: ['Atorvastatin'],
    back: ['Ibuprofen'],
  };

  const scored = MEDICINES.map(m => {
    let score = 0;
    m.treats.forEach(t => {
      if (q.includes(t.toLowerCase())) score += 0.4;
    });
    if (q.includes(m.name.toLowerCase())) score += 0.3;
    m.aka.forEach(a => {
      if (q.includes(a.toLowerCase())) score += 0.2;
    });
    Object.entries(keywords).forEach(([kw, names]) => {
      if (q.includes(kw) && names.includes(m.name)) score += 0.3;
    });
    return { ...m, confidence: Math.min(score, 0.98) };
  });

  return scored
    .filter(m => m.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4)
    .map(m => ({
      name: m.name,
      confidence: m.confidence,
      treats: m.treats,
      sideEffects: m.side_effects,
      warnings: m.warnings,
    }));
}

// FIX: rotating results so scan doesn't always return Paracetamol
const SCAN_RESULTS = [
  {
    name: 'Paracetamol 500mg',
    expiry: '08/2027',
    status: 'valid',
    treats: ['Fever', 'Headache', 'Body pain'],
    warnings: ['Do not exceed 4g per day', 'Avoid alcohol'],
    ocr_text: 'PARACETAMOL TABLETS IP 500mg\nMfg: Jan/2025  Exp: 08/2027\nBatch No: PC25A01\nMRP Rs. 18.50',
  },
  {
    name: 'Ibuprofen 400mg',
    expiry: '05/2028',
    status: 'valid',
    treats: ['Fever', 'Pain', 'Inflammation'],
    warnings: ['Take with food', 'Avoid if you have kidney problems'],
    ocr_text: 'IBUPROFEN TABLETS IP 400mg\nMfg: Mar/2025  Exp: 05/2028\nBatch No: IB25B03\nMRP Rs. 32.00',
  },
  {
    name: 'Amoxicillin 500mg',
    expiry: '02/2025',
    status: 'expired',
    treats: ['Bacterial infections', 'Throat infection'],
    warnings: ['Complete the full course', 'Inform doctor if allergic to penicillin'],
    ocr_text: 'AMOXICILLIN CAPSULES IP 500mg\nMfg: Jan/2023  Exp: 02/2025\nBatch No: AM23C01\nMRP Rs. 85.00',
  },
  {
    name: 'Cetirizine 10mg',
    expiry: '11/2026',
    status: 'expiring_soon',
    treats: ['Allergy', 'Hay fever', 'Runny nose'],
    warnings: ['May cause drowsiness — avoid driving', 'Avoid alcohol'],
    ocr_text: 'CETIRIZINE HYDROCHLORIDE TABLETS 10mg\nMfg: Dec/2024  Exp: 11/2026\nBatch No: CZ24D12\nMRP Rs. 24.00',
  },
];

export function mockScan() {
  return SCAN_RESULTS[Math.floor(Math.random() * SCAN_RESULTS.length)];
}

export function mockCheck(medicine, others = []) {
  const med = MEDICINES.find(
    m =>
      m.name.toLowerCase() === medicine.toLowerCase() ||
      m.aka.some(a => a.toLowerCase() === medicine.toLowerCase())
  );
  if (!med) return { recognized: false, safe: null };

  const foundInteractions = med.interactions.filter(ix =>
    others.some(o => o.toLowerCase().includes(ix.toLowerCase()))
  );

  return {
    recognized: true,
    safe: foundInteractions.length === 0,
    warnings: med.warnings,
    side_effects: med.side_effects,
    interactions:
      foundInteractions.length > 0
        ? foundInteractions.map(ix => `${med.name} interacts with ${ix}`)
        : [],
  };
}