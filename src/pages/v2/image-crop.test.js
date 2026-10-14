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
test('circular crop can zoom out with transparent padding and pan in either direction', () => {
    const rect = imageCropRect(200, 200, 512, 512, 0.5, 50, 50, 0.5);
    assert.deepEqual(rect, { x: -100, y: -100, width: 400, height: 400 });
    const right = moveImageCrop(rect, 200, 200, 400, 400, 40, 0);
    assert.equal(imageCropRect(200, 200, 512, 512, 0.5, right.x, right.y, 0.5).x, -140);
    const left = moveImageCrop(rect, 200, 200, 400, 400, -40, 0);
    assert.equal(imageCropRect(200, 200, 512, 512, 0.5, left.x, left.y, 0.5).x, -60);
});

test('zoomed crop selects the requested part of a rectangular image and clamps dragging', () => {
    const rect = imageCropRect(400, 200, 512, 512, 2, 100, 0, 0.5);
    assert.deepEqual(rect, { x: 300, y: 0, width: 100, height: 100 });
    assert.deepEqual(moveImageCrop(rect, 400, 200, 360, 360, -10000, 10000), { x: 100, y: 0 });
    const centered = imageCropRect(200, 200, 512, 512, 1, 50, 50, 0.5);
    assert.deepEqual(moveImageCrop(centered, 200, 200, 360, 360, 100, 100), { x: 50, y: 50 });
});

test('existing rectangular image crop keeps its minimum zoom and aspect ratio', () => {
    assert.deepEqual(imageCropRect(400, 200, 512, 512, 0.5), { x: 100, y: 0, width: 200, height: 200 });
    assert.deepEqual(imageCropRect(800, 600, 1200, 300, 1), { x: 0, y: 200, width: 800, height: 200 });
});
