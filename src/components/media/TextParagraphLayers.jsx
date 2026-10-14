import { useId } from 'react';
import { PARAGRAPH_FONTS } from './text-paragraphs';
import SvgPaintDefs, { svgPaint } from './SvgPaintDefs';

export default function TextParagraphLayers({
    paragraphs,
    width,
    height,
    inheritedColor,
    selectedId,
    interactive = false,
}) {
    const id = `paragraph-${useId().replace(/:/g, '')}`;
    return (
        <g data-layer="text">
            {paragraphs.map((paragraph, index) => {
                const x = (paragraph.x * width) / 100,
                    y = (paragraph.y * height) / 100;
                const lines = paragraph.text.split('\n');
                return (
                    <g
                        key={paragraph.id}
                        data-paragraph-id={paragraph.id}
                        style={{ cursor: interactive ? 'move' : undefined }}
                    >
                        <SvgPaintDefs paints={{ [index]: paragraph.color }} prefix={id} />
                        <text
                            x={x}
                            y={y}
                            fontSize={paragraph.size}
                            fontFamily={PARAGRAPH_FONTS.find((font) => font.id === paragraph.font).family}
                            fontWeight={paragraph.bold ? 700 : 400}
                            fontStyle={paragraph.italic ? 'italic' : 'normal'}
                            opacity={paragraph.opacity}
                            fill={paragraph.color ? svgPaint(paragraph.color, id, index) : inheritedColor}
                        >
                            {lines.map((line, i) => (
                                <tspan key={i} x={x} dy={i ? paragraph.size * 1.25 : 0}>
                                    {line || ' '}
                                </tspan>
                            ))}
                        </text>
                        {interactive && selectedId === paragraph.id && (
                            <rect
                                x={x - 4}
                                y={y - paragraph.size}
                                width={Math.max(30, ...lines.map((line) => line.length * paragraph.size * 0.65)) + 8}
                                height={paragraph.size * 1.25 * lines.length + 4}
                                fill="transparent"
                                stroke="#f97316"
                                strokeWidth="1.5"
                                strokeDasharray="5 4"
                            />
                        )}
                    </g>
                );
            })}
        </g>
    );
}
