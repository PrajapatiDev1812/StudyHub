/**
 * LearnMorePage.jsx — Dark Theme
 * StudyHub — AI-Powered Learning Management System
 * Premium "Learn More" landing page, dark aesthetic.
 *
 * Sub-components (in order):
 *   ScrollProgressBar · BackToTopButton · HeroSection · AboutSection
 *   AudienceSection · AIFeaturesSection · WorkflowSection · FeatureGrid
 *   SecuritySection · MissionVisionSection · StatsSection · FAQSection
 *   CTASection · Footer
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import {
  BookOpen,
  Bot,
  BarChart3,
  Target,
  GraduationCap,
  Users,
  Settings,
  Brain,
  Video,
  TrendingUp,
  Upload,
  Zap,
  Shield,
  Lock,
  Key,
  Server,
  Eye,
  ChevronDown,
  ArrowUp,
  GitBranch,
  Mail,
  Star,
  Layers,
  FileText,
  PlayCircle,
  Heart,
  Activity,
  CheckCircle,
  Search,
  Smartphone,
  LayoutDashboard,
  UserCheck,
  BookMarked,
  Award,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   DARK THEME TOKENS
───────────────────────────────────────────────────────────── */
const T = {
  bgPrimary:   '#0a0a1a',
  bgSecondary: '#0f0f23',
  bgCard:      'rgba(20, 20, 52, 0.75)',
  bgCardHover: 'rgba(30, 30, 72, 0.9)',
  bgGlass:     'rgba(255,255,255,0.04)',
  border:      'rgba(255,255,255,0.08)',
  borderGlow:  'rgba(108,99,255,0.35)',
  textPrimary:   '#f0f0ff',
  textSecondary: '#a0a0c0',
  textMuted:     '#606080',
  indigo:  '#6c63ff',
  cyan:    '#06B6D4',
  gradient: 'linear-gradient(135deg,#6c63ff 0%,#06B6D4 100%)',
  shadow:   '0 8px 32px rgba(0,0,0,0.45)',
  glow:     '0 0 24px rgba(108,99,255,0.25)',
};

/* ─────────────────────────────────────────────────────────────
   ANIMATION VARIANTS & HELPERS
───────────────────────────────────────────────────────────── */
const fadeUpVariant = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};
const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const viewportConfig = { once: true, margin: '-80px' };

function useMotionConfig() {
  const shouldReduce = useReducedMotion();
  return {
    shouldReduce,
    fadeUp: shouldReduce
      ? {}
      : { initial: 'hidden', whileInView: 'visible', viewport: viewportConfig },
    transition: shouldReduce ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' },
    cardHover:  shouldReduce ? {} : { whileHover: { y: -4, scale: 1.01 } },
    btnHover:   shouldReduce ? {} : { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } },
    iconHover:  shouldReduce ? {} : { whileHover: { rotate: 8, scale: 1.15 } },
  };
}

