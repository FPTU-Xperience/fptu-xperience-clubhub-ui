import WorkspaceTabLayout from './WorkspaceTabLayout';

export default function WorkspaceUnavailable({ title, description, detail }) {
    return (
        <WorkspaceTabLayout title={title} description={description}>
            {() => (
                <section className="v2-workspace-unavailable" role="status">
                    <h2>Chưa có dữ liệu từ hệ thống</h2>
                    <p>{detail}</p>
                </section>
            )}
        </WorkspaceTabLayout>
    );
}
