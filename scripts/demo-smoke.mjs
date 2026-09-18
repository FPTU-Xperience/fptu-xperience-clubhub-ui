import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const originalError = console.error;
// MemoryRouter/layout hooks do not run in SSR; this warning is expected in this smoke test.
console.error = (...args) => {
    if (!String(args[0]).includes('useLayoutEffect does nothing on the server')) originalError(...args);
};
try {
    const { V2Routes } = await vite.ssrLoadModule('/src/pages/v2/DemoApp.jsx');
    const routes = [
        ['/v2/demo', 'Tìm cộng đồng.'],
        ['/v2/demo/events', 'Có gì đang diễn ra?'],
        ['/v2/demo/clubs/fcode', 'Câu lạc bộ Lập trình F-Code'],
        ['/v2/demo/my-clubs', 'Câu lạc bộ của tôi'],
        ['/v2/demo/profile', 'Nguyễn Khánh Linh'],
        ['/v2/demo/my-clubs/fcode', 'cùng dẫn dắt nhé.'],
        ['/v2/demo/my-clubs/fstyle', 'hôm nay có gì mới?'],
        ['/v2/demo/my-clubs/fcode/activities', 'Hoạt động trong CLB'],
        ['/v2/demo/my-clubs/fcode/attendance', 'Quản lý điểm danh'],
        ['/v2/demo/my-clubs/fcode/members', 'Thành viên CLB'],
        ['/v2/demo/my-clubs/fcode/quests', 'Nhiệm vụ &amp; đóng góp'],
        ['/v2/demo/my-clubs/fcode/points', 'Sổ ghi nhận đóng góp'],
        ['/v2/demo/my-clubs/fcode/gifts', 'Kho quà của CLB'],
        ['/v2/demo/my-clubs/fcode/reports', 'Báo cáo CLB'],
        ['/v2/demo/my-clubs/fcode/finance', 'Tổng quan tài chính'],
        ['/v2/demo/my-clubs/fcode/settings', 'Cài đặt CLB'],
        ['/v2/demo/my-clubs/fstyle/reports', 'Trang này không dành cho vai trò hiện tại'],
        ['/v2/demo/my-clubs/green', 'Không gian dành cho thành viên CLB'],
    ];
    for (const [path, expected] of routes) {
        const html = renderToString(
            React.createElement(
                MemoryRouter,
                { initialEntries: [path] },
                React.createElement(
                    Routes,
                    null,
                    React.createElement(Route, { path: '/v2/demo/*', element: React.createElement(V2Routes) }),
                ),
            ),
        );
        assert.ok(html.includes(expected), `${path}: missing ${expected}`);
        console.log(`PASS ${path}`);
    }
    console.log(`All ${routes.length} route renders passed.`);
} finally {
    console.error = originalError;
    await vite.close();
}
