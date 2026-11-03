import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
    resolve: { alias: [{ find: /^(?:\.\.\/)+context\/AuthContext(?:\.jsx)?$/, replacement: fileURLToPath(new URL('./public-tabs-auth.jsx', import.meta.url)) }] },
});
