import { MEDICINES, CABINET_ITEMS, HISTORY_DATA, mockSymptomSearch, mockScan, mockCheck } from './mock.js';

let cabinetStore = [...CABINET_ITEMS];
let cabinetNextId = 100;

function mockRoute(method, endpoint, body) {
  return new Promise(resolve => {
    setTimeout(() => {
      if (method === 'GET' && endpoint === '/medicines') return resolve(MEDICINES);
      if (method === 'GET' && endpoint === '/cabinet') return resolve([...cabinetStore]);
      if (method === 'POST' && endpoint === '/cabinet') {
        const item = { id:`c${cabinetNextId++}`, name:body.name||'Unknown', expiry:body.expiry||'', notes:body.notes||'', added_at:new Date().toISOString() };
        cabinetStore.unshift(item);
        return resolve(item);
      }
      if (method === 'DELETE' && endpoint.startsWith('/cabinet/')) {
        const id = endpoint.split('/cabinet/')[1];
        cabinetStore = cabinetStore.filter(i => i.id !== id);
        return resolve({ ok:true });
      }
      if (method === 'GET' && endpoint === '/history') return resolve(HISTORY_DATA);
      if (method === 'POST' && endpoint === '/symptoms') return resolve({ results: mockSymptomSearch(body?.text || '') });
      if (method === 'POST' && endpoint === '/scan') return resolve(mockScan());
      if (method === 'POST' && endpoint === '/check') return resolve(mockCheck(body?.medicine || '', body?.other_medicines || []));
      resolve({});
    }, 200 + Math.random() * 300);
  });
}

const API_BASE = import.meta.env.VITE_API_URL || '';
const USE_MOCK = !import.meta.env.VITE_API_URL;

async function request(method, endpoint, body) {
  if (USE_MOCK) return mockRoute(method, endpoint, body);
  const url = `${API_BASE}${endpoint}`;
  const headers = {};
  let fetchBody;
  if (body instanceof FormData) { fetchBody = body; }
  else if (body) { headers['Content-Type'] = 'application/json'; fetchBody = JSON.stringify(body); }
  const res = await fetch(url, { method, headers, body: fetchBody });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || err.message || `Request failed (${res.status})`); }
  return res.json();
}

const api = {
  get: endpoint => request('GET', endpoint),
  post: (endpoint, body) => request('POST', endpoint, body),
  delete: endpoint => request('DELETE', endpoint),
};

export default api;