/* ─────────────────────────────────────────────────────────────
   1. SCROLL PROGRESS BAR
───────────────────────────────────────────────────────────── */
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-1 z-[60]"
      style={{ scaleX, background: T.gradient, transformOrigin: 'left' }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   2. BACK TO TOP BUTTON
───────────────────────────────────────────────────────────── */
function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="btt"
          onClick={scrollToTop}
          aria-label="Back to top"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          style={{ background: T.gradient, boxShadow: T.glow }}
        >
          <ArrowUp size={20} className="text-white" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────────────────
   3. HERO SECTION
───────────────────────────────────────────────────────────── */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 400" fill="none" xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true" className="w-full max-w-md mx-auto drop-shadow-2xl">
      {/* Glow ring */}
      <circle cx="240" cy="200" r="175" fill="url(#bgGrad)" opacity="0.18" />
      {/* Laptop */}
      <rect x="120" y="190" width="240" height="150" rx="12" fill="#1a1040" stroke="#6c63ff" strokeWidth="1.5" />
      <rect x="132" y="200" width="216" height="120" rx="6" fill="#080618" />
      <rect x="148" y="216" width="110" height="8" rx="4" fill="#6c63ff" opacity="0.9" />
      <rect x="148" y="232" width="150" height="6" rx="3" fill="#6c63ff" opacity="0.5" />
      <rect x="148" y="246" width="130" height="6" rx="3" fill="#6c63ff" opacity="0.35" />
      <rect x="148" y="260" width="90" height="6" rx="3" fill="#6c63ff" opacity="0.25" />
      {/* Chart */}
      <rect x="268" y="248" width="14" height="40" rx="3" fill="#06B6D4" opacity="0.85" />
      <rect x="286" y="258" width="14" height="30" rx="3" fill="#6c63ff" opacity="0.85" />
      <rect x="304" y="242" width="14" height="46" rx="3" fill="#06B6D4" opacity="0.95" />
      {/* Laptop base */}
      <rect x="100" y="340" width="280" height="14" rx="7" fill="#1a1040" />
      <rect x="190" y="340" width="100" height="6" rx="3" fill="#0f0a30" />
      {/* Student head */}
      <circle cx="240" cy="130" r="38" fill="url(#skinGrad)" />
      <ellipse cx="240" cy="100" rx="36" ry="20" fill="#1a1040" />
      <ellipse cx="228" cy="128" rx="5" ry="6" fill="#1a1040" opacity="0.7" />
      <ellipse cx="252" cy="128" rx="5" ry="6" fill="#1a1040" opacity="0.7" />
      <path d="M232 142 Q240 150 248 142" stroke="#1a1040" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M190 170 Q210 160 240 158 Q270 160 290 170 L295 190 L185 190 Z" fill="#6c63ff" />
      {/* Neural nodes — right */}
      <circle cx="390" cy="80"  r="14" fill="#06B6D4" opacity="0.9" />
      <circle cx="430" cy="130" r="10" fill="#6c63ff" opacity="0.85" />
      <circle cx="380" cy="160" r="10" fill="#06B6D4" opacity="0.75" />
      <circle cx="420" cy="190" r="8"  fill="#6c63ff" opacity="0.65" />
      <circle cx="390" cy="220" r="6"  fill="#06B6D4" opacity="0.55" />
      <line x1="390" y1="80"  x2="430" y2="130" stroke="#06B6D4" strokeWidth="1.5" opacity="0.5" />
      <line x1="390" y1="80"  x2="380" y2="160" stroke="#6c63ff" strokeWidth="1.5" opacity="0.5" />
      <line x1="430" y1="130" x2="420" y2="190" stroke="#06B6D4" strokeWidth="1.5" opacity="0.5" />
      <line x1="380" y1="160" x2="390" y2="220" stroke="#6c63ff" strokeWidth="1.5" opacity="0.5" />
      <line x1="420" y1="190" x2="390" y2="220" stroke="#06B6D4" strokeWidth="1.5" opacity="0.5" />
      {/* Neural nodes — left */}
      <circle cx="80"  cy="90"  r="12" fill="#6c63ff" opacity="0.85" />
      <circle cx="48"  cy="140" r="9"  fill="#06B6D4" opacity="0.75" />
      <circle cx="90"  cy="160" r="9"  fill="#6c63ff" opacity="0.65" />
      <circle cx="58"  cy="200" r="7"  fill="#06B6D4" opacity="0.55" />
      <line x1="80"  y1="90"  x2="48"  y2="140" stroke="#6c63ff" strokeWidth="1.5" opacity="0.5" />
      <line x1="80"  y1="90"  x2="90"  y2="160" stroke="#06B6D4" strokeWidth="1.5" opacity="0.5" />
      <line x1="48"  y1="140" x2="58"  y2="200" stroke="#6c63ff" strokeWidth="1.5" opacity="0.5" />
      <line x1="90"  y1="160" x2="58"  y2="200" stroke="#06B6D4" strokeWidth="1.5" opacity="0.5" />
      {/* Floating badges */}
      <rect x="50"  y="40" width="32" height="32" rx="8" fill="#6c63ff" opacity="0.15" />
      <text x="58"  y="62" fontSize="16" aria-hidden="true">📚</text>
      <rect x="390" y="30" width="32" height="32" rx="8" fill="#06B6D4" opacity="0.15" />
      <text x="398" y="52" fontSize="16" aria-hidden="true">🤖</text>
      <rect x="420" y="260" width="32" height="32" rx="8" fill="#6c63ff" opacity="0.15" />
      <text x="428" y="282" fontSize="16" aria-hidden="true">📊</text>
      <rect x="30"  y="270" width="32" height="32" rx="8" fill="#06B6D4" opacity="0.15" />
      <text x="38"  y="292" fontSize="16" aria-hidden="true">🎯</text>
      {/* Sparks */}
      <circle cx="340" cy="60"  r="4" fill="#06B6D4" opacity="0.7" />
      <circle cx="360" cy="40"  r="3" fill="#6c63ff" opacity="0.6" />
      <circle cx="130" cy="50"  r="4" fill="#6c63ff" opacity="0.7" />
      <circle cx="110" cy="35"  r="3" fill="#06B6D4" opacity="0.6" />
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#6c63ff" />
          <stop offset="100%" stopColor="#06B6D4" />
        </radialGradient>
        <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function HeroSection({ mc }) {
  return (
    <section
      aria-label="Hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: `radial-gradient(ellipse at 60% 50%, rgba(108,99,255,0.12) 0%, transparent 70%), ${T.bgPrimary}` }}
    >
      {/* Animated blobs */}
      <div aria-hidden="true" className="absolute top-16 left-8 w-80 h-80 rounded-full animate-pulse blur-3xl pointer-events-none"
        style={{ background: 'rgba(108,99,255,0.18)' }} />
      <div aria-hidden="true" className="absolute bottom-16 right-8 w-96 h-96 rounded-full animate-pulse blur-3xl pointer-events-none"
        style={{ background: 'rgba(6,182,212,0.15)', animationDelay: '1.5s' }} />
      <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full animate-pulse blur-2xl pointer-events-none"
        style={{ background: 'rgba(108,99,255,0.08)', animationDelay: '3s' }} />

      <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Text */}
        <motion.div variants={staggerContainer} {...mc.fadeUp} transition={mc.transition}>
          <motion.div variants={fadeUpVariant} transition={{ duration: 0.4 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 border"
              style={{ background: 'rgba(108,99,255,0.12)', borderColor: 'rgba(108,99,255,0.3)', color: '#a5b4fc' }}>
              <Zap size={14} /> AI-Powered Learning Platform
            </span>
          </motion.div>

          <motion.h1 variants={fadeUpVariant} transition={{ duration: 0.5 }}
            className="text-5xl sm:text-6xl font-bold leading-tight mb-6"
            style={{ color: T.textPrimary }}>
            Learn Smarter{' '}
            <span style={{ background: T.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              with AI
            </span>
          </motion.h1>

          <motion.p variants={fadeUpVariant} transition={{ duration: 0.5 }}
            className="text-xl leading-relaxed mb-10 max-w-lg"
            style={{ color: T.textSecondary }}>
            StudyHub combines AI, automation, and modern tools to create smarter
            educational experiences for students, teachers, and institutions.
          </motion.p>

          <motion.div variants={fadeUpVariant} transition={{ duration: 0.5 }} className="flex flex-wrap gap-4">
            <motion.div {...mc.btnHover} transition={{ duration: 0.15 }}>
              <Link to="/register" id="hero-get-started"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-lg focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-all duration-200"
                style={{ background: T.gradient, boxShadow: '0 4px 24px rgba(108,99,255,0.4)' }}>
                <GraduationCap size={20} /> Get Started
              </Link>
            </motion.div>
            <motion.div {...mc.btnHover} transition={{ duration: 0.15 }}>
              <Link to="/login" id="hero-login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-all duration-200"
                style={{ borderColor: 'rgba(108,99,255,0.4)', color: '#a5b4fc', background: 'rgba(108,99,255,0.08)' }}>
                Login
              </Link>
            </motion.div>
          </motion.div>

          <motion.div variants={fadeUpVariant} transition={{ duration: 0.5 }}
            className="flex items-center gap-6 mt-10 text-sm" style={{ color: T.textMuted }}>
            {['Free to start', 'AI-powered quizzes', 'Secure & private'].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle size={15} className="text-green-400" /> {t}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Illustration */}
        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={viewportConfig} transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex justify-center">
          <HeroIllustration />
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div aria-hidden="true"
        animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ color: T.textMuted }}>
        <ChevronDown size={28} />
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   4. ABOUT SECTION
───────────────────────────────────────────────────────────── */
const aboutCards = [
  { icon: BookOpen, title: 'Course Management', desc: 'Organize subjects, topics, and multimedia content with ease.', accent: '#6c63ff' },
  { icon: Bot,      title: 'AI Assistance',     desc: 'Smart tutoring, Q&A generation, and content summarization.', accent: '#06B6D4' },
  { icon: BarChart3,title: 'Analytics',          desc: 'Deep insights into learning patterns and performance metrics.', accent: '#8b5cf6' },
  { icon: Target,   title: 'Personalized Learning', desc: "AI-driven revision plans tailored to every learner's needs.", accent: '#6c63ff' },
];

function AboutSection({ mc }) {
  return (
    <section id="about" aria-label="What is StudyHub" className="py-20"
      style={{ background: T.bgSecondary }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div variants={staggerContainer} {...mc.fadeUp}>
            <motion.p variants={fadeUpVariant} transition={{ duration: 0.3 }}
              className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#a5b4fc' }}>
              About the Platform
            </motion.p>
            <motion.h2 variants={fadeUpVariant} transition={{ duration: 0.4 }}
              className="text-4xl font-bold mb-6" style={{ color: T.textPrimary }}>
              What is StudyHub?
            </motion.h2>
            <motion.p variants={fadeUpVariant} transition={{ duration: 0.4 }}
              className="text-lg leading-relaxed mb-6" style={{ color: T.textSecondary }}>
              StudyHub is a modern, AI-powered Learning Management System (LMS)
              designed to bridge the gap between traditional education and cutting-edge
              technology. Built for students, educators, and institutions, it combines
              structured course delivery with intelligent automation.
            </motion.p>
            <motion.p variants={fadeUpVariant} transition={{ duration: 0.4 }}
              className="text-lg leading-relaxed" style={{ color: T.textSecondary }}>
              From AI-generated quizzes and smart video processing to personalized
              revision plans and detailed analytics, StudyHub transforms how knowledge
              is delivered, consumed, and measured.
            </motion.p>
          </motion.div>

          {/* Right — 2×2 grid */}
          <motion.div variants={staggerContainer} {...mc.fadeUp} className="grid grid-cols-2 gap-5">
            {aboutCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div key={i} variants={fadeUpVariant} transition={{ duration: 0.4 }}
                  {...mc.cardHover}
                  className="rounded-2xl p-6 border transition-all duration-200 ease-out cursor-default"
                  style={{ background: T.bgCard, borderColor: T.border, boxShadow: T.shadow }}>
                  <motion.div {...mc.iconHover} transition={{ duration: 0.2 }}>
                    <div className="inline-flex p-3 rounded-xl mb-4"
                      style={{ background: `${card.accent}18` }}>
                      <Icon size={22} style={{ color: card.accent }} />
                    </div>
                  </motion.div>
                  <h3 className="text-base font-bold mb-1" style={{ color: T.textPrimary }}>{card.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: T.textSecondary }}>{card.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   5. AUDIENCE SECTION
───────────────────────────────────────────────────────────── */
const audiences = [
  {
    icon: GraduationCap, title: 'Students', accentTop: '#6c63ff',
    points: ['Access curated courses & topics', 'Take AI-generated quizzes', 'Track progress with analytics', 'Chat with an AI tutor anytime', 'Earn badges & stay motivated'],
  },
  {
    icon: BookOpen, title: 'Teachers', accentTop: '#06B6D4',
    points: ['Create and publish courses easily', 'Auto-generate quizzes from content', 'Monitor student performance', 'Upload PDFs, videos, and notes', 'Get AI-powered teaching insights'],
  },
  {
    icon: Settings, title: 'Administrators', accentTop: '#8b5cf6',
    points: ['Manage users, roles & permissions', 'Oversee entire curriculum structure', 'View institution-wide analytics', 'Configure platform settings', 'Manage content library'],
  },
];

function AudienceSection({ mc }) {
  return (
    <section id="audience" aria-label="Who is StudyHub for" className="py-20"
      style={{ background: T.bgPrimary }}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div {...mc.fadeUp} variants={staggerContainer} className="text-center mb-16">
          <motion.p variants={fadeUpVariant} transition={{ duration: 0.3 }}
            className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#a5b4fc' }}>
            Built for Everyone
          </motion.p>
          <motion.h2 variants={fadeUpVariant} transition={{ duration: 0.4 }}
            className="text-4xl font-bold" style={{ color: T.textPrimary }}>
            Who is it for?
          </motion.h2>
        </motion.div>

        <motion.div variants={staggerContainer} {...mc.fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {audiences.map((aud, i) => {
            const Icon = aud.icon;
            return (
              <motion.div key={i} variants={fadeUpVariant} transition={{ duration: 0.4 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl p-8 border-t-4 border transition-all duration-200 ease-out"
                style={{ background: T.bgCard, borderColor: T.border, borderTopColor: aud.accentTop, boxShadow: T.shadow }}>
                <div className="inline-flex p-4 rounded-2xl mb-5"
                  style={{ background: `${aud.accentTop}18` }}>
                  <Icon size={28} style={{ color: aud.accentTop }} />
                </div>
                <h3 className="text-xl font-bold mb-5" style={{ color: T.textPrimary }}>{aud.title}</h3>
                <ul className="space-y-3">
                  {aud.points.map((pt, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm" style={{ color: T.textSecondary }}>
                      <CheckCircle size={15} className="text-green-400 mt-0.5 shrink-0" /> {pt}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   6. AI FEATURES (Darkest section)
───────────────────────────────────────────────────────────── */
const aiFeatures = [
  { icon: Bot,        title: 'AI Question Generator',   desc: "Generate MCQs aligned to Bloom's Taxonomy with configurable difficulty levels — instantly from any content.", accent: '#06B6D4' },
  { icon: Video,      title: 'Smart Video Processing',  desc: 'Auto-generate transcripts, chapter summaries, and quiz questions directly from uploaded video lectures.',    accent: '#6c63ff' },
  { icon: Brain,      title: 'Personalized Learning',   desc: "AI-crafted revision plans and topic recommendations based on your performance patterns and weak areas.",      accent: '#06B6D4' },
  { icon: TrendingUp, title: 'Learning Analytics',      desc: 'Real-time dashboards tracking progress, engagement, and weak area detection for every learner.',             accent: '#6c63ff' },
];

function AIFeaturesSection({ mc }) {
  return (
    <section id="ai-features" aria-label="AI Features" className="py-20"
      style={{ background: '#060614' }}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div {...mc.fadeUp} variants={staggerContainer} className="text-center mb-16">
          <motion.p variants={fadeUpVariant} transition={{ duration: 0.3 }}
            className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#06B6D4' }}>
            Powered by Artificial Intelligence
          </motion.p>
          <motion.h2 variants={fadeUpVariant} transition={{ duration: 0.4 }}
            className="text-4xl font-bold" style={{ color: T.textPrimary }}>
            Next-Gen AI Features
          </motion.h2>
          <motion.p variants={fadeUpVariant} transition={{ duration: 0.4 }}
            className="mt-4 max-w-xl mx-auto" style={{ color: T.textSecondary }}>
            StudyHub's AI layer works behind the scenes to make learning more intelligent, adaptive, and efficient.
          </motion.p>
        </motion.div>

        <motion.div variants={staggerContainer} {...mc.fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aiFeatures.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div key={i} variants={fadeUpVariant} transition={{ duration: 0.4 }}
                {...mc.cardHover}
                className="rounded-2xl p-8 border transition-all duration-200 ease-out group"
                style={{ background: 'rgba(15,15,35,0.8)', borderColor: 'rgba(108,99,255,0.2)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(108,99,255,0.5)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(108,99,255,0.2)'}>
                <motion.div {...mc.iconHover} transition={{ duration: 0.2 }}>
                  <div className="inline-flex p-3 rounded-xl mb-5 transition-colors duration-200"
                    style={{ background: `${feat.accent}14` }}>
                    <Icon size={26} style={{ color: feat.accent }} />
                  </div>
                </motion.div>
                <h3 className="text-xl font-bold mb-3" style={{ color: T.textPrimary }}>{feat.title}</h3>
                <p className="leading-relaxed" style={{ color: T.textSecondary }}>{feat.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   7. WORKFLOW SECTION (Timeline)
───────────────────────────────────────────────────────────── */
const workflowSteps = [
  { number: '01', title: 'Upload Materials',          desc: 'Teachers upload PDFs, videos, and notes into the platform.',                                                  icon: Upload },
  { number: '02', title: 'AI Processes Content',      desc: 'AI extracts key concepts, generates summaries, and builds question banks.',                                   icon: Brain },
  { number: '03', title: 'Students Learn & Practice', desc: 'Students engage with content, take quizzes, and get personalized feedback.',                                  icon: GraduationCap },
  { number: '04', title: 'Analytics Drive Improvement',desc: 'Data-driven insights help educators refine content and teaching strategies.',                               icon: TrendingUp },
];

function WorkflowSection({ mc }) {
  return (
    <section id="how-it-works" aria-label="How StudyHub Works" className="py-20"
      style={{ background: T.bgSecondary }}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div {...mc.fadeUp} variants={staggerContainer} className="text-center mb-16">
          <motion.p variants={fadeUpVariant} transition={{ duration: 0.3 }}
            className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#a5b4fc' }}>
            Simple Workflow
          </motion.p>
          <motion.h2 variants={fadeUpVariant} transition={{ duration: 0.4 }}
            className="text-4xl font-bold" style={{ color: T.textPrimary }}>
            How It Works
          </motion.h2>
        </motion.div>

        {/* Desktop horizontal */}
        <div className="hidden md:flex items-start gap-0">
          {workflowSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportConfig} transition={{ duration: 0.4, delay: i * 0.15 }}
                className="flex-1 relative">
                {i < workflowSteps.length - 1 && (
                  <div aria-hidden="true" className="absolute top-6 left-1/2 w-full h-0.5 z-0"
                    style={{ background: 'linear-gradient(90deg,#6c63ff,rgba(108,99,255,0.2))' }} />
                )}
                <div className="relative z-10 flex flex-col items-center text-center px-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mb-4 text-white"
                    style={{ background: T.gradient, boxShadow: T.glow }}>
                    {step.number}
                  </div>
                  <Icon size={22} className="mb-3" style={{ color: '#a5b4fc' }} />
                  <h3 className="font-bold mb-2 text-sm" style={{ color: T.textPrimary }}>{step.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: T.textSecondary }}>{step.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile vertical */}
        <div className="flex md:hidden flex-col">
          {workflowSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={i}
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={viewportConfig} transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex gap-5 relative">
                {i < workflowSteps.length - 1 && (
                  <div aria-hidden="true" className="absolute left-5 top-12 bottom-0 w-0.5"
                    style={{ background: 'rgba(108,99,255,0.3)' }} />
                )}
                <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white"
                  style={{ background: T.gradient }}>
                  {step.number}
                </div>
                <div className="pb-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={18} style={{ color: '#a5b4fc' }} />
                    <h3 className="font-bold" style={{ color: T.textPrimary }}>{step.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: T.textSecondary }}>{step.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   8. FEATURE GRID
───────────────────────────────────────────────────────────── */
const features = [
  { icon: BookMarked,     label: 'Course Management' },
  { icon: Layers,         label: 'Subjects & Topics' },
  { icon: FileText,       label: 'PDF Library' },
  { icon: PlayCircle,     label: 'Video Lectures' },
  { icon: Heart,          label: 'Favorites' },
  { icon: Activity,       label: 'Learning Progress' },
  { icon: Bot,            label: 'AI Question Generator' },
  { icon: Zap,            label: 'Automated Quiz Creation' },
  { icon: BarChart3,      label: 'Analytics Dashboard' },
  { icon: Smartphone,     label: 'Responsive Design' },
  { icon: Lock,           label: 'Secure Auth' },
  { icon: Search,         label: 'Fast Search' },
  { icon: Shield,         label: 'Role-Based Access' },
  { icon: LayoutDashboard,label: 'Student Dashboard' },
  { icon: UserCheck,      label: 'Teacher Dashboard' },
  { icon: Settings,       label: 'Admin Dashboard' },
];

function FeatureGrid({ mc }) {
  return (
    <section id="features" aria-label="Platform Features" className="py-20"
      style={{ background: T.bgPrimary }}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div {...mc.fadeUp} variants={staggerContainer} className="text-center mb-16">
          <motion.p variants={fadeUpVariant} transition={{ duration: 0.3 }}
            className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#a5b4fc' }}>
            Everything You Need
          </motion.p>
          <motion.h2 variants={fadeUpVariant} transition={{ duration: 0.4 }}
            className="text-4xl font-bold" style={{ color: T.textPrimary }}>
            Platform Features
          </motion.h2>
        </motion.div>

        <motion.div variants={staggerContainer} {...mc.fadeUp}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div key={i} variants={fadeUpVariant} transition={{ duration: 0.3 }}
                whileHover={{ y: -2 }}
                className="flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ease-out cursor-default"
                style={{ background: T.bgCard, borderColor: T.border }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)'; e.currentTarget.style.background = 'rgba(108,99,255,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bgCard; }}>
                <Icon size={18} style={{ color: '#a5b4fc' }} className="shrink-0" />
                <span className="text-sm font-medium" style={{ color: T.textSecondary }}>{feat.label}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   9. SECURITY SECTION
───────────────────────────────────────────────────────────── */
const securityBadges = [
  { icon: Shield, title: 'Secure Authentication', desc: 'JWT-based auth with refresh tokens and session management.' },
  { icon: Lock,   title: 'Data Encryption',       desc: 'All data encrypted in transit and at rest using industry standards.' },
  { icon: Key,    title: 'Two-Factor Auth',        desc: 'Optional 2FA for an additional layer of account security.' },
  { icon: Server, title: 'Reliable Infrastructure',desc: 'Built on proven backend frameworks with fault-tolerant design.' },
  { icon: Users,  title: 'Role-Based Access',      desc: 'Strict permission controls separating student, teacher, and admin roles.' },
];

function SecuritySection({ mc }) {
  return (
    <section id="security" aria-label="Security" className="py-20"
      style={{ background: T.bgSecondary }}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div {...mc.fadeUp} variants={staggerContainer} className="text-center mb-16">
          <motion.div variants={fadeUpVariant} transition={{ duration: 0.3 }}
            className="inline-flex p-4 rounded-2xl mb-5"
            style={{ background: 'rgba(108,99,255,0.15)' }}>
            <Shield size={32} style={{ color: '#a5b4fc' }} />
          </motion.div>
          <motion.h2 variants={fadeUpVariant} transition={{ duration: 0.4 }}
            className="text-4xl font-bold" style={{ color: T.textPrimary }}>
            Enterprise-Grade Security
          </motion.h2>
          <motion.p variants={fadeUpVariant} transition={{ duration: 0.4 }}
            className="mt-4 max-w-xl mx-auto" style={{ color: T.textSecondary }}>
            Your data and your students' data are protected by multiple layers of security at every level.
          </motion.p>
        </motion.div>

        <motion.div variants={staggerContainer} {...mc.fadeUp} className="flex flex-wrap justify-center gap-6">
          {securityBadges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <motion.div key={i} variants={fadeUpVariant} transition={{ duration: 0.4 }}
                {...mc.cardHover}
                className="flex flex-col items-center text-center p-6 rounded-xl border w-48 transition-all duration-200 ease-out"
                style={{ background: T.bgCard, borderColor: T.border, boxShadow: T.shadow }}>
                <div className="inline-flex p-3 rounded-xl mb-4" style={{ background: 'rgba(108,99,255,0.15)' }}>
                  <Icon size={22} style={{ color: '#a5b4fc' }} />
                </div>
                <h3 className="text-sm font-bold mb-2 leading-snug" style={{ color: T.textPrimary }}>{badge.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: T.textSecondary }}>{badge.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   10. MISSION & VISION
───────────────────────────────────────────────────────────── */
function MissionVisionSection({ mc }) {
  return (
    <section id="mission" aria-label="Mission and Vision" className="py-20"
      style={{ background: T.bgPrimary }}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div {...mc.fadeUp} variants={staggerContainer} className="text-center mb-16">
          <motion.h2 variants={fadeUpVariant} transition={{ duration: 0.4 }}
            className="text-4xl font-bold" style={{ color: T.textPrimary }}>
            Our Mission & Vision
          </motion.h2>
        </motion.div>

        <motion.div variants={staggerContainer} {...mc.fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mission */}
          <motion.div variants={fadeUpVariant} transition={{ duration: 0.4 }} {...mc.cardHover}
            className="rounded-2xl p-8 border transition-all duration-200 ease-out"
            style={{ background: 'linear-gradient(135deg,rgba(108,99,255,0.12) 0%,rgba(108,99,255,0.04) 100%)', borderColor: 'rgba(108,99,255,0.25)', boxShadow: T.shadow }}>
            <div className="inline-flex p-4 rounded-2xl mb-6" style={{ background: T.gradient, boxShadow: T.glow }}>
              <Target size={28} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: T.textPrimary }}>Our Mission</h3>
            <p className="text-lg leading-relaxed" style={{ color: T.textSecondary }}>
              Provide intelligent, accessible, and engaging education using AI-powered technology —
              making quality learning available to every student, regardless of location or background.
            </p>
          </motion.div>

          {/* Vision */}
          <motion.div variants={fadeUpVariant} transition={{ duration: 0.4 }} {...mc.cardHover}
            className="rounded-2xl p-8 border transition-all duration-200 ease-out"
            style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.12) 0%,rgba(6,182,212,0.04) 100%)', borderColor: 'rgba(6,182,212,0.25)', boxShadow: T.shadow }}>
            <div className="inline-flex p-4 rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg,#06B6D4,#0284c7)', boxShadow: '0 0 24px rgba(6,182,212,0.3)' }}>
              <Eye size={28} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: T.textPrimary }}>Our Vision</h3>
            <p className="text-lg leading-relaxed" style={{ color: T.textSecondary }}>
              Build a smarter future of education where technology enhances human learning for everyone —
              empowering students, teachers, and institutions to reach their full potential.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   11. STATS SECTION — RAF-based animated counters
───────────────────────────────────────────────────────────── */
const statDefs = [
  { target: 500,   suffix: '+', label: 'Resources' },
  { target: 100,   suffix: '+', label: 'Courses' },
  { target: 1000,  suffix: '+', label: 'Students' },
  { target: 50,    suffix: '+', label: 'Teachers' },
  { target: 10000, suffix: '+', label: 'AI Questions' },
];

function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

function StatsSection() {
  const [counts, setCounts] = useState(statDefs.map(() => 0));
  const containerRef = useRef(null);
  const hasAnimated  = useRef(false);
  const observerRef  = useRef(null);

  useEffect(() => {
    const DURATION = 1500;
    const startAnim = () => {
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / DURATION, 1);
        setCounts(statDefs.map((s) => Math.round(easeOutQuart(p) * s.target)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    observerRef.current = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        observerRef.current.disconnect();
        startAnim();
      }
    }, { threshold: 0.3 });
    if (containerRef.current) observerRef.current.observe(containerRef.current);
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, []);

  return (
    <section id="stats" aria-label="Platform Statistics" ref={containerRef} className="py-20"
      style={{ background: T.gradient }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-white">StudyHub by the Numbers</h2>
          <p className="mt-3 text-indigo-100">Growing every day — join thousands of learners already on the platform.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {statDefs.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-bold text-white mb-1">
                {counts[i].toLocaleString()}<span>{stat.suffix}</span>
              </div>
              <div className="text-indigo-100 text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   12. FAQ SECTION
───────────────────────────────────────────────────────────── */
const faqs = [
  { q: 'What is StudyHub?',                  a: 'StudyHub is an AI-powered Learning Management System (LMS) that combines structured course delivery with intelligent automation. It provides tools for students, teachers, and administrators to manage, deliver, and track educational content efficiently.' },
  { q: 'How does AI help students?',         a: 'AI helps students through personalized revision plans, adaptive quiz generation, instant Q&A with an AI tutor, content summarization, and weak-area detection. The AI continuously learns from your study patterns to give more relevant recommendations over time.' },
  { q: 'Can teachers auto-generate quizzes?',a: "Yes! Teachers can upload any course material — PDFs, videos, or notes — and the AI will automatically generate MCQ quizzes aligned to Bloom's Taxonomy with configurable difficulty levels. This saves hours of manual quiz creation." },
  { q: 'Is my data secure?',                 a: 'Absolutely. StudyHub uses JWT-based authentication, optional two-factor authentication, role-based access control, and encrypted data storage. Your data is never shared with third parties.' },
  { q: 'Can I access StudyHub on mobile?',   a: 'Yes! StudyHub is fully responsive and works seamlessly on smartphones, tablets, and desktops. The interface adapts intelligently to any screen size so you can learn from anywhere.' },
];

function FAQSection({ mc }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const toggle = (i) => setActiveIndex((prev) => (prev === i ? null : i));

  return (
    <section id="faq" aria-label="Frequently Asked Questions" className="py-20"
      style={{ background: T.bgSecondary }}>
      <div className="max-w-3xl mx-auto px-6">
        <motion.div {...mc.fadeUp} variants={staggerContainer} className="text-center mb-16">
          <motion.p variants={fadeUpVariant} transition={{ duration: 0.3 }}
            className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#a5b4fc' }}>
            Got Questions?
          </motion.p>
          <motion.h2 variants={fadeUpVariant} transition={{ duration: 0.4 }}
            className="text-4xl font-bold" style={{ color: T.textPrimary }}>
            Frequently Asked Questions
          </motion.h2>
        </motion.div>

        <motion.div variants={staggerContainer} {...mc.fadeUp} className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = activeIndex === i;
            const panelId   = `faq-panel-${i}`;
            const triggerId = `faq-trigger-${i}`;
            return (
              <motion.div key={i} variants={fadeUpVariant} transition={{ duration: 0.3 }}
                className="rounded-2xl border overflow-hidden"
                style={{ background: T.bgCard, borderColor: isOpen ? 'rgba(108,99,255,0.4)' : T.border, boxShadow: T.shadow }}>
                <button id={triggerId} aria-expanded={isOpen} aria-controls={panelId}
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between p-6 text-left focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-colors duration-200"
                  style={{ background: 'transparent', color: T.textPrimary }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span className="font-semibold pr-4" style={{ color: T.textPrimary }}>{faq.q}</span>
                  <ChevronDown size={20}
                    className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: '#a5b4fc' }} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div id={panelId} role="region" aria-labelledby={triggerId} key="content"
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden">
                      <div className="px-6 pb-6 leading-relaxed border-t pt-4"
                        style={{ color: T.textSecondary, borderColor: T.border }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   13. CTA SECTION
───────────────────────────────────────────────────────────── */
function CTASection({ mc }) {
  return (
    <section id="cta" aria-label="Call to Action" className="relative py-24 overflow-hidden"
      style={{ background: T.gradient }}>
      <div aria-hidden="true" className="absolute top-0 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'rgba(255,255,255,0.05)', transform: 'translate(-50%,-50%)' }} />
      <div aria-hidden="true" className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'rgba(6,182,212,0.1)', transform: 'translate(33%,33%)' }} />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div {...mc.fadeUp} variants={staggerContainer}>
          <motion.div variants={fadeUpVariant} transition={{ duration: 0.3 }}
            className="inline-flex p-4 rounded-2xl mb-6" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <Star size={28} className="text-white" />
          </motion.div>
          <motion.h2 variants={fadeUpVariant} transition={{ duration: 0.4 }}
            className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Transform Your Learning Experience?
          </motion.h2>
          <motion.p variants={fadeUpVariant} transition={{ duration: 0.4 }}
            className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of students and educators already using StudyHub to make learning smarter, faster, and more effective.
          </motion.p>
          <motion.div variants={fadeUpVariant} transition={{ duration: 0.4 }}
            className="flex flex-wrap justify-center gap-5">
            <motion.div {...mc.btnHover} transition={{ duration: 0.15 }}>
              <Link to="/register" id="cta-register"
                className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-lg shadow-xl focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none transition-all duration-200"
                style={{ background: '#fff', color: '#4F46E5' }}>
                <GraduationCap size={20} /> Register Free
              </Link>
            </motion.div>
            <motion.div {...mc.btnHover} transition={{ duration: 0.15 }}>
              <Link to="/login" id="cta-login"
                className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-lg border-2 border-white text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                Login
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   14. FOOTER
───────────────────────────────────────────────────────────── */
function Footer() {
  const yr = new Date().getFullYear();
  return (
    <footer aria-label="Site Footer" style={{ background: '#060614', color: T.textSecondary }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.gradient }}>
                <GraduationCap size={16} className="text-white" />
              </div>
              <span className="font-bold text-xl" style={{ color: T.textPrimary }}>StudyHub</span>
            </div>
            <p className="text-sm leading-relaxed mb-5">
              AI-powered learning for the modern generation. Smart, adaptive, and accessible education for all.
            </p>
            <a href="https://github.com" aria-label="StudyHub GitHub repository"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm rounded focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-colors duration-200"
              style={{ color: T.textSecondary }}
              onMouseEnter={e => e.currentTarget.style.color = T.textPrimary}
              onMouseLeave={e => e.currentTarget.style.color = T.textSecondary}>
              <GitBranch size={18} /> View on GitHub
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-5 text-sm uppercase tracking-wider" style={{ color: T.textPrimary }}>Quick Links</h3>
            <ul className="space-y-3 text-sm">
              {[{ label: 'Home', to: '/' }, { label: 'Features', to: '#features' }, { label: 'About', to: '#about' }, { label: 'FAQ', to: '#faq' }].map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="rounded focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-colors duration-200"
                    style={{ color: T.textSecondary }}
                    onMouseEnter={e => e.currentTarget.style.color = T.textPrimary}
                    onMouseLeave={e => e.currentTarget.style.color = T.textSecondary}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-5 text-sm uppercase tracking-wider" style={{ color: T.textPrimary }}>Resources</h3>
            <ul className="space-y-3 text-sm">
              {['Documentation', 'API Reference', 'Community', 'Blog'].map(l => (
                <li key={l}>
                  <Link to="#" className="rounded focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-colors duration-200"
                    style={{ color: T.textSecondary }}
                    onMouseEnter={e => e.currentTarget.style.color = T.textPrimary}
                    onMouseLeave={e => e.currentTarget.style.color = T.textSecondary}>
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h3 className="font-semibold mb-5 text-sm uppercase tracking-wider" style={{ color: T.textPrimary }}>Legal & Contact</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="#" className="rounded transition-colors duration-200" style={{ color: T.textSecondary }}
                onMouseEnter={e => e.currentTarget.style.color = T.textPrimary}
                onMouseLeave={e => e.currentTarget.style.color = T.textSecondary}>Privacy Policy</Link></li>
              <li><Link to="#" className="rounded transition-colors duration-200" style={{ color: T.textSecondary }}
                onMouseEnter={e => e.currentTarget.style.color = T.textPrimary}
                onMouseLeave={e => e.currentTarget.style.color = T.textSecondary}>Terms of Service</Link></li>
              <li>
                <a href="mailto:studyhub@institution.edu"
                  className="flex items-center gap-2 transition-colors duration-200" style={{ color: T.textSecondary }}
                  onMouseEnter={e => e.currentTarget.style.color = T.textPrimary}
                  onMouseLeave={e => e.currentTarget.style.color = T.textSecondary}>
                  <Mail size={14} /> studyhub@institution.edu
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
          style={{ borderColor: T.border }}>
          <p>&copy; {yr} StudyHub. Built at <span style={{ color: '#a5b4fc' }}>GSFC University</span>.</p>
          <p className="text-xs" style={{ color: T.textMuted }}>Designed with ❤️ for smarter education.</p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────
   ROOT: LearnMorePage (default export)
───────────────────────────────────────────────────────────── */
export default function LearnMorePage() {
  const mc = useMotionConfig();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'StudyHub — AI-Powered Learning Management System';
    const setMeta = (name, content, isProp = false) => {
      const sel = isProp ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel);
      if (!el) { el = document.createElement('meta'); isProp ? el.setAttribute('property', name) : el.setAttribute('name', name); document.head.appendChild(el); }
      el.setAttribute('content', content);
      return el;
    };
    const metas = [
      setMeta('description', 'StudyHub combines AI, automation, and modern tools to create smarter learning experiences for students, teachers, and institutions.'),
      setMeta('og:title',       'StudyHub — Learn Smarter with AI', true),
      setMeta('og:description', 'AI-powered LMS for students, teachers, and administrators.', true),
      setMeta('og:type',        'website', true),
    ];
    return () => { document.title = prevTitle; metas.forEach(el => el?.parentNode?.removeChild(el)); };
  }, []);

  return (
    <>
      <ScrollProgressBar />
      <BackToTopButton />

      <div style={{ backgroundColor: T.bgPrimary, color: T.textPrimary, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        {/* Skip link */}
        <a href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70] focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:text-white"
          style={{ background: T.gradient }}>
          Skip to main content
        </a>

        {/* Header */}
        <header className="sticky top-0 z-40 border-b"
          style={{ background: 'rgba(10,10,26,0.85)', backdropFilter: 'blur(16px)', borderColor: T.border }}>
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/"
              className="flex items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md" style={{ background: T.gradient }}>
                <GraduationCap size={16} className="text-white" />
              </div>
              <span className="font-bold text-xl" style={{ color: T.textPrimary }}>StudyHub</span>
            </Link>
            <nav aria-label="Page navigation" className="flex items-center gap-3">
              <Link to="/login"
                className="text-sm font-medium px-3 py-2 rounded-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                style={{ color: T.textSecondary }}>
                Login
              </Link>
              <Link to="/register"
                className="text-sm font-semibold px-5 py-2 rounded-lg text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                style={{ background: T.gradient, boxShadow: '0 2px 12px rgba(108,99,255,0.35)' }}>
                Get Started
              </Link>
            </nav>
          </div>
        </header>

        <main id="main-content">
          <HeroSection mc={mc} />
          <AboutSection mc={mc} />
          <AudienceSection mc={mc} />
          <AIFeaturesSection mc={mc} />
          <WorkflowSection mc={mc} />
          <FeatureGrid mc={mc} />
          <SecuritySection mc={mc} />
          <MissionVisionSection mc={mc} />
          <StatsSection />
          <FAQSection mc={mc} />
          <CTASection mc={mc} />
        </main>

        <Footer />
      </div>
    </>
  );
}
