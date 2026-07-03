import { useTranslation } from 'react-i18next'

/* Big animated globe + orbiting plane, shown while Ulisse is still building
   an empty itinerary. Pure SVG: SMIL meridians give the spin illusion, a CSS
   rotation carries the plane around a dashed orbit. */
export default function BuildingGlobe({ label }) {
  const { t } = useTranslation()
  return (
    <div className="anim-fade-in flex flex-col items-center justify-center gap-6 py-14">
      <div className="relative">
        {/* soft pulsing halo */}
        <div className="absolute inset-6 animate-pulse rounded-full bg-violet-400/15 blur-2xl" />

        <svg width="210" height="210" viewBox="0 0 220 220" fill="none" className="relative">
          <defs>
            <linearGradient id="bg-globe" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
            <linearGradient id="bg-route" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <clipPath id="bg-clip"><circle cx="110" cy="110" r="64" /></clipPath>
          </defs>

          {/* dashed orbit */}
          <g className="globe-orbit-slow" style={{ transformOrigin: '110px 110px' }}>
            <circle cx="110" cy="110" r="96" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="1 8" strokeLinecap="round" />
          </g>

          {/* the globe */}
          <circle cx="110" cy="110" r="64" stroke="url(#bg-globe)" strokeWidth="2.5" />
          <g clipPath="url(#bg-clip)" stroke="#a78bfa" strokeWidth="1.4" opacity="0.75">
            {/* latitudes */}
            <ellipse cx="110" cy="110" rx="64" ry="64" opacity="0" />
            <line x1="46" y1="110" x2="174" y2="110" />
            <ellipse cx="110" cy="82" rx="55" ry="9" fill="none" opacity="0.55" />
            <ellipse cx="110" cy="138" rx="55" ry="9" fill="none" opacity="0.55" />
            {/* meridians: rx oscillates → rotation illusion */}
            <ellipse cx="110" cy="110" ry="64" fill="none">
              <animate attributeName="rx" values="64;0.5;64" dur="5.6s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="110" cy="110" ry="64" fill="none">
              <animate attributeName="rx" values="32;64;32;0.5;32" dur="5.6s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="110" cy="110" ry="64" fill="none" opacity="0.6">
              <animate attributeName="rx" values="50;20;50" dur="5.6s" begin="-1.4s" repeatCount="indefinite" />
            </ellipse>
          </g>

          {/* animated route across the globe */}
          <path
            d="M 62 132 Q 96 74 158 96"
            stroke="url(#bg-route)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 8"
            fill="none"
            className="globe-route"
          />
          <circle cx="62" cy="132" r="4" fill="#fb923c" />
          <circle cx="158" cy="96" r="4" fill="#8b5cf6" />

          {/* plane on the orbit */}
          <g className="globe-orbit" style={{ transformOrigin: '110px 110px' }}>
            <g transform="translate(110 14)">
              <circle r="11" fill="white" className="drop-shadow" />
              {/* lucide "plane", scaled and pointing along the orbit */}
              <g transform="rotate(90) translate(-8 -8) scale(0.66)">
                <path
                  d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
                  fill="#7c3aed"
                />
              </g>
            </g>
          </g>
        </svg>
      </div>

      <div className="text-center">
        <p className="font-display text-[15px] font-bold text-ink-900">{label ?? t('globe.building')}</p>
        <p className="mx-auto mt-1 max-w-xs text-[12px] leading-relaxed text-ink-400">
          {t('globe.subtitle')}
        </p>
      </div>
    </div>
  )
}
