import React from 'react';
import { Link } from 'react-router-dom';
import { useClubHub } from '../../context/ClubHubContext';

export function AppFooter() {
    const { basePath = '' } = useClubHub();
    const homePath = basePath || '/';

    return (
        <footer className="dx-footer">
            <Link className="dx-brand" to={homePath}>
                clubhub.
            </Link>
            <p>Một phần của hành trình FPTU Xperience · Dành riêng cho Sinh viên và CTSV</p>
            <span>FPT UNIVERSITY · CAMPUS HUB 2026</span>
        </footer>
    );
}

export default AppFooter;
