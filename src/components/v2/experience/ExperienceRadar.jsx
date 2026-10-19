const axes = [
    ['Academic', 'Học tập'],
    ['Research', 'Nghiên cứu'],
    ['Global', 'Quốc tế'],
    ['CultureSports', 'Thể thao & văn hóa'],
    ['Community', 'Cộng đồng'],
    ['Entrepreneurship', 'Khởi nghiệp'],
];

export default function ExperienceRadar({ radarAxes }) {
    const values = axes.map(([pillar]) => radarAxes?.find((axis) => axis.pillar === pillar)?.saturatedScore);
    if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 100))
        return <p>Chưa có đủ sáu trụ cột để vẽ biểu đồ.</p>;
    const point = (index, radius) => [
        160 + Math.sin((index * Math.PI) / 3) * radius,
        137 - Math.cos((index * Math.PI) / 3) * radius,
    ];
    const polygon = (items) => items.map((value, index) => point(index, value).join(',')).join(' ');
    const description = axes.map(([, label], index) => `${label}: ${values[index]}/100`).join(', ');
    return (
        <div className="v2-profile-radar">
            <svg viewBox="0 0 320 285" role="img" aria-label={`Radar trải nghiệm. ${description}`}>
                {[25, 50, 75, 100].map((radius) => (
                    <polygon key={radius} points={polygon(Array(6).fill(radius))} fill="none" stroke="currentColor" />
                ))}
                {axes.map(([pillar, label], index) => {
                    const [x, y] = point(index, 100),
                        [textX, textY] = point(index, 123);
                    return (
                        <g key={pillar}>
                            <line x1="160" y1="137" x2={x} y2={y} />
                            <text x={textX} y={textY} textAnchor="middle" dominantBaseline="middle">
                                {label}
                            </text>
                        </g>
                    );
                })}
                <polygon points={polygon(values)} className="v2-profile-radar-current" />
                {values.map((value, index) => {
                    const [x, y] = point(index, value);
                    return <circle key={axes[index][0]} cx={x} cy={y} r="3" className="v2-profile-radar-dot" />;
                })}
            </svg>
        </div>
    );
}
