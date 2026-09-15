import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Globe2, Palette, Users, Rocket, Sparkles } from 'lucide-react';

// 6 pillars, colors taken from the "6+1 Experience Framework" reference image.
const PILLARS = [
    { key: 'learning', label: 'Learning', fullLabel: 'Learning Experience', color: '#2F5FAE', icon: BookOpen },
    { key: 'research', label: 'Research', fullLabel: 'Research Experience', color: '#3FA35E', icon: Search },
    { key: 'sports', label: 'Sports & Cultural', fullLabel: 'Sports & Cultural Experience', color: '#9A5FC9', icon: Palette },
    { key: 'entrepreneurship', label: 'Entrepreneurship', fullLabel: 'Entrepreneurship Experience', color: '#E0483C', icon: Rocket },
    { key: 'social', label: 'Social & Community', fullLabel: 'Social & Community Experience', color: '#3B9AE1', icon: Users },
    { key: 'international', label: 'International', fullLabel: 'International Experience', color: '#D4A017', icon: Globe2 },
];

const SIZE = 600; // svg viewBox units — kept large relative to MAX_R/LABEL_R so labels have breathing room
const CENTER = SIZE / 2;
const MAX_R = 120;
const LABEL_R = 175;
const LEVELS = [0.25, 0.5, 0.75, 1];

function pointFor(index, radius) {
    // start at top (-90deg), go clockwise
    const angle = -Math.PI / 2 + index * ((2 * Math.PI) / PILLARS.length);
    return {
        x: CENTER + radius * Math.cos(angle),
        y: CENTER + radius * Math.sin(angle),
        angle,
    };
}

function polygonPoints(radius) {
    return PILLARS.map((_, i) => pointFor(i, radius))
        .map((p) => `${p.x},${p.y}`)
        .join(' ');
}

export default function HexagonExperienceChart() {
    const [seed, setSeed] = useState(0);

    // TODO: replace with real scores per pillar once available — currently random 0-100 placeholders.
    const values = useMemo(
        () => PILLARS.map(() => Math.floor(Math.random() * 101)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [seed]
    );

    const average = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);

    const dataPoints = values.map((v, i) => pointFor(i, (v / 100) * MAX_R));
    const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

    return (
        <div className="mx-auto w-full rounded-2xl border border-slate-800 bg-slate-900/65 p-6">
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center justify-between"
            >
                <div>
                    <h3 className="text-lg font-bold text-white">Trải nghiệm đại học</h3>
                    <p className="text-sm text-gray-400">Khung 6+1 trải nghiệm</p>
                </div>
                <button
                    type="button"
                    onClick={() => setSeed((s) => s + 1)}
                    className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                >
                    Random lại
                </button>
            </motion.div>

            <div className="relative mx-auto aspect-square w-full max-w-[840px] select-none">
                <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full overflow-visible">
                    <defs>
                        {PILLARS.map((p, i) => {
                            const next = PILLARS[(i + 1) % PILLARS.length];
                            return (
                                <linearGradient
                                    key={p.key}
                                    id={`edge-grad-${p.key}`}
                                    gradientUnits="userSpaceOnUse"
                                    x1={dataPoints[i].x}
                                    y1={dataPoints[i].y}
                                    x2={dataPoints[(i + 1) % PILLARS.length].x}
                                    y2={dataPoints[(i + 1) % PILLARS.length].y}
                                >
                                    <stop offset="0%" stopColor={p.color} />
                                    <stop offset="100%" stopColor={next.color} />
                                </linearGradient>
                            );
                        })}
                        <radialGradient id="radar-fill" cx="50%" cy="50%" r="65%">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.06" />
                        </radialGradient>
                    </defs>

                    {/* background grid rings */}
                    {LEVELS.map((lvl, i) => (
                        <motion.polygon
                            key={lvl}
                            points={polygonPoints(MAX_R * lvl)}
                            fill="none"
                            stroke="#334155"
                            strokeWidth={1}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
                        />
                    ))}

                    {/* axis spokes */}
                    {PILLARS.map((p, i) => {
                        const outer = pointFor(i, MAX_R);
                        return (
                            <motion.line
                                key={p.key}
                                x1={CENTER}
                                y1={CENTER}
                                x2={outer.x}
                                y2={outer.y}
                                stroke="#334155"
                                strokeWidth={1}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            />
                        );
                    })}

                    {/* data area — grows smoothly from the center */}
                    <motion.g
                        style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        key={seed}
                    >
                        <polygon points={dataPolygon} fill="url(#radar-fill)" stroke="none" />
                        {PILLARS.map((p, i) => {
                            const a = dataPoints[i];
                            const b = dataPoints[(i + 1) % PILLARS.length];
                            return (
                                <line
                                    key={p.key}
                                    x1={a.x}
                                    y1={a.y}
                                    x2={b.x}
                                    y2={b.y}
                                    stroke={`url(#edge-grad-${p.key})`}
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                />
                            );
                        })}
                    </motion.g>

                    {/* vertex dots + values */}
                    {PILLARS.map((p, i) => {
                        const pt = dataPoints[i];
                        return (
                            <motion.g
                                key={p.key}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 260,
                                    damping: 16,
                                    delay: 0.9 + i * 0.07,
                                }}
                                style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                            >
                                <circle cx={pt.x} cy={pt.y} r={7} fill={p.color} stroke="#0f172a" strokeWidth={2} />
                                <circle cx={pt.x} cy={pt.y} r={12} fill={p.color} opacity={0.18} />
                            </motion.g>
                        );
                    })}

                    {/* center badge */}
                    <motion.g
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.15 }}
                        style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
                    >
                        <circle cx={CENTER} cy={CENTER} r={30} fill="#ffffff" stroke="#475569" strokeWidth={1.5} />
                    </motion.g>
                </svg>

                {/* center label (HTML for crisp text) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className="pointer-events-none absolute flex flex-col items-center justify-center text-center"
                    style={{
                        left: `${(CENTER / SIZE) * 100}%`,
                        top: `${(CENTER / SIZE) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        width: `${((30 * 1.6) / SIZE) * 100}%`,
                    }}
                >
                    <Sparkles className="mb-0.5 h-4 w-4 text-cyan-300" />
                    <span className="text-base font-bold leading-none text-white">{average}</span>
                </motion.div>

                {/* axis labels */}
                {PILLARS.map((p, i) => {
                    const pos = pointFor(i, LABEL_R);
                    const Icon = p.icon;
                    return (
                        <motion.div
                            key={p.key}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 1.1 + i * 0.07, ease: 'easeOut' }}
                            className="absolute flex w-16 flex-col items-center text-center"
                            style={{
                                left: `${(pos.x / SIZE - 0.05) * 100}%`,
                                top: `${(pos.y / SIZE - 0.04) * 100}%`,
                                transform: 'translate(calc(-50% - 8px), -50%)',
                            }}
                        >
                            <div
                                className="mb-0.5 flex h-7 w-7 items-center justify-center rounded-full"
                                style={{ backgroundColor: `${p.color}26`, color: p.color }}
                            >
                                <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                            </div>
                            <span className="text-[11px] font-semibold leading-tight text-gray-200">{p.label}</span>
                            <span className="text-[11px] font-bold" style={{ color: p.color }}>
                                {values[i]}
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}