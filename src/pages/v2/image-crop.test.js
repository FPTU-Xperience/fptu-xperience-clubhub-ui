import test from 'node:test';
import assert from 'node:assert/strict';
import { imageCropRect, moveImageCrop } from '../../components/media/image-crop.js';
import { PROFILE_COVER_SIZE } from './profile-page/cover-design.js';

test('crop selects the largest matching region and centers for avatar, logo and covers', () => {
    assert.deepEqual(imageCropRect(1200, 800, 300, 300), { x: 200, y: 0, width: 800, height: 800 });
    assert.deepEqual(imageCropRect(1200, 800, 1200, 300), { x: 0, y: 250, width: 1200, height: 300 });
    const profile = imageCropRect(1200, 800, PROFILE_COVER_SIZE.width, PROFILE_COVER_SIZE.height);
    assert.equal(profile.width / profile.height, 4);
    assert.deepEqual(imageCropRect(1920, 1080, 1200, 500), { x: 0, y: 140, width: 1920, height: 800 });
});
test('zoom and dragging keep the retained region inside image bounds', () => {
    const crop = imageCropRect(1200, 800, 300, 300, 2);
    assert.deepEqual(crop, { x: 400, y: 200, width: 400, height: 400 });
    const moved = moveImageCrop(crop, 1200, 800, 300, 300, 75, -75);
    const result = imageCropRect(1200, 800, 300, 300, 2, moved.x, moved.y);
    assert.equal(result.x, 300);
    assert.equal(result.y, 300);
    const edge = moveImageCrop(crop, 1200, 800, 300, 300, 99999, -99999);
    assert.deepEqual(edge, { x: 0, y: 100 });
    assert.deepEqual(moveImageCrop(imageCropRect(300, 300, 300, 300), 300, 300, 300, 300, 200, 200), { x: 50, y: 50 });
    assert.throws(() => imageCropRect(0, 800, 300, 300));
});
