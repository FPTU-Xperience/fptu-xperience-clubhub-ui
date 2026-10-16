import { Navigate, useLocation, useParams } from 'react-router-dom';

// Existing report URLs keep working while the detail view belongs to V2.
export default function ReportDetailPage() {
    const { id } = useParams();
    const { search } = useLocation();
    return <Navigate to={`/v2/reports/${encodeURIComponent(id)}${search}`} replace />;
}
