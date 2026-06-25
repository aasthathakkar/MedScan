/**
 * API client for Medicine Advisor.
 *
 * When VITE_API_URL is set in .env, hits the real FastAPI backend.
 * When it is not set, falls back to mock data (for local dev without the backend).
 *
 * All normalization of backend response shapes lives here so the page
 * components never need to know which shape the real API returns.
 */

import {
  MEDICINES,
  HISTORY_DATA,
  mockSymptomSearch,
  mockScan,
  mockCheck,
} from './mock.js';

// ---------------------------------------------------------------------------
// Mock layer (used when VITE_API_URL is not set)
// ---------------------------------------------------------------------------


function mockRoute(method, endpoint, body) {
  return new Promise(resolve => {
    setTimeout(() => {
      if (method === 'GET' && endpoint === '/medicines') {
        return resolve(MEDICINES);
      }

      if (method === 'GET' && endpoint === '/history') {
        return resolve(HISTORY_DATA);
      }

      if (method === 'POST' && endpoint === '/symptoms') {
        return resolve({ results: mockSymptomSearch(body?.text || '') });
      }

      if (method === 'POST' && endpoint === '/scan') {
        return resolve(mockScan());
      }

      if (method === 'POST' && endpoint === '/check') {
        return resolve(mockCheck(body?.medicine || '', body?.other_medicines || []));
      }

      resolve({});
    }, 200 + Math.random() * 300);
  });
}

// ---------------------------------------------------------------------------
// Real API layer
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
// Only fall back to mock data during local dev (npm run dev). In a production
// build, a missing VITE_API_URL should surface as failed requests we can see —
// NOT silently serve fake data that looks like a working backend.
const USE_MOCK  = !import.meta.env.VITE_API_URL && import.meta.env.DEV;

async function request(method, endpoint, body) {
  if (USE_MOCK) return mockRoute(method, endpoint, body);

  const url = `${API_BASE}${endpoint}`;
  const headers = {};
  let fetchBody;

  if (body instanceof FormData) {
    fetchBody = body;
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }

  const res = await fetch(url, { method, headers, body: fetchBody });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `Request failed (${res.status})`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

/**
 * Backend /symptoms returns:
 *   { query, matches: [{ medicine, confidence, treats, side_effects, warnings }] }
 *
 * Pages expect:
 *   { results: [{ name, confidence, treats, sideEffects, warnings }] }
 */
function normalizeSymptoms(data) {
  const raw = data?.matches || data?.results || [];
  return {
    results: raw.map(m => ({
      name:        m.name       || m.medicine || '',
      confidence:  m.confidence ?? 0,
      treats:      m.treats      || [],
      sideEffects: m.sideEffects || m.side_effects || [],
      warnings:    m.warnings    || [],
    })),
  };
}

/**
 * Backend /scan returns:
 *   { raw_text, medicine_name, expiry, expiry_iso, expiry_status, days_until_expiry, treats, warnings }
 *
 * Pages expect:
 *   { name, expiry, status, treats, warnings, ocr_text }
 */
function normalizeScan(data) {
  return {
    name:     data.name          || data.medicine_name || null,
    expiry:   data.expiry        || null,
    status:   data.status        || data.expiry_status || 'unknown',
    treats:   data.treats        || [],
    warnings: data.warnings      || [],
    ocr_text: data.ocr_text      || data.raw_text      || null,
  };
}

/**
 * Backend /medicines returns:
 *   { count, medicines: [...], disclaimer }
 *
 * Pages expect a direct array.
 */
function normalizeMedicines(data) {
  if (Array.isArray(data))            return data;
  if (Array.isArray(data?.medicines)) return data.medicines;
  return [];
}


/**
 * Backend /history returns:
 *   {
 *     symptom_checks: [{ id, query, top_medicine, created_at }],
 *     scans:          [{ id, medicine_name, expiry, expiry_status, created_at }]
 *   }
 *
 * Pages expect:
 *   {
 *     symptom_checks: [{ id, query, top_medicine, timestamp }],
 *     scans:          [{ id, medicine_name, expiry, status, timestamp }]
 *   }
 */
function normalizeHistory(data) {
  const symptom_checks = (data?.symptom_checks || []).map(h => ({
    id:           h.id,
    query:        h.query        || '',
    top_medicine: h.top_medicine || null,
    timestamp:    h.timestamp    || h.created_at || '',
  }));

  const scans = (data?.scans || []).map(s => ({
    id:            s.id,
    medicine_name: s.medicine_name || null,
    expiry:        s.expiry        || null,
    status:        s.status        || s.expiry_status || 'unknown',
    timestamp:     s.timestamp     || s.created_at    || '',
  }));

  return { symptom_checks, scans };
}

// ---------------------------------------------------------------------------
// Public API — normalizes responses for every endpoint
// ---------------------------------------------------------------------------

const api = {
  async getSymptoms(text) {
    const data = await request('POST', '/symptoms', { text });
    return normalizeSymptoms(data);
  },

  async scan(formData) {
    const data = await request('POST', '/scan', formData);
    return normalizeScan(data);
  },

  async check(medicine, age, otherMedicines = []) {
    return request('POST', '/check', {
      medicine,
      age,
      other_medicines: otherMedicines,
    });
  },

  async getMedicines() {
    const data = await request('GET', '/medicines');
    return normalizeMedicines(data);
  },


  async getHistory() {
    const data = await request('GET', '/history');
    return normalizeHistory(data);
  },

  // Generic fallback (still used by Medicines page for /medicines/{name})
  get:    endpoint        => request('GET',    endpoint),
  post:   (endpoint, body) => request('POST',   endpoint, body),
  delete: endpoint        => request('DELETE',  endpoint),
};

export default api;