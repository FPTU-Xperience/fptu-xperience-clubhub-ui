import { Navigate, useLocation, useParams } from 'react-router-dom';

// Preserve existing create/edit entry points while all report editors run in V2.
export default function CreateReportPage() {
    const { id } = useParams();
    const { search } = useLocation();
    return (
        <Navigate to={`${id ? `/v2/reports/${encodeURIComponent(id)}/edit` : '/v2/reports/create'}${search}`} replace />
    );
}
