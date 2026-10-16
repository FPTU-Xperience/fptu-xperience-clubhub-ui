import { useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import PageState from '../../../components/v2/PageState';

pdfjs.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`;

export default function ReportFilePreview({ api, reportId }) {
    const [revision, setRevision] = useState(0);
    const [result, setResult] = useState({ status: 'loading' });
    const [pages, setPages] = useState(0);
    const [width, setWidth] = useState(600);
    const [renderError, setRenderError] = useState('');
    const container = useRef(null);
    const file = useMemo(() => (result.bytes ? { data: new Uint8Array(result.bytes) } : null), [result.bytes]);
    useEffect(() => {
        const measure = () => setWidth(Math.max(120, Math.min(1000, (container.current?.clientWidth || 600) - 16)));
        measure();
        const observer = new ResizeObserver(measure);
        if (container.current) observer.observe(container.current);
        return () => observer.disconnect();
    }, []);
    useEffect(() => {
        let active = true;
        setResult({ status: 'loading' });
        setPages(0);
        setRenderError('');
        Promise.resolve()
            .then(() => api.getUploadedReportFilePreview(reportId))
            .then((bytes) => {
                if (!active) return;
                setResult({ status: 'populated', bytes });
            })
            .catch((error) => {
                if (active) setResult({ status: 'error', error: error.message });
            });
        return () => {
            active = false;
        };
    }, [api, reportId, revision]);
    return (
        <div className="v2-report-file-preview" ref={container} aria-label="Bản xem trước tệp báo cáo">
            {result.status === 'populated' && !renderError ? (
                <>
                    {pages > 0 && <p className="v2-report-muted">{pages} trang</p>}
                    <Document
                        file={file}
                        loading={<p role="status">Đang đọc tài liệu…</p>}
                        onLoadSuccess={({ numPages }) => setPages(numPages)}
                        onLoadError={() =>
                            setRenderError('Không thể đọc bản PDF. Bạn có thể thử lại hoặc tải tệp gốc.')
                        }
                    >
                        {Array.from({ length: pages }, (_, index) => (
                            <Page
                                key={index + 1}
                                pageNumber={index + 1}
                                width={width}
                                renderTextLayer
                                renderAnnotationLayer={false}
                                onRenderError={() => setRenderError('Không thể hiển thị trang PDF.')}
                            />
                        ))}
                    </Document>
                </>
            ) : (
                <PageState
                    status={renderError ? 'error' : result.status}
                    description={renderError || result.error}
                    onRetry={() => setRevision((value) => value + 1)}
                />
            )}
        </div>
    );
}
