/**
 * API client for Medicine Advisor.
 *
 * Attaches the Supabase access token to every request that needs auth
 * (/symptoms, /scan, /history). Public routes (/check, /medicines) work
 * without a token.
 */

import { getAccessToken } from '../lib/supabase'
import {
  MEDICINES,
  HISTORY_DATA,
  mockSymptomSearch,
  mockScan,
  mockCheck,
} from './mock.js'

// ---------------------------------------------------------------------------
// Mock layer (local dev without backend)
// ---------------------------------------------------------------------------

function mockRoute(method, endpoint, body) {
  return new Promise(resolve => {
    setTimeout(() => {
      if (method === 'GET'  && endpoint === '/medicines') return resolve(MEDICINES)
      if (method === 'GET'  && endpoint === '/history')   return resolve(HISTORY_DATA)
      if (method === 'POST' && endpoint === '/symptoms')  return resolve({ results: mockSymptomSearch(body?.text || '') })
      if (method === 'POST' && endpoint === '/scan')      return resolve(mockScan())
      if (method === 'POST' && endpoint === '/check')     return resolve(mockCheck(body?.medicine || '', body?.other_medicines || []))
      resolve({})
    }, 200 + Math.random() * 300)
  })
}

// ---------------------------------------------------------------------------
// Real API layer
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const USE_MOCK  = !import.meta.env.VITE_API_URL && import.meta.env.DEV

// Routes that require a logged-in user
const AUTH_REQUIRED = ['/symptoms', '/scan', '/history']

async function request(method, endpoint, body) {
  if (USE_MOCK) return mockRoute(method, endpoint, body)

  const url = `${API_BASE}${endpoint}`
  const headers = {}

  // Attach Bearer token for protected endpoints
  const needsAuth = AUTH_REQUIRED.some(r => endpoint.startsWith(r))
  if (needsAuth) {
    const token = await getAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let fetchBody
  if (body instanceof FormData) {
    fetchBody = body
  } else if (body) {
    headers['Content-Type'] = 'application/json'
    fetchBody = JSON.stringify(body)
  }

  const res = await fetch(url, { method, headers, body: fetchBody })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || err.message || `Request failed (${res.status})`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// Normalization helpers (shapes unchanged from before)
// ---------------------------------------------------------------------------

function normalizeSymptoms(data) {
  const raw = data?.matches || data?.results || []
  return {
    results: raw.map(m => ({
      name:        m.name       || m.medicine || '',
      confidence:  m.confidence ?? 0,
      treats:      m.treats      || [],
      sideEffects: m.sideEffects || m.side_effects || [],
      warnings:    m.warnings    || [],
    })),
  }
}

function normalizeScan(data) {
  return {
    name:     data.name          || data.medicine_name || null,
    expiry:   data.expiry        || null,
    status:   data.status        || data.expiry_status || 'unknown',
    treats:   data.treats        || [],
    warnings: data.warnings      || [],
    ocr_text: data.ocr_text      || data.raw_text      || null,
  }
}

function normalizeMedicines(data) {
  if (Array.isArray(data))            return data
  if (Array.isArray(data?.medicines)) return data.medicines
  return []
}

function normalizeHistory(data) {
  const symptom_checks = (data?.symptom_checks || []).map(h => ({
    id:           h.id,
    query:        h.query        || '',
    top_medicine: h.top_medicine || null,
    timestamp:    h.timestamp    || h.created_at || '',
  }))
  const scans = (data?.scans || []).map(s => ({
    id:            s.id,
    medicine_name: s.medicine_name || null,
    expiry:        s.expiry        || null,
    status:        s.status        || s.expiry_status || 'unknown',
    timestamp:     s.timestamp     || s.created_at    || '',
  }))
  return { symptom_checks, scans }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const api = {
  async getSymptoms(text) {
    const data = await request('POST', '/symptoms', { text })
    return normalizeSymptoms(data)
  },

  async scan(formData) {
    const data = await request('POST', '/scan', formData)
    return normalizeScan(data)
  },

  async check(medicine, age, otherMedicines = []) {
    return request('POST', '/check', { medicine, age, other_medicines: otherMedicines })
  },

  async getMedicines() {
    const data = await request('GET', '/medicines')
    return normalizeMedicines(data)
  },

  async getHistory() {
    const data = await request('GET', '/history')
    return normalizeHistory(data)
  },

  get:    endpoint         => request('GET',    endpoint),
  post:   (endpoint, body) => request('POST',   endpoint, body),
  delete: endpoint         => request('DELETE',  endpoint),
}

export default api