import { useNavigate } from 'react-router-dom';
import { Disclaimer } from '../components/UI';
import s from './Home.module.css';

const PillIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11a3 3 0 1 0 6 0V5a3 3 0 0 0-6 0z" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);
const ScanGlyph = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M3 12h18" />
  </svg>
);

const features = [
  {
    to: '/symptoms', title: 'Symptom Checker', desc: 'Tell us how you feel and get gentle, possible next steps.',
    bg: '#F1ECFF', fg: '#7C5CFC',
    icon: <><path d="M9 11a3 3 0 1 0 6 0V5a3 3 0 0 0-6 0z" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  },
  {
    to: '/scan', title: 'Scan Expiry', desc: 'Point your camera at a strip to read its expiry date.',
    bg: '#FFEFE6', fg: '#FF8A5C',
    icon: <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M3 12h18" /></>,
  },
  {
    to: '/check', title: 'Safety Check', desc: 'See interactions, warnings, and who should avoid it.',
    bg: '#E6F8F0', fg: '#1FB877',
    icon: <><path d="M9 12.5 11 14.5 15.5 10" /><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" /></>,
  },
  {
    to: '/medicines', title: 'Medicine Encyclopedia', desc: 'Look up any medicine in friendly, clear words.',
    bg: '#EAF1FE', fg: '#5B8DEF',
    icon: <><rect x="3" y="8" width="13" height="13" rx="3" /><path d="M8 8V6a3 3 0 0 1 6 0v2" /><path d="M9.5 14.5h3" /></>,
  },
];

const steps = [
  { num: '1', title: 'Tell or scan', desc: 'Describe a symptom or scan a medicine strip.' },
  { num: '2', title: 'We look it up', desc: 'MedScan finds clear, trustworthy information.' },
  { num: '3', title: 'You feel sure', desc: 'Read simple guidance and know what to do next.' },
];

const stats = [
  { value: '20+', label: 'medicines' },
  { value: 'Instant', label: 'results' },
  { value: 'Plain', label: 'language' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={s.page}>
      <header className={s.topbar}>
        <div>
          <div className={s.greeting}>Welcome back 👋</div>
          <h1 className={s.pageTitle}>Home</h1>
        </div>
        <button className={s.searchPill} onClick={() => navigate('/medicines')}>
          <span>Search medicines</span>
          <span className={s.searchIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C5CFC" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
          </span>
        </button>
      </header>

      <section className={s.hero}>
        <div className={s.heroBlobA} />
        <div className={s.heroBlobB} />
        <div className={s.heroInner}>
          <div className={s.heroTag}>
            <span className={s.heroDot} /> Your friendly medicine companion
          </div>
          <h2 className={s.heroHeadline}>Know your medicine<br />before you take it</h2>
          <p className={s.heroSub}>Check symptoms, scan a strip for expiry, and look up safety info — all in plain, friendly language.</p>
          <div className={s.heroCtas}>
            <button className={s.ctaPrimary} onClick={() => navigate('/symptoms')}>
              {PillIcon} Check Symptoms
            </button>
            <button className={s.ctaGhost} onClick={() => navigate('/scan')}>
              {ScanGlyph} Scan a Strip
            </button>
          </div>
          <div className={s.statPills}>
            {stats.map(st => (
              <div key={st.label} className={s.statPill}>
                <span className={s.statValue}>{st.value}</span>
                <span className={s.statLabel}>{st.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className={s.sectionHead}>
          <h3 className={s.sectionTitle}>What can MedScan do?</h3>
          <span className={s.sectionNote}>Four ways to feel sure</span>
        </div>
        <div className={s.featureGrid}>
          {features.map(f => (
            <div
              key={f.to}
              className={s.featureCard}
              role="button"
              tabIndex={0}
              onClick={() => navigate(f.to)}
              onKeyDown={e => e.key === 'Enter' && navigate(f.to)}
            >
              <div className={s.featureIcon} style={{ background: f.bg }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={f.fg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {f.icon}
                </svg>
              </div>
              <div className={s.featureTitle}>{f.title}</div>
              <div className={s.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={s.howCard}>
        <h3 className={s.sectionTitle}>How it works</h3>
        <div className={s.steps}>
          <div className={s.stepLine} />
          {steps.map(st => (
            <div key={st.num} className={s.step}>
              <div className={s.stepNum}>{st.num}</div>
              <div className={s.stepTitle}>{st.title}</div>
              <div className={s.stepDesc}>{st.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <Disclaimer />
    </div>
  );
}