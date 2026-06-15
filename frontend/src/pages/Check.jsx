import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Btn, Spinner, Disclaimer } from '../components/UI';
import api from '../api/client';
import s from './Check.module.css';

export default function Check() {
  const { state } = useLocation();

  // FIX: reads medicine name passed from Symptoms or Medicines pages via navigate state
  const [medicine, setMedicine]     = useState(state?.medicine || '');
  const [age, setAge]               = useState('');
  const [others, setOthers]         = useState([]);
  const [otherInput, setOtherInput] = useState('');
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const addOther = () => {
    const v = otherInput.trim();
    if (!v || others.includes(v)) return;
    setOthers(prev => [...prev, v]);
    setOtherInput('');
  };

  const handleCheck = async e => {
    e.preventDefault();
    if (!medicine.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.post('/check', {
        medicine: medicine.trim(),
        age: parseInt(age, 10) || null,
        other_medicines: others,
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Safety check failed.');
    } finally {
      setLoading(false);
    }
  };

  const getBanner = () => {
    if (!result) return null;
    if (result.recognized === false) return { cls: s.bannerUnknown, icon: '❓', text: 'Medicine not in our database' };
    if (result.safe === true)        return { cls: s.bannerSafe,    icon: '✓',  text: 'No major concerns detected' };
    return                                  { cls: s.bannerUnsafe,  icon: '✗',  text: 'Safety concerns found — consult a pharmacist' };
  };
  const banner = getBanner();

  return (
    <div className={s.page}>
      <div className={s.formCol}>
        <Card>
          <h1 className={s.heading}>Safety Checker</h1>
          <p className={s.subtitle}>Verify drug interactions and safety profiles instantly.</p>
          <form onSubmit={handleCheck}>
            <div className={s.fieldGroup}>
              <label className={s.label} htmlFor="check-medicine">Medicine Name</label>
              <input
                id="check-medicine"
                type="text"
                placeholder="e.g. Aspirin, Paracetamol, Dolo"
                value={medicine}
                onChange={e => setMedicine(e.target.value)}
              />
            </div>
            <div className={s.fieldGroup}>
              <label className={s.label} htmlFor="check-age">Age (Optional)</label>
              <input
                id="check-age"
                type="number"
                placeholder="Your age (optional)"
                min="0"
                max="120"
                value={age}
                onChange={e => setAge(e.target.value)}
              />
            </div>
            <div className={s.fieldGroup}>
              <label className={s.label}>Other Medicines You&#39;re Taking</label>
              <div className={s.addRow}>
                <input
                  type="text"
                  placeholder="Add interaction check..."
                  value={otherInput}
                  onChange={e => setOtherInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOther();
                    }
                  }}
                />
                <Btn type="button" variant="outline" size="sm" onClick={addOther}>+ Add</Btn>
              </div>
              {others.length > 0 && (
                <div className={s.chipsWrap}>
                  {others.map(name => (
                    <span key={name} className={s.chip}>
                      {name}
                      <button
                        type="button"
                        className={s.chipRemove}
                        onClick={() => setOthers(prev => prev.filter(m => m !== name))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Btn
              type="submit"
              variant="primary"
              size="lg"
              className={s.submitBtn}
              disabled={!medicine.trim() || loading}
            >
              {loading ? <><Spinner size={18} /> Checking…</> : 'Check safety →'}
            </Btn>
          </form>
        </Card>
      </div>

      <div className={s.resultsCol}>
        {error && <div className={s.error}>{error}</div>}

        {!result && !error && (
          <div className={s.emptyState}>
            <span className={s.emptyEmoji}>🛡️</span>
            <h2 className={s.emptyTitle}>Ready to Check</h2>
            <p className={s.emptySub}>
              Enter a medicine to check its safety profile, side effects, and drug interactions.
            </p>
          </div>
        )}

        {result && (
          <div className={s.resultWrap}>
            {banner && (
              <div className={`${s.banner} ${banner.cls}`}>
                <span className={s.bannerIcon}>{banner.icon}</span>
                <span>{banner.text}</span>
              </div>
            )}
            {result.warnings?.length > 0 && (
              <>
                <h3 className={s.sectionTitle}>Warnings</h3>
                {result.warnings.map((w, i) => (
                  <div key={i} className={s.warningRow}>{w}</div>
                ))}
              </>
            )}
            {result.side_effects?.length > 0 && (
              <>
                <h3 className={s.sectionTitle}>Side Effects</h3>
                <div className={s.sideEffects}>
                  {result.side_effects.map((se, i) => (
                    <span key={i} className={s.sideEffectPill}>{se}</span>
                  ))}
                </div>
              </>
            )}
            {result.interactions?.length > 0 && (
              <>
                <h3 className={s.sectionTitle}>Drug Interactions</h3>
                {result.interactions.map((ix, i) => (
                  <div key={i} className={s.interactionRow}>{ix}</div>
                ))}
              </>
            )}
            <Disclaimer />
          </div>
        )}
      </div>
    </div>
  );
}