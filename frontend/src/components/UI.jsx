import s from './UI.module.css';

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`${s.card} ${className}`} {...props}>
      {children}
    </div>
  );
}

const badgeVariants = {
  neutral: s.badgeNeutral,
  success: s.badgeSuccess,
  warning: s.badgeWarning,
  danger: s.badgeDanger,
  info: s.badgeInfo,
};

export function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`${s.badge} ${badgeVariants[variant] || ''} ${className}`}>
      {children}
    </span>
  );
}

const btnVariants = {
  primary: s.btnPrimary,
  outline: s.btnOutline,
  ghost: s.btnGhost,
  danger: s.btnDanger,
};

const btnSizes = {
  sm: s.btnSm,
  md: s.btnMd,
  lg: s.btnLg,
};

export function Btn({ children, variant = 'primary', size = 'md', className = '', disabled, ...props }) {
  return (
    <button
      className={`${s.btn} ${btnVariants[variant] || ''} ${btnSizes[size] || ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function Spinner({ size = 20, color = '#7C5CFC' }) {
  return (
    <svg className={s.spinner} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle
        cx="12" cy="12" r="10"
        stroke={color}
        strokeWidth="3"
        strokeDasharray="31.4 31.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Disclaimer() {
  return (
    <div className={s.disclaimer}>
      <span className={s.disclaimerChip}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.3 3.8 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z" />
        </svg>
      </span>
      <p className={s.disclaimerText}>
        Educational prototype, not medical advice. Always consult a doctor or pharmacist.
      </p>
    </div>
  );
}