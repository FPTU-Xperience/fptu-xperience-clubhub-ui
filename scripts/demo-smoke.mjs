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
  const { AppRoutes } = await vite.ssrLoadModule('/src/routes/AppRoutes.jsx');
  const routes = [
    ['/', 'Tìm cộng đồng.'],
    ['/events', 'Có gì đang diễn ra?'],
    ['/clubs/fcode', 'Câu lạc bộ Lập trình F-Code'],
    ['/my-clubs', 'Câu lạc bộ của tôi'],
    ['/profile', 'Nguyễn Khánh Linh'],
    ['/my-clubs/fcode', 'cùng dẫn dắt nhé.'],
    ['/my-clubs/fstyle', 'hôm nay có gì mới?'],
    ['/my-clubs/fcode/activities', 'Hoạt động trong CLB'],
    ['/my-clubs/fcode/attendance', 'Quản lý điểm danh'],
    ['/my-clubs/fcode/members', 'Thành viên CLB'],
    ['/my-clubs/fcode/quests', 'Nhiệm vụ &amp; đóng góp'],
    ['/my-clubs/fcode/points', 'Sổ ghi nhận đóng góp'],
    ['/my-clubs/fcode/gifts', 'Kho quà của CLB'],
    ['/my-clubs/fcode/reports', 'Báo cáo CLB'],
    ['/my-clubs/fcode/finance', 'Tổng quan tài chính'],
    ['/my-clubs/fcode/settings', 'Cài đặt CLB'],
    ['/my-clubs/fstyle/reports', 'Trang này không dành cho vai trò hiện tại'],
    ['/my-clubs/green', 'Không gian dành cho thành viên CLB'],
  ];

  for (const [path, expected] of routes) {
    const html = renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: [path] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/*', element: React.createElement(AppRoutes) })
        )
      )
    );
    assert.ok(html.includes(expected), `${path}: missing ${expected}`);
    console.log(`PASS ${path}`);
  }
  console.log(`All ${routes.length} enterprise root route renders passed.`);
} finally {
  console.error = originalError;
  await vite.close();
}
