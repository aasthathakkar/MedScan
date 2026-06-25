import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Btn, Spinner } from '../components/UI';
import api from '../api/client';
import s from './Medicines.module.css';

function SearchIcon() {
  return (
    <svg className={s.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

export default function Medicines() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    // api.getMedicines() unwraps backend { count, medicines: [...] } into a plain array
    api.getMedicines()
      .then(d => setMedicines(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return medicines;
    const q = search.toLowerCase();
    return medicines.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      (Array.isArray(m.aka) && m.aka.some(a => a.toLowerCase().includes(q)))
    );
  }, [medicines, search]);

  if (loading) {
    return <div className={s.center}><Spinner size={28} /></div>;
  }

  return (
    <div className={s.page}>
      <div className={s.layout}>
        <aside className={s.sidebar}>
          <div className={s.searchWrap}>
            <SearchIcon />
            <input
              className={s.searchInput}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search medicines…"
            />
          </div>
          <span className={s.countLabel}>
            Showing {filtered.length} of {medicines.length} medicines
          </span>
          <div className={s.list}>
            {filtered.map((m, i) => (
              <button
                key={m.id ?? m.name ?? i}
                className={`${s.listItem} ${selected?.name === m.name ? s.listItemActive : ''}`}
                onClick={() => setSelected(m)}
              >
                <span className={s.listItemName}>{m.name}</span>
                {m.treats?.length > 0 && (
                  <span className={s.listItemCount}>{m.treats.length}</span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No medicines found
              </div>
            )}
          </div>
        </aside>

        <div className={s.detail}>
          {!selected ? (
            <div className={s.detailEmpty}>Select a medicine to see details</div>
          ) : (
            <Card key={selected.name}>
              <h1 className={s.detailName}>{selected.name}</h1>
              {selected.aka?.length > 0 && (
                <div className={s.section}>
                  <span className={s.sectionLabel}>Also known as:</span>
                  <div className={s.pillWrap}>
                    {selected.aka.map((a, i) => <span key={i} className={s.pillGray}>{a}</span>)}
                  </div>
                </div>
              )}
              {selected.treats?.length > 0 && (
                <div className={s.section}>
                  <span className={s.sectionTitle}>Treats</span>
                  <div className={s.pillWrap}>
                    {selected.treats.map((t, i) => <span key={i} className={s.pillTeal}>{t}</span>)}
                  </div>
                </div>
              )}
              {selected.side_effects?.length > 0 && (
                <div className={s.section}>
                  <span className={s.sectionTitle}>Side effects</span>
                  <div className={s.pillWrap}>
                    {selected.side_effects.map((se, i) => <span key={i} className={s.pillGray}>{se}</span>)}
                  </div>
                </div>
              )}
              {selected.warnings?.length > 0 && (
                <div className={s.section}>
                  <span className={s.sectionTitle}>Warnings</span>
                  {selected.warnings.map((w, i) => (
                    <div key={i} className={s.warningRow}>{w}</div>
                  ))}
                </div>
              )}
              {selected.min_age != null && (
                <div className={s.section}>
                  <Badge variant="danger">Not for children under {selected.min_age}</Badge>
                </div>
              )}
              {selected.interactions?.length > 0 && (
                <div className={s.section}>
                  <span className={s.sectionTitle}>Interactions</span>
                  <div className={s.pillWrap}>
                    {selected.interactions.map((ix, i) => (
                      <span key={i} className={s.pillRed}>⚠ interacts with {ix}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className={s.detailActions}>
                <Btn
                  variant="primary"
                  onClick={() => navigate('/check', { state: { medicine: selected.name } })}
                >
                  Check safety →
                </Btn>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}