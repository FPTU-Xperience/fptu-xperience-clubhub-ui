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
    const { default: DemoApp } = await vite.ssrLoadModule('/src/demo/DemoApp.jsx');
    const routes = [
        ['/demo', 'Tìm cộng đồng.'],
        ['/demo/events', 'Có gì đang diễn ra?'],
        ['/demo/clubs/fcode', 'Câu lạc bộ Lập trình F-Code'],
        ['/demo/my-clubs', 'Câu lạc bộ của tôi'],
        ['/demo/profile', 'Nguyễn Khánh Linh'],
        ['/demo/my-clubs/fcode', 'cùng dẫn dắt nhé.'],
        ['/demo/my-clubs/fstyle', 'hôm nay có gì mới?'],
        ['/demo/my-clubs/fcode/activities', 'Hoạt động trong CLB'],
        ['/demo/my-clubs/fcode/attendance', 'Quản lý điểm danh'],
        ['/demo/my-clubs/fcode/members', 'Thành viên CLB'],
        ['/demo/my-clubs/fcode/quests', 'Nhiệm vụ &amp; đóng góp'],
        ['/demo/my-clubs/fcode/points', 'Sổ ghi nhận đóng góp'],
        ['/demo/my-clubs/fcode/gifts', 'Kho quà của CLB'],
        ['/demo/my-clubs/fcode/reports', 'Báo cáo CLB'],
        ['/demo/my-clubs/fcode/finance', 'Tổng quan tài chính'],
        ['/demo/my-clubs/fcode/settings', 'Cài đặt CLB'],
        ['/demo/my-clubs/fstyle/reports', 'Trang này không dành cho vai trò hiện tại'],
        ['/demo/my-clubs/green', 'Không gian dành cho thành viên CLB'],
    ];
    for (const [path, expected] of routes) {
        const html = renderToString(
            React.createElement(
                MemoryRouter,
                { initialEntries: [path] },
                React.createElement(
                    Routes,
                    null,
                    React.createElement(Route, { path: '/demo/*', element: React.createElement(DemoApp) }),
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
