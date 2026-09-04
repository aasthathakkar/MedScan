import { useNavigate } from 'react-router-dom';
import { Disclaimer } from '../components/UI';
import s from './Home.module.css';

const PillIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11a3 3 0 1 0 6 0V5a3 3 0 0 0-6 0z" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);
const ScanGlyph = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M3 12h18" />
  </svg>
);

const features = [
  {
    to: '/symptoms', title: 'Symptom Checker',
    desc: 'Describe how you feel and see medicines commonly used for it.',
    icon: <><path d="M9 11a3 3 0 1 0 6 0V5a3 3 0 0 0-6 0z" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  },
  {
    to: '/scan', title: 'Scan Expiry',
    desc: 'Photograph a strip to read its name and check the expiry date.',
    icon: <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M3 12h18" /></>,
  },
  {
    to: '/check', title: 'Safety Check',
    desc: 'Enter a medicine and your age to see warnings and interactions.',
    icon: <><path d="M9 12.5 11 14.5 15.5 10" /><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" /></>,
  },
  {
    to: '/medicines', title: 'Medicine Encyclopedia',
    desc: 'Look up any medicine: uses, side effects, and warnings.',
    icon: <><rect x="3" y="8" width="13" height="13" rx="3" /><path d="M8 8V6a3 3 0 0 1 6 0v2" /><path d="M9.5 14.5h3" /></>,
  },
];

const steps = [
  { num: '1', title: 'Scan or describe', desc: 'Photograph a medicine strip, or type your symptoms.' },
  { num: '2', title: 'We look it up', desc: 'MedScan checks its knowledge base and flags anything important.' },
  { num: '3', title: 'Decide with confidence', desc: 'Read clear guidance and know your next step.' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={s.page}>
      <header className={s.topbar}>
        <h1 className={s.pageTitle}>Home</h1>
        <button className={s.searchPill} onClick={() => navigate('/medicines')}>
          <span>Search medicines</span>
          <span className={s.searchIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
          </span>
        </button>
      </header>

      <section className={s.hero}>
        <div className={s.heroInner}>
          <div className={s.heroTag}>
            <span className={s.heroDot} /> Your medicine, explained
          </div>
          <h2 className={s.heroHeadline}>Know what you're taking</h2>
          <p className={s.heroSub}>Scan a strip to check its expiry, look up what a medicine treats, and see safety warnings — all in plain language.</p>
          <div className={s.heroCtas}>
            <button className={s.ctaPrimary} onClick={() => navigate('/symptoms')}>
              {PillIcon} Check symptoms
            </button>
            <button className={s.ctaGhost} onClick={() => navigate('/scan')}>
              {ScanGlyph} Scan a strip
            </button>
          </div>
        </div>

        <div className={s.heroPreview}>
          <div className={s.previewLabel}>Sample result</div>
          <div className={s.previewRow}>
            <div>
              <div className={s.previewName}>Paracetamol 500 mg</div>
              <div className={s.previewMeta}>Lowers fever, eases mild pain</div>
            </div>
            <span className={`${s.previewStatus} ${s.statusOk}`}>Valid · Jun 2027</span>
          </div>
          <div className={s.previewDivider} />
          <div className={s.previewRow}>
            <div>
              <div className={s.previewName}>Amoxicillin 250 mg</div>
              <div className={s.previewMeta}>Check with a doctor before use</div>
            </div>
            <span className={`${s.previewStatus} ${s.statusWarn}`}>Expires soon</span>
          </div>
        </div>
      </section>

      <section>
        <h3 className={s.sectionTitle}>What you can do</h3>
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
              <div className={s.featureIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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