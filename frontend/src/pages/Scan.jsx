import { useState, useRef, useCallback } from 'react';
import { Card, Badge, Btn, Spinner, Disclaimer } from '../components/UI';
import api from '../api/client';
import s from './Scan.module.css';

function parseExpiry(str) {
  if (!str) return null;
  const parts = str.replace('-', '/').split('/');
  if (parts.length !== 2) return null;
  const month = parseInt(parts[0], 10);
  const year  = parseInt(parts[1], 10);
  if (!month || !year) return null;
  return new Date(year, month, 0);
}

function getExpiryInfo(expiryStr) {
  const date = parseExpiry(expiryStr);
  if (!date) return { status: 'unknown', days: null };
  const days = Math.ceil((date - new Date()) / 86400000);
  if (days < 0)   return { status: 'expired',       days: Math.abs(days) };
  if (days <= 90) return { status: 'expiring_soon', days };
  return              { status: 'valid',         days };
}

const statusVariant = { expired: 'danger', expiring_soon: 'warning', valid: 'success', unknown: 'neutral' };
const statusLabel   = { expired: 'Expired', expiring_soon: 'Expiring Soon', valid: 'Valid', unknown: 'Unknown' };

export default function Scan() {
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState('');
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback(f => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
    setResult(null);
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview('');
    setResult(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  }, [preview]);

  const onDrop = e => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      setResult(await api.post('/scan', form));
    } catch (err) {
      setError(err.message || 'Scan failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const expiry = result ? getExpiryInfo(result.expiry) : null;

  return (
    <div className={s.page}>
      <h1 className={s.heading}>Scan Medicine</h1>
      <p className={s.subtitle}>Identify medications and check safety instantly using AI.</p>

      <Card
        className={`${s.uploadCard} ${dragging ? s.uploadCardDragging : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {!file ? (
          <div className={s.uploadContent}>
            <span className={s.uploadEmoji}>📷</span>
            <span className={s.uploadTitle}>Drop a medicine photo here</span>
            <span className={s.uploadSub}>or click to browse — JPG, PNG, WebP</span>
          </div>
        ) : (
          <div className={s.previewWrap}>
            <img src={preview} alt="Preview" className={s.previewImage} />
            <button
              className={s.clearBtn}
              onClick={e => { e.stopPropagation(); clearFile(); }}
              aria-label="Clear"
            >
              ×
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className={s.hiddenInput}
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </Card>

      <Btn
        variant="primary"
        size="lg"
        className={s.scanBtn}
        disabled={!file || loading}
        onClick={handleScan}
      >
        {loading ? <><Spinner size={18} /> Scanning…</> : 'Scan medicine →'}
      </Btn>

      {error && <div className={s.error}>{error}</div>}

      {result && (
        <Card className={s.resultCard}>
          <h2 className={`${s.medicineName} ${!result.name ? s.medicineNameMuted : ''}`}>
            {result.name || 'Could not detect name'}
          </h2>
          <div className={s.expiryRow}>
            <span className={s.expiryLabel}>Expiry</span>
            <span className={`${s.expiryValue} ${!result.expiry ? s.expiryValueMuted : ''}`}>
              {result.expiry || 'Not found'}
            </span>
            <Badge variant={statusVariant[expiry.status]}>{statusLabel[expiry.status]}</Badge>
          </div>
          {expiry.days !== null && (
            <p className={`${s.daysRemaining} ${expiry.status === 'expired' ? s.daysRed : s.daysGreen}`}>
              {expiry.status === 'expired'
                ? `Expired ${expiry.days} days ago`
                : `Expires in ${expiry.days} days`}
            </p>
          )}
          <hr className={s.divider} />
          {result.treats?.length > 0 && (
            <>
              <h3 className={s.sectionTitle}>Treats</h3>
              <div className={s.pillsWrap}>
                {result.treats.map((t, i) => <span key={i} className={s.pill}>{t}</span>)}
              </div>
            </>
          )}
          {result.warnings?.length > 0 && (
            <>
              <h3 className={s.sectionTitle}>Warnings</h3>
              <div className={s.warningsList}>
                {result.warnings.map((w, i) => (
                  <p key={i} className={s.warningItem}>⚠ {w}</p>
                ))}
              </div>
            </>
          )}
          {result.ocr_text && (
            <details className={s.ocrDetails}>
              <summary className={s.ocrSummary}>View raw OCR text</summary>
              <pre className={s.ocrText}>{result.ocr_text}</pre>
            </details>
          )}
          <Disclaimer />
        </Card>
      )}
    </div>
  );
}