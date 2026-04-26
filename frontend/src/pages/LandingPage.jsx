import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './LandingPage.css';
import { FaMicrophone, FaCalendarAlt, FaBoxes, FaBell, FaHospital, FaUserCheck } from 'react-icons/fa';
import { GiHerbsBundle } from 'react-icons/gi';
import { MdMedicalServices } from 'react-icons/md';
import { FaTooth } from 'react-icons/fa';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

const features = [
  {
    icon: <FaMicrophone />,
    title: 'Voice Prescriptions',
    desc: 'Dictate prescriptions hands-free. AI converts speech to structured medicine entries in real-time.',
  },
  {
    icon: <FaCalendarAlt />,
    title: 'Smart Scheduling',
    desc: 'Auto-generate time slots, manage walk-ins and booked appointments with zero conflicts.',
  },
  {
    icon: <FaBoxes />,
    title: 'Inventory Management',
    desc: 'Track medicines and supplies. Get alerts before stock runs out with auto-reorder suggestions.',
  },
  {
    icon: <FaBell />,
    title: 'Patient Reminders',
    desc: 'Automated WhatsApp reminders for appointments, follow-ups, and medicine schedules.',
  },
  {
    icon: <FaHospital />,
    title: 'Multi-Sector Support',
    desc: 'Built for General Physicians, Ayurvedic practitioners, and Dental clinics with sector-specific tools.',
  },
  {
    icon: <FaUserCheck />,
    title: 'Doctor Verification',
    desc: 'NMC / CCIM / DCI registration verified. Builds patient trust with authenticated clinic profiles.',
  },
];

const sectors = [
  {
    id: 'general',
    icon: <MdMedicalServices />,
    title: 'General Physician',
    desc: 'Complete OPD management for general practice clinics — the most common clinic type in India.',
    checks: ['10-min default slot duration', 'Common prescription templates', 'Standard vitals tracking'],
    iconBg: 'rgba(255,255,255,0.1)',
    checkBg: 'rgba(5,150,105,0.2)',
    checkColor: '#6ee7b7',
  },
  {
    id: 'ayurvedic',
    icon: <GiHerbsBundle />,
    title: 'Ayurvedic',
    desc: 'Tailored for BAMS practitioners with support for traditional formulations and longer consultations.',
    checks: ['20-min default slot duration', 'Ayurvedic formulation support', 'Prakriti-based notes'],
    iconBg: 'rgba(255,255,255,0.1)',
    checkBg: 'rgba(217,119,6,0.2)',
    checkColor: '#fcd34d',
  },
  {
    id: 'dental',
    icon: <FaTooth />,
    title: 'Dental',
    desc: 'Designed for BDS/MDS clinics with procedure tracking, treatment plans, and dental charting.',
    checks: ['30-min default slot duration', 'Procedure-based billing', 'Treatment plan tracking'],
    iconBg: 'rgba(255,255,255,0.1)',
    checkBg: 'rgba(124,58,237,0.2)',
    checkColor: '#c4b5fd',
  },
];
const steps = [
  { num: '1', title: 'Register Your Clinic', desc: 'Verify with GST number and doctor registration in under 2 minutes.' },
  { num: '2', title: 'Set Up Your Team', desc: 'Add receptionists and configure working hours, slots, and inventory.' },
  { num: '3', title: 'Start Seeing Patients', desc: 'Patients discover you on the map. Manage walk-ins and appointments live.' },
];
  return (
    <div className="landing">

      {/* ─── PAGE-WIDE VIDEO BG ─── */}
      <video
        className="page-video-bg"
        autoPlay
        muted
        loop
        playsInline
        src="/tisd_bg.mp4"
      />
      <div className="page-video-overlay" />

      {/* ─── NAVBAR ─── */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <a href="/" className="landing-logo">
          <div className="landing-logo-icon">+</div>
          <span>Clinic<em>Pro</em></span>
        </a>
        <div className="landing-nav-links">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#how-it-works" className="landing-nav-link">How It Works</a>
          <a href="#sectors" className="landing-nav-link">Sectors</a>
          <button className="landing-nav-btn primary" onClick={() => navigate('/clinic')}>
            Login
          </button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="dot" />
            Built for Indian Clinics
          </div>
          <h1>
            Run your clinic smarter.{' '}
            <span className="serif">Not harder.</span>
          </h1>
          <p className="hero-sub">
            ClinicPro brings AI-powered management to every small clinic in India.
            Appointments, prescriptions, inventory, reminders — all in one place.
          </p>
          <div className="hero-buttons">
            <button className="hero-btn primary" onClick={() => navigate('/clinic')}>
              I have a clinic
            </button>
            <button className="hero-btn outline" onClick={() => navigate('/patient')}>
              I am a patient
            </button>
          </div>
          <p className="hero-trust">
            <strong>Trusted by clinics</strong> across India · HIPAA-ready · Secure by design
          </p>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="features" id="features">
        <div className="section-header">
          <div className="section-label">Features</div>
          <h2>Everything your clinic needs in one place</h2>
          <p>From patient walk-in to prescription delivery — automate every step of your clinic workflow.</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="feature-icon" style={{ background: f.bg }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-header">
          <div className="section-label">Get Started</div>
          <h2>Up and running in 3 steps</h2>
          <p>No complex setup. No training needed. Just register, configure, and start managing patients.</p>
        </div>
        <div className="steps-row">
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start' }}>
              {i > 0 && <div className="step-arrow">→</div>}
              <div className="step">
                <div className="step-number">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECTORS ─── */}
      <section className="sectors" id="sectors">
        <div className="section-header">
          <div className="section-label">Sectors</div>
          <h2>Built for every type of practice</h2>
          <p>Specialized workflows for different medical sectors with smart defaults.</p>
        </div>
        <div className="sectors-grid">
          {sectors.map(s => (
            <div className={`sector-card ${s.id}`} key={s.id}>
              <div className="sector-icon" style={{ background: s.iconBg }}>{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <div className="sector-features">
                {s.checks.map((c, i) => (
                  <span key={i}>
                    <span className="check" style={{ background: s.checkBg, color: s.checkColor }}></span>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="cta-banner">
        <h2>Ready to modernize your clinic?</h2>
        <p>Join hundreds of clinics already using ClinicPro to save time and serve patients better.</p>
        <button
          className="hero-btn primary"
          onClick={() => navigate('/clinic')}
        >
          Get Started for Free
        </button>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div>
            <div className="footer-brand">
              <div className="landing-logo-icon" style={{ width: 32, height: 32, fontSize: 16 }}>+</div>
              <span>Clinic<em>Pro</em></span>
            </div>
            <p className="footer-tagline">Smart clinic management for India</p>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#sectors">Sectors</a>
            <a href="#how-it-works">How it works</a>
            <a href="mailto:support@clinicpro.in">Contact</a>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} ClinicPro. All rights reserved. Made with love in India.
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;