import React from 'react';
import { createRoot } from 'react-dom/client';
import NotificationPopover from '../../src/components/v2/common/leftrail/NotificationPopover';
import '../../src/styles/index.scss';
import '../../src/pages/v2/V2App.scss';
import '../../src/components/v2/common/leftrail/LeftRail.scss';
const query = new URLSearchParams(location.search);
document.documentElement.dataset.theme = query.get('theme') || 'light';
const data = Array.from({ length: 6 }, (_, index) => ({
    id: String(index), title: index ? 'Bản nháp báo cáo mới' : 'Báo cáo đã được phê duyệt',
    message: 'Báo cáo kỳ FALL2026 của Câu lạc bộ Công nghệ FPT đã được phê duyệt. ' + 'Nội dung thông báo dài để kiểm tra xuống dòng. '.repeat(3),
    isRead: index % 2 === 1, createdAt: '2026-10-21T07:16:00Z',
}));
createRoot(document.getElementById('root')).render(<div className="v2-app"><aside className="v2-left-rail">
    <NotificationPopover status={query.get('state') || 'populated'} data={data} retry={() => { document.body.dataset.retried = 'true'; }} onClose={() => { document.body.dataset.closed = 'true'; }} />
</aside><main className="v2-public-content"><h1>Component validation</h1></main></div>);
