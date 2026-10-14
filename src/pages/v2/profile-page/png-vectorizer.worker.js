import { tracePngPixels } from './png-vectorizer';
self.onmessage = (event) => {
    try {
        self.postMessage({ svg: tracePngPixels(event.data) });
    } catch (issue) {
        self.postMessage({ error: issue.message || 'Không thể chuyển PNG thành SVG.' });
    }
};
