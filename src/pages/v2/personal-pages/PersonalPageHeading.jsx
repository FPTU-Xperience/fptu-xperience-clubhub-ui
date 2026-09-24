import './PersonalPages.scss';

export default function PersonalPageHeading({ title, description, action = null }) {
    return (
        <header className="v2-personal-page-heading">
            <div>
                <span className="v2-personal-page-eyebrow">KHÔNG GIAN CỦA BẠN</span>
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
            {action}
        </header>
    );
}
