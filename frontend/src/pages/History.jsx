import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Btn, Spinner } from '../components/UI';
import api from '../api/client';
import s from './History.module.css';

const dateFmt = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const formatTs = ts => {
  if (!ts) return '';
  const d = new Date(ts);
  return isNaN(d) ? '' : dateFmt.format(d);
};

const statusVariant = { expired: 'danger', expiring_soon: 'warning', valid: 'success', unknown: 'neutral' };
const statusLabel   = { expired: 'EXPIRED', expiring_soon: 'EXPIRING SOON', valid: 'VALID', unknown: 'UNKNOWN' };

function ClipboardIcon() {
  return (
    <svg className={s.entryQueryIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [history,   setHistory]   = useState({ symptom_checks: [], scans: [] });
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [activeTab, setActiveTab] = useState('symptoms');

  useEffect(() => {
    // api.getHistory() normalizes created_at -> timestamp and expiry_status -> status
    api.getHistory()
      .then(d => setHistory({
        symptom_checks: d.symptom_checks || [],
        scans:          d.scans          || [],
      }))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const checks       = history.symptom_checks;
  const scans        = history.scans;
  const totalEntries = checks.length + scans.length;

  if (loading) {
    return <div className={s.center}><Spinner size={28} /></div>;
  }

  if (error && !checks.length && !scans.length) {
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
        <h1 className={s.title}>History</h1>
        <p className={s.subtitle}>Last {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}</p>
      </div>

      <div className={s.tabBar}>
        <button
          className={`${s.tab} ${activeTab === 'symptoms' ? s.tabActive : ''}`}
          onClick={() => setActiveTab('symptoms')}
        >
          Symptom Checks ({checks.length})
        </button>
        <button
          className={`${s.tab} ${activeTab === 'scans' ? s.tabActive : ''}`}
          onClick={() => setActiveTab('scans')}
        >
          Scans ({scans.length})
        </button>
      </div>

      {activeTab === 'symptoms' && (
        <>
          {checks.length === 0 ? (
            <div className={s.empty}>
              <span className={s.emptyIcon}>🕐</span>
              <p className={s.emptyText}>No symptom checks yet</p>
              <Btn variant="outline" onClick={() => navigate('/symptoms')}>Check symptoms now</Btn>
            </div>
          ) : (
            <div className={s.entries}>
              {checks.map((entry, i) => (
                <Card
                  key={entry.id ?? i}
                  className={s.entryCard}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className={s.entryHeader}>
                    <div>
                      <div className={s.entryQuery}>
                        <ClipboardIcon />
                        {entry.query}
                      </div>
                      {entry.top_medicine && (
                        <div className={s.entryRecommended}>
                          <span className={s.entryRecommendedLabel}>Recommended:</span>
                          <Badge variant="success">{entry.top_medicine}</Badge>
                        </div>
                      )}
                    </div>
                    <Btn variant="ghost" size="sm" onClick={() => navigate('/symptoms')}>
                      Re-check →
                    </Btn>
                  </div>
                  <div className={s.entryFooter}>
                    <span className={s.entryTimestamp}>🕐 {formatTs(entry.timestamp)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'scans' && (
        <>
          {scans.length === 0 ? (
            <div className={s.empty}>
              <span className={s.emptyIcon}>🕐</span>
              <p className={s.emptyText}>No scans yet</p>
              <Btn variant="outline" onClick={() => navigate('/scan')}>Scan a medicine</Btn>
            </div>
          ) : (
            <div className={s.entries}>
              {scans.map((entry, i) => {
                const st = entry.status || 'unknown';
                return (
                  <Card
                    key={entry.id ?? i}
                    className={s.entryCard}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className={s.scanInfo}>
                      <span className={`${s.scanName} ${!entry.medicine_name ? s.scanNameUnknown : ''}`}>
                        {entry.medicine_name || 'Unknown'}
                      </span>
                      {entry.expiry && <span className={s.scanExpiry}>Expiry: {entry.expiry}</span>}
                      <Badge variant={statusVariant[st] || 'neutral'}>
                        {statusLabel[st] || st.toUpperCase()}
                      </Badge>
                    </div>
                    <div className={s.scanFooter}>
                      <span className={s.entryTimestamp}>🕐 {formatTs(entry.timestamp)}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}