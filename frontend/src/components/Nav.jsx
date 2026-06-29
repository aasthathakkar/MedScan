import { NavLink } from 'react-router-dom';
import s from './Nav.module.css';

// Icon set from the new design — each is a small line-icon component.
function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}
function SymptomsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11a3 3 0 1 0 6 0V5a3 3 0 0 0-6 0z" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}
function ScanIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M3 12h18" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12.5 11 14.5 15.5 10" />
      <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />
    </svg>
  );
}
function MedicinesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="13" height="13" rx="3" />
      <path d="M8 8V6a3 3 0 0 1 6 0v2" />
      <path d="M9.5 14.5h3" />
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 4v4h4" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

const links = [
  { to: '/',          label: 'Home',      Icon: HomeIcon      },
  { to: '/symptoms',  label: 'Symptoms',  Icon: SymptomsIcon  },
  { to: '/scan',      label: 'Scan',      Icon: ScanIcon      },
  { to: '/check',     label: 'Check',     Icon: CheckIcon     },
  { to: '/medicines', label: 'Medicines', Icon: MedicinesIcon },
  { to: '/history',   label: 'History',   Icon: HistoryIcon   },
];

export default function Nav() {
  return (
    <aside className={s.sidebar}>
      <div className={s.logo}>
        <div className={s.logoChip}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
            <path d="M12 8v6M9 11h6" />
          </svg>
        </div>
        <div>
          <div className={s.logoTitle}>MedScan</div>
          <div className={s.logoSub}>Medicine, made friendly</div>
        </div>
      </div>

      <nav className={s.nav}>
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `${s.link} ${isActive ? s.active : ''}`}
          >
            <span className={s.icon}><Icon /></span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={s.helpCard}>
        <div className={s.helpTitle}>Need a hand?</div>
        <div className={s.helpText}>Ask a pharmacist near you for personalized advice.</div>
      </div>
    </aside>
  );
}