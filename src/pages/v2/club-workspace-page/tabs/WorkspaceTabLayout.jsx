export default function WorkspaceTabLayout({ title, description, action, records = [], preview = false, className = '', children }) {
    return (
        <section className={`v2-workspace-section${className ? ` ${className}` : ''}`}>
            <header>
                <div>
                    <span className="v2-eyebrow">KHÔNG GIAN CLB{preview ? ' · DỮ LIỆU MINH HỌA' : ''}</span>
                    <h1>{title}</h1>
                    <p>{description}</p>
                </div>
                {typeof action === 'string' ? (
                    <button className="v2-button v2-button--primary" type="button" disabled>
                        {action}
                    </button>
                ) : (
                    action
                )}
            </header>
            {children(records)}
        </section>
    );
}
