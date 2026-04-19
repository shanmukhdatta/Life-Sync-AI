import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Zap, TestTube } from 'lucide-react'

const satellites = [
  'Dashboard', 'Gmail', 'Calendar', 'Drive', 'Maps',
  'Fit', 'Sheets', 'Forms', 'Docs', 'Tasks',
]

function ArchDiagram() {
  const svgRef = useRef(null)
  const [dims, setDims] = useState({ w: 500, h: 500 })
  const cx = dims.w / 2
  const cy = dims.h / 2
  const radius = Math.min(cx, cy) - 70

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const obs = new ResizeObserver(() => {
      setDims({ w: el.clientWidth, h: el.clientHeight })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const nodePositions = satellites.map((_, i) => {
    const angle = (i / satellites.length) * 2 * Math.PI - Math.PI / 2
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  })

  return (
    <div
      ref={svgRef}
      className="w-full"
      style={{ height: 480, position: 'relative' }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        aria-label="LifeSync AI architecture diagram"
        role="img"
      >
        {/* Lines from center to satellites */}
        {nodePositions.map((pos, i) => (
          <line
            key={`line-${i}`}
            x1={cx} y1={cy}
            x2={pos.x} y2={pos.y}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
          />
        ))}

        {/* Animated traveling dots */}
        {nodePositions.map((pos, i) => (
          <circle
            key={`dot-${i}`}
            r="3"
            fill="rgba(255,255,255,0.7)"
            style={{
              animation: `travelDot 2.5s ease-in-out infinite`,
              animationDelay: `${i * 0.25}s`,
            }}
          >
            <animateMotion
              dur={`${2 + (i % 3) * 0.4}s`}
              repeatCount="indefinite"
              begin={`${i * 0.25}s`}
            >
              <mpath>
                <path d={`M ${cx} ${cy} L ${pos.x} ${pos.y}`} />
              </mpath>
            </animateMotion>
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur={`${2 + (i % 3) * 0.4}s`}
              repeatCount="indefinite"
              begin={`${i * 0.25}s`}
            />
          </circle>
        ))}

        {/* Center node */}
        <g>
          <rect
            x={cx - 80} y={cy - 22}
            width={160} height={44}
            rx={22}
            fill="rgba(255,255,255,0.07)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />
          <text
            x={cx} y={cy - 5}
            textAnchor="middle"
            fill="white"
            fontSize="11"
            fontWeight="600"
            fontFamily="Inter, sans-serif"
            letterSpacing="-0.02em"
          >
            LifeSync AI Brain
          </text>
          <text
            x={cx} y={cy + 10}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="10"
            fontFamily="Inter, sans-serif"
          >
            Powered by Gemini
          </text>
        </g>

        {/* Satellite nodes */}
        {nodePositions.map((pos, i) => (
          <g key={`node-${i}`} className="group" style={{ cursor: 'default' }}>
            <rect
              x={pos.x - 36} y={pos.y - 13}
              width={72} height={26}
              rx={13}
              fill="rgba(255,255,255,0.04)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            <text
              x={pos.x} y={pos.y + 5}
              textAnchor="middle"
              fill="rgba(255,255,255,0.6)"
              fontSize="9.5"
              fontFamily="Inter, sans-serif"
              fontWeight="500"
            >
              {satellites[i]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

const pillars = [
  {
    icon: Shield,
    title: 'OAuth 2.0 Security',
    desc: 'Minimal scopes, no external storage, server-side token refresh only.',
  },
  {
    icon: Zap,
    title: 'Async Parallel Calls',
    desc: 'Dashboard loads all 10 API responses simultaneously. Smart cache invalidation on data change.',
  },
  {
    icon: TestTube,
    title: 'Mock-Testable Modules',
    desc: 'Every Google integration has a complete mock implementation enabling unit testing with zero live API calls.',
  },
]

export default function Architecture() {
  return (
    <section id="architecture" className="py-32" style={{ background: '#080808' }} aria-labelledby="arch-heading">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 16, letterSpacing: '0.2em' }}
          whileInView={{ opacity: 1, y: 0, letterSpacing: '0.12em' }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="mb-5"
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Modular by Design
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          id="arch-heading"
          className="font-bold mb-16"
          style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', letterSpacing: '-0.03em', lineHeight: 1.15 }}
        >
          Clean code. Independent modules. Built to scale.
        </motion.h2>

        {/* Architecture diagram */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="glass-card mb-16 overflow-hidden"
          style={{ padding: '32px 16px' }}
        >
          <ArchDiagram />
        </motion.div>

        {/* Three pillar cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="glass-card p-7 h-full group cursor-default">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <Icon size={17} className="text-white transition-transform duration-300 group-hover:rotate-[8deg]" />
                </div>
                <h3 className="font-semibold text-[16px] text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                  {title}
                </h3>
                <p className="text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
