import { Link, useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Home, ArrowLeft, Compass } from 'lucide-react';

// ─── Floating orb ────────────────────────────────────────────────────────────
function Orb({
  size,
  x,
  y,
  delay,
  opacity,
}: {
  size: number;
  x: string;
  y: string;
  delay: number;
  opacity: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background:
          'radial-gradient(circle, hsl(120 60% 50% / 0.35) 0%, transparent 70%)',
        opacity,
        filter: 'blur(40px)',
      }}
      animate={{
        y: [0, -30, 0],
        scale: [1, 1.12, 1],
        opacity: [opacity, opacity * 0.6, opacity],
      }}
      transition={{
        duration: 6 + delay,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

// ─── Grid background ─────────────────────────────────────────────────────────
function GridBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="nf-grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="hsl(120 60% 50% / 0.06)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#nf-grid)" />
      </svg>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function NotFound() {
  const navigate = useNavigate();

  // Stagger variants — explicitly typed so framer-motion's Easing union resolves correctly
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background">
      {/* Ambient background */}
      <GridBackground />
      <Orb size={480} x="-10%" y="-15%" delay={0} opacity={0.7} />
      <Orb size={360} x="65%" y="55%" delay={2} opacity={0.5} />
      <Orb size={240} x="40%" y="-5%" delay={1} opacity={0.35} />

      {/* Card */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center gap-6 px-6 text-center"
      >
        {/* Status pill */}
        <motion.div variants={item}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Compass size={12} strokeWidth={2.5} />
            Page not found
          </span>
        </motion.div>

        {/* 404 numeral */}
        <motion.div variants={item} className="relative select-none">
          {/* Shadow layer for depth */}
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-[10rem] font-black leading-none tracking-tighter text-primary/5 blur-sm md:text-[14rem]"
          >
            404
          </span>

          {/* Main gradient text */}
          <span
            className="relative text-[9rem] font-black leading-none tracking-tighter md:text-[13rem]"
            style={{
              background:
                'linear-gradient(135deg, hsl(120 60% 55%) 0%, hsl(120 60% 38%) 50%, hsl(150 60% 45%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            404
          </span>
        </motion.div>

        {/* Divider */}
        <motion.div variants={item} className="flex items-center gap-3 w-48">
          <span className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground/50 text-xs">●</span>
          <span className="flex-1 h-px bg-border" />
        </motion.div>

        {/* Copy */}
        <motion.div variants={item} className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            Looks like you're lost
          </h1>
          <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
            The page you're looking for doesn't exist or has been moved to
            another location.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          variants={item}
          className="flex flex-col items-center gap-3 sm:flex-row"
        >
          {/* Primary CTA — styled Link, no Button wrapper needed */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 hover:bg-primary/90 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Home size={14} strokeWidth={2.5} />
            Go to Dashboard
          </Link>

          {/* Secondary — plain button element */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-muted hover:scale-[1.02] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
            Go Back
          </button>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          variants={item}
          className="text-xs text-muted-foreground/50 mt-2"
        >
          Error code{' '}
          <span className="font-mono text-primary/60">HTTP 404</span>
        </motion.p>
      </motion.div>
    </div>
  );
}
