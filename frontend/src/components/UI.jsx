import s from './UI.module.css';

export function Card({ children, className = '', ...props }) {
  return <div className={`${s.card} ${className}`} {...props}>{children}</div>;
}

const badgeVariants = { neutral:s.badgeNeutral, success:s.badgeSuccess, warning:s.badgeWarning, danger:s.badgeDanger, info:s.badgeInfo };
export function Badge({ children, variant = 'neutral', className = '' }) {
  return <span className={`${s.badge} ${badgeVariants[variant]||''} ${className}`}>{children}</span>;
}

const btnVariants = { primary:s.btnPrimary, outline:s.btnOutline, ghost:s.btnGhost, danger:s.btnDanger };
const btnSizes = { sm:s.btnSm, md:s.btnMd, lg:s.btnLg };
export function Btn({ children, variant='primary', size='md', className='', disabled, ...props }) {
  return <button className={`${s.btn} ${btnVariants[variant]||''} ${btnSizes[size]||''} ${className}`} disabled={disabled} {...props}>{children}</button>;
}

export function Spinner({ size=20, color='currentColor' }) {
  return (
    <svg className={s.spinner} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
    </svg>
  );
}

export function Disclaimer({ text }) {
  return (
    <div className={s.disclaimer}>
      <svg className={s.disclaimerIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <div>
        <strong className={s.disclaimerTitle}>Disclaimer</strong>
        <p className={s.disclaimerText}>{text || 'This is an educational prototype, not medical advice. Always consult a doctor or pharmacist.'}</p>
      </div>
    </div>
  );
}