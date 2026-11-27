import { AVATAR_FRAMES } from './avatar-frames.js';
import { serverCosmeticDefinitions, serverCosmeticInventory } from '../../../services/server-cosmetics-cache.js';

export function getCoverColors() {
    return [...COVER_COLORS, ...serverCosmeticDefinitions('color')];
}
export function getAvatarFrames() {
    return [...AVATAR_FRAMES, ...serverCosmeticDefinitions('frame')];
}
export function getCoverShapes() {
    return [...COVER_SHAPES, ...serverCosmeticDefinitions('shape')];
}
export function readCoverInventory(user) {
    return serverCosmeticInventory(user?.id);
}

export const COVER_COLORS = [
    {
        id: 'default',
        label: 'Cam trải nghiệm',
        free: true,
        background: '#fff1df',
        secondary: '#fed7aa',
        accent: '#fb923c',
        ink: '#9a3412',
    },
    {
        id: 'sunset',
        label: 'Hoàng hôn',
        free: true,
        background: '#ffe5dc',
        secondary: '#ffbdac',
        accent: '#ed795f',
        ink: '#943721',
    },
    {
        id: 'horizon',
        label: 'Bầu trời',
        free: true,
        background: '#dceffc',
        secondary: '#fed7aa',
        accent: '#fb923c',
        ink: '#9a3412',
    },
    {
        id: 'forest',
        label: 'Rừng xanh',
        free: true,
        background: '#e0f3e9',
        secondary: '#a9dbc3',
        accent: '#369b74',
        ink: '#185640',
    },
    {
        id: 'violet',
        label: 'Tím sáng tạo',
        free: true,
        background: '#ede8ff',
        secondary: '#c7b8f1',
        accent: '#9473dd',
        ink: '#513389',
    },
];
export const COVER_SHAPES = [
    { id: 'none', label: 'Không dùng badge', free: true },
    { id: 'petals', label: 'Cánh hoa', free: true },
    { id: 'ribbons', label: 'Dải chéo', free: true },
    { id: 'circles', label: 'Bong bóng', free: true },
    { id: 'orbits', label: 'Quỹ đạo', free: true },
    { id: 'waves', label: 'Sóng', free: true },
];
export function canUseCoverItem(kind, id, inventory, storage = globalThis.localStorage) {
    const item = (
        kind === 'color'
            ? getCoverColors(storage)
            : kind === 'frame'
              ? getAvatarFrames(storage)
              : getCoverShapes(storage)
    ).find((item) => item.id === id);
    return !!item && (item.free || inventory.owned.includes(`${kind}:${id}`));
}
