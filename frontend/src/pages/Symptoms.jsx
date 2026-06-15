import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Btn, Spinner, Disclaimer } from '../components/UI';
import api from '../api/client';
import s from './Symptoms.module.css';

const MAX_CHARS = 500;
const QUICK_SYMPTOMS = ['Fever', 'Headache', 'Cough', 'Stomach pain', 'Acidity', 'Allergy', 'Back pain', 'Nausea'];

export default function Symptoms() {
  const navigate = useNavigate();
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [animate, setAnimate] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (results.length > 0) {
      const t = setTimeout(() => setAnimate(true), 50);
      return () => clearTimeout(t);
    }
    setAnimate(false);
  }, [results]);

  function toggleChip(symptom) {
    if (query.toLowerCase().includes(symptom.toLowerCase())) {
      setQuery(prev =>
        prev
          .replace(new RegExp(symptom + ',?\\s*', 'gi'), '')
          .replace(/,\s*$/, '')
          .trim()
      );
    } else {
      setQuery(prev => {
        const t = prev.trim();
        if (!t) return symptom;
        return t + (t.endsWith(',') ? ' ' : ', ') + symptom;
      });
    }
    textareaRef.current?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setError('');
    setResults([]);
    setAnimate(false);
    try {
      // api.getSymptoms normalizes backend {matches:[{medicine,...}]}
      // into {results:[{name,...}]} so this always works
      const data = await api.getSymptoms(query.trim());
      // The model always returns its top-3, so for vague input the 2nd/3rd can be
      // near-zero "filler". Drop anything under 8%, but keep at least the top match
      // so the user never lands on an empty results panel.
      const all = data.results || [];
      const filtered = all.filter(m => (m.confidence ?? 0) >= 0.08);
      setResults(filtered.length ? filtered : all.slice(0, 1));
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={s.page}>
      <div className={s.columns}>
        <Card className={s.inputPanel}>
          <div className={s.panelHeader}>
            <h1 className={s.panelTitle}>Symptom Checker</h1>
            <Badge variant="info">AI-powered</Badge>
          </div>
          <form onSubmit={handleSubmit}>
            <div className={s.textareaWrap}>
              <textarea
                ref={textareaRef}
                className={s.textarea}
                placeholder="Describe your symptoms… e.g. fever, headache and body ache since yesterday"
                value={query}
                onChange={e => setQuery(e.target.value.slice(0, MAX_CHARS))}
                maxLength={MAX_CHARS}
              />
            </div>
            <div className={s.charCounter}>{query.length} / {MAX_CHARS}</div>
            <div className={s.chipsLabel}>Quick add:</div>
            <div className={s.chips}>
              {QUICK_SYMPTOMS.map(sym => (
                <button
                  key={sym}
                  type="button"
                  className={`${s.chip} ${query.toLowerCase().includes(sym.toLowerCase()) ? s.chipActive : ''}`}
                  onClick={() => toggleChip(sym)}
                >
                  {sym}
                </button>
              ))}
            </div>
            <Btn
              variant="primary"
              size="lg"
              className={s.submitBtn}
              disabled={!query.trim() || loading}
              type="submit"
            >
              {loading ? <><Spinner size={18} color="#fff" /> Searching…</> : 'Find medicines →'}
            </Btn>
          </form>
        </Card>

        <div className={s.resultsPanel}>
          {error && <div className={s.errorBox}>{error}</div>}

          {results.length === 0 && !loading && !error && (
            <div className={s.emptyState}>
              <div className={s.emptyEmoji}>💊</div>
              <div className={s.emptyTitle}>Enter your symptoms to get started</div>
              <div className={s.emptySub}>
                MedScan will suggest the most effective treatments based on your description.
              </div>
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className={s.resultsHeader}>
                <h2 className={s.resultsTitle}>Suggested medicines</h2>
                <Badge variant="neutral">{results.length}</Badge>
              </div>

              {results.map((med, idx) => (
                <Card key={idx} className={s.resultCard}>
                  <div className={s.medName}>{med.name}</div>
                  <div className={s.barWrap}>
                    <div className={s.barTrack}>
                      <div
                        className={s.barFill}
                        style={{ width: animate ? `${Math.round((med.confidence ?? 0) * 100)}%` : '0%' }}
                      />
                    </div>
                    <span className={s.barLabel}>{Math.round((med.confidence ?? 0) * 100)}% match</span>
                  </div>
                  {med.treats?.length > 0 && (
                    <div className={s.tagRow}>
                      <span className={s.tagLabel}>Treats:</span>
                      {med.treats.map(t => <span key={t} className={s.tagPillTeal}>{t}</span>)}
                    </div>
                  )}
                  {med.sideEffects?.length > 0 && (
                    <div className={s.tagRow}>
                      <span className={s.tagLabel}>Side effects:</span>
                      {med.sideEffects.map(se => <span key={se} className={s.tagPillGray}>{se}</span>)}
                    </div>
                  )}
                  {med.warnings?.length > 0 && (
                    <div style={{ marginTop: 'var(--space-sm)' }}>
                      {med.warnings.map((w, wi) => (
                        <div key={wi} className={s.warningLine}>⚠ {w}</div>
                      ))}
                    </div>
                  )}
                  <div className={s.cardFooter}>
                    <Btn variant="ghost" size="sm" onClick={() => navigate('/cabinet', { state: { medicine: med.name } })}>
                      Add to cabinet
                    </Btn>
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/check', { state: { medicine: med.name } })}
                    >
                      Safety check →
                    </Btn>
                  </div>
                </Card>
              ))}
              <Disclaimer />
            </>
          )}
        </div>
      </div>
    </div>
  );
}