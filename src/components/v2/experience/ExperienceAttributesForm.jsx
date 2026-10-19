export const initialAttributes = () => ({
    tier: 'T1',
    role: 'Participant',
    scale: 'Club',
    result: 'None',
    pillarWeights: [{ pillar: 'Academic', weight: 1 }],
});
export default function ExperienceAttributesForm({ value, onChange, lockedBlueprint = false }) {
    return (
        <fieldset>
            <legend>Thuộc tính công sức</legend>
            {Object.entries({
                tier: ['T1', 'T2', 'T3', 'T4', 'T5'],
                role: ['Participant', 'Contributor', 'Product', 'Organizer', 'Leader'],
                scale: ['Club', 'Campus', 'FptEducation', 'National', 'International'],
                result: ['None', 'Finalist', 'Prize', 'RealWorldOutput'],
            }).map(([key, options]) => (
                <label key={key}>
                    {{ tier: 'Mức công sức', role: 'Vai trò', scale: 'Quy mô', result: 'Kết quả' }[key]}
                    <select
                        disabled={lockedBlueprint && ['tier', 'scale'].includes(key)}
                        value={value[key]}
                        onChange={(event) => onChange({ ...value, [key]: event.target.value })}
                    >
                        {options.map((option) => (
                            <option key={option}>{option}</option>
                        ))}
                    </select>
                </label>
            ))}
            {value.pillarWeights.map((weight, index) => (
                <div key={index}>
                    <label>
                        Trụ cột
                        <select
                            disabled={lockedBlueprint}
                            value={weight.pillar}
                            onChange={(event) =>
                                onChange({
                                    ...value,
                                    pillarWeights: value.pillarWeights.map((item, i) =>
                                        i === index ? { ...item, pillar: event.target.value } : item,
                                    ),
                                })
                            }
                        >
                            {[
                                'Academic',
                                'Research',
                                'Global',
                                'CultureSports',
                                'Community',
                                'Entrepreneurship',
                                'RealWorldWork',
                            ].map((pillar) => (
                                <option key={pillar}>{pillar}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Tỷ trọng
                        <input
                            disabled={lockedBlueprint}
                            type="number"
                            min="0.0001"
                            max="1"
                            step="0.0001"
                            required
                            value={weight.weight}
                            onChange={(event) =>
                                onChange({
                                    ...value,
                                    pillarWeights: value.pillarWeights.map((item, i) =>
                                        i === index ? { ...item, weight: Number(event.target.value) } : item,
                                    ),
                                })
                            }
                        />
                    </label>
                </div>
            ))}
        </fieldset>
    );
}
