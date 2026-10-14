import { getGradient, gradientVector } from './color-palette';

export const svgPaint = (paint, prefix, key) => (getGradient(paint) ? `url(#${prefix}-${key})` : paint);
export default function SvgPaintDefs({ paints, prefix, width = 1, height = 1, x = 0, y = 0, userSpace = false }) {
    return (
        <defs>
            {Object.entries(paints).map(([key, paint]) => {
                const gradient = getGradient(paint);
                if (!gradient) return null;
                const vector = gradientVector(gradient.angle, width, height);
                return (
                    <linearGradient
                        key={key}
                        id={`${prefix}-${key}`}
                        gradientUnits={userSpace ? 'userSpaceOnUse' : 'objectBoundingBox'}
                        x1={vector.x1 + x}
                        y1={vector.y1 + y}
                        x2={vector.x2 + x}
                        y2={vector.y2 + y}
                    >
                        {gradient.stops.map((stop, index) => (
                            <stop key={index} offset={`${stop.position}%`} stopColor={stop.color} />
                        ))}
                    </linearGradient>
                );
            })}
        </defs>
    );
}
