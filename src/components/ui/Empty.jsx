import React from 'react';
import { Compass } from 'lucide-react';

export function Empty({ title = 'Chưa có nội dung', text = 'Những cập nhật mới sẽ xuất hiện tại đây.', children }) {
    return (
        <div className="dx-empty">
            <Compass size={34} />
            <h3>{title}</h3>
            <p>{text}</p>
            {children}
        </div>
    );
}

export default Empty;
