import { Link } from 'react-router-dom';
import './Footer.scss';

export default function Footer() {
    return (
        <footer className="v2-footer">
            <Link className="v2-footer-brand" to="/v2" aria-label="ClubHub - về trang Khám phá">
                clubhub<span>.</span>
            </Link>
            <p>Một phần của hành trình FPTU Xperience.</p>
            <small>FPT UNIVERSITY · CLUBHUB</small>
        </footer>
    );
}
