import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
    plugins: [react()],
    optimizeDeps: { entries: ['tests/fixtures/open-issues.html'] },
    resolve: { alias: [{ find: /^(?:\.\.\/)+context\/AuthContext(?:\.jsx)?$/, replacement: fileURLToPath(new URL('./public-tabs-auth.jsx', import.meta.url)) }] },
});
