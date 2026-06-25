import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Btn, Disclaimer } from '../components/UI';
import s from './Home.module.css';

const features = [
  { emoji: '💊', title: 'Symptom Checker',  desc: 'Describe what you feel, get medicine suggestions', to: '/symptoms' },
  { emoji: '📷', title: 'Scan Expiry',      desc: 'Point your camera at a strip to check the date',  to: '/scan'     },
  { emoji: '🛡️', title: 'Safety Check',     desc: 'Verify age limits and drug interactions',          to: '/check'    },
];

const steps = ['Describe or scan', 'Get instant analysis', 'Stay informed'];
const stats  = ['20+ medicines', 'Instant results', 'Free to use'];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={s.page}>
      <section className={s.hero}>
        <h1 className={s.heroHeadline}>Know your medicine before you take it.</h1>
        <p className={s.heroSubtext}>
          Check symptoms, scan expiry dates, and verify safety — all in one place.
        </p>
        <div className={s.heroCtas}>
          <Btn variant="primary" size="lg" onClick={() => navigate('/symptoms')}>Check Symptoms</Btn>
          <Btn variant="outline" size="lg" onClick={() => navigate('/scan')}>Scan a Strip</Btn>
        </div>
        <div className={s.statPills}>
          {stats.map(stat => (
            <span key={stat} className={s.statPill}>{stat}</span>
          ))}
        </div>
      </section>

      <section>
        <h2 className={s.sectionTitle}>What can MedScan do?</h2>
        <div className={s.featureGrid}>
          {features.map(f => (
            <Card
              key={f.to}
              className={s.featureCard}
              onClick={() => navigate(f.to)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate(f.to)}
            >
              <div className={s.featureEmoji}>{f.emoji}</div>
              <div className={s.featureTitle}>{f.title}</div>
              <div className={s.featureDesc}>{f.desc}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className={s.howSection}>
        <h2 className={s.sectionTitle}>How it works</h2>
        <div className={s.stepsRow}>
          {steps.map((text, i) => (
            // FIX: replaced <div style={{ display:'contents' }}> with Fragment
            <Fragment key={i}>
              {i > 0 && <div className={s.connector} />}
              <div className={s.step}>
                <div className={s.stepCircle}>{i + 1}</div>
                <span className={s.stepText}>{text}</span>
              </div>
            </Fragment>
          ))}
        </div>
      </section>

      <Disclaimer />
    </div>
  );
}