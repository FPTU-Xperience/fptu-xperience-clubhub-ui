import { useState } from 'react';
import { ExternalLink, FileText, Film, Image, Link2 } from 'lucide-react';
import V2Modal from '../common/modal/V2Modal';
import { resourceSize, youtubeEmbedUrl } from './activity-resources-data';
import './ActivityResources.scss';

export default function ActivityResources({ resources, kind }) {
    const [selected, setSelected] = useState(null);
    const rows = resources.filter((resource) =>
        kind === 'MEDIA' ? ['MEDIA', 'EMBED'].includes(resource.kind) : resource.kind === 'DOCUMENT',
    );
    const embedded = selected && youtubeEmbedUrl(selected.url);
    return (
        <>
            {rows.length ? (
                <div className={`v2-activity-resource-grid${kind === 'DOCUMENT' ? ' is-documents' : ''}`}>
                    {rows.map((resource) => {
                        const image = resource.mimeType.startsWith('image/');
                        const video = resource.mimeType.startsWith('video/');
                        const Icon =
                            resource.kind === 'DOCUMENT'
                                ? FileText
                                : resource.kind === 'EMBED'
                                  ? Link2
                                  : video
                                    ? Film
                                    : Image;
                        return (
                            <article key={resource.id} className="v2-activity-resource-card">
                                {image ? (
                                    <button
                                        type="button"
                                        className="v2-activity-resource-image"
                                        onClick={() => setSelected(resource)}
                                        aria-label={`Xem ${resource.title}`}
                                    >
                                        <img
                                            src={resource.previewUrl || resource.url}
                                            alt={resource.title}
                                            loading="lazy"
                                        />
                                    </button>
                                ) : (
                                    <div className="v2-activity-resource-icon">
                                        <Icon size={26} />
                                    </div>
                                )}
                                <div className="v2-activity-resource-copy">
                                    <h3>{resource.title}</h3>
                                    <p>
                                        {resource.kind === 'EMBED'
                                            ? new URL(resource.url).hostname
                                            : [
                                                  resource.mimeType.includes('pdf')
                                                      ? 'PDF'
                                                      : resource.mimeType.includes('word')
                                                        ? 'Word'
                                                        : resource.mimeType.includes('sheet') ||
                                                            resource.mimeType.includes('excel')
                                                          ? 'Excel'
                                                          : image
                                                            ? 'Ảnh'
                                                            : video
                                                              ? 'Video'
                                                              : resource.kind === 'DOCUMENT'
                                                                ? 'Tài liệu'
                                                                : 'Tệp',
                                                  resourceSize(resource.sizeBytes),
                                              ]
                                                  .filter(Boolean)
                                                  .join(' · ')}
                                    </p>
                                    {resource.draft && <span className="v2-activity-resource-draft">Chưa lưu</span>}
                                    {resource.kind === 'DOCUMENT' ? (
                                        <a
                                            href={resource.previewUrl || resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Mở tài liệu <ExternalLink size={14} />
                                        </a>
                                    ) : image || video || youtubeEmbedUrl(resource.url) ? (
                                        <button
                                            type="button"
                                            className="v2-resource-preview-link"
                                            onClick={() => setSelected(resource)}
                                        >
                                            Xem nội dung <ExternalLink size={14} />
                                        </button>
                                    ) : (
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                            Mở liên kết <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className="v2-activity-resource-empty">
                    <div>{kind === 'DOCUMENT' ? <FileText size={28} /> : <Image size={28} />}</div>
                    <h3>{kind === 'DOCUMENT' ? 'Chưa có tài liệu' : 'Chưa có media'}</h3>
                    <p>
                        {kind === 'DOCUMENT'
                            ? 'Tài liệu của hoạt động sẽ được hiển thị tại đây.'
                            : 'Ảnh, video và nội dung được chia sẻ sẽ xuất hiện tại đây.'}
                    </p>
                </div>
            )}
            {selected && (
                <V2Modal title={selected.title} onClose={() => setSelected(null)} wide>
                    {selected.mimeType.startsWith('image/') ? (
                        <img
                            className="v2-activity-resource-preview"
                            src={selected.previewUrl || selected.url}
                            alt={selected.title}
                        />
                    ) : selected.mimeType.startsWith('video/') ? (
                        <video
                            className="v2-activity-resource-preview"
                            src={selected.previewUrl || selected.url}
                            controls
                        />
                    ) : embedded ? (
                        <iframe
                            className="v2-activity-resource-embed"
                            title={selected.title}
                            src={embedded}
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allow="fullscreen; picture-in-picture"
                            allowFullScreen
                        />
                    ) : null}
                </V2Modal>
            )}
        </>
    );
}
