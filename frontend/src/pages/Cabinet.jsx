import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Badge, Btn, Spinner } from '../components/UI';
import api from '../api/client';
import s from './Cabinet.module.css';

function parseExpiry(str) {
  if (!str) return { status: 'unknown', label: 'NO DATE' };
  const parts = str.trim().split('/');
  if (parts.length !== 2) return { status: 'unknown', label: 'NO DATE' };
  const month = parseInt(parts[0], 10);
  const year  = parseInt(parts[1], 10);
  if (!month || !year || month < 1 || month > 12) return { status: 'unknown', label: 'NO DATE' };
  const days = Math.ceil((new Date(year, month, 0) - new Date()) / 86400000);
  if (days <= 0)  return { status: 'expired',       label: 'EXPIRED'       };
  if (days <= 90) return { status: 'expiring_soon', label: 'EXPIRING SOON' };
  return              { status: 'valid',         label: 'VALID'         };
}

const expiryVariant = {
  expired:       'danger',
  expiring_soon: 'warning',
  valid:         'success',
  unknown:       'neutral',
};

function formatAdded(str) {
  if (!str) return '';
  const d = new Date(str);
  return isNaN(d) ? '' : `Added ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  );
}

export default function Cabinet() {
  // If we arrived via a "+ Add to cabinet" button, the medicine name rides along
  // in router state — open the form and pre-fill the name so the user just adds details.
  const prefill = useLocation().state?.medicine || '';

  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [showForm,   setShowForm]   = useState(!!prefill);
  const [newName,    setNewName]    = useState(prefill);
  const [newExpiry,  setNewExpiry]  = useState('');
  const [newNotes,   setNewNotes]   = useState('');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    // api.getCabinet() normalizes { items: [...] } and medicine_name/created_at
    // into a direct array with { name, added_at }
    api.getCabinet()
      .then(d => setItems(d))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddLoading(true);
    try {
      // api.addToCabinet() translates { name } -> { medicine_name } for the real backend
      const created = await api.addToCabinet({
        name:   newName.trim(),
        expiry: newExpiry.trim(),
        notes:  newNotes.trim(),
      });
      setItems(prev => [created, ...prev]);
      setNewName('');
      setNewExpiry('');
      setNewNotes('');
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteFromCabinet(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <div className={s.center}><Spinner size={28} /></div>;
  }

  if (error && !items.length) {
    return (
      <div className={s.center}>
        <p className={s.errorText}>{error}</p>
        <Btn variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Btn>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h1 className={s.title}>My Cabinet</h1>
          <Badge variant="neutral">{items.length} medicine{items.length !== 1 ? 's' : ''}</Badge>
        </div>
        <Btn variant="outline" size="sm" onClick={() => setShowForm(v => !v)}>+ Add medicine</Btn>
      </div>

      {showForm && (
        <Card className={s.formCard}>
          <form onSubmit={handleAdd}>
            <div className={s.formRow}>
              <div className={s.formField}>
                <label className={s.formLabel}>Medicine name *</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Paracetamol"
                  required
                />
              </div>
              <div className={s.formField}>
                <label className={s.formLabel}>Expiry date</label>
                <input
                  value={newExpiry}
                  onChange={e => setNewExpiry(e.target.value)}
                  placeholder="MM/YYYY"
                />
              </div>
              <div className={s.formField}>
                <label className={s.formLabel}>Notes</label>
                <input
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Where you keep it…"
                />
              </div>
            </div>
            <div className={s.formActions}>
              <Btn variant="ghost" size="sm" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </Btn>
              <Btn
                variant="primary"
                size="sm"
                type="submit"
                disabled={addLoading || !newName.trim()}
              >
                {addLoading ? <Spinner size={14} /> : 'Save'}
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {items.length === 0 ? (
        <div className={s.empty}>
          <span className={s.emptyIcon}>📦</span>
          <p className={s.emptyText}>Your cabinet is empty</p>
          <Btn variant="outline" onClick={() => setShowForm(true)}>Add your first medicine</Btn>
        </div>
      ) : (
        <div className={s.grid}>
          {items.map((item, i) => {
            const { status, label } = parseExpiry(item.expiry);
            return (
              <Card
                key={item.id ?? i}
                className={s.itemCard}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={s.itemHeader}>
                  <span className={s.itemName}>{item.name}</span>
                  <Badge variant={expiryVariant[status]}>{label}</Badge>
                </div>
                {item.expiry && <p className={s.itemExpiry}>Expires: {item.expiry}</p>}
                {item.notes  && <p className={s.itemNotes}>"{item.notes}"</p>}
                <div className={s.itemMeta}>
                  <span className={s.itemDate}>{formatAdded(item.added_at)}</span>
                  <button
                    className={s.deleteBtn}
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Delete ${item.name}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}