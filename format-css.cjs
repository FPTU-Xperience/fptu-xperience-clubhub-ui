const fs = require('fs');
const path = require('path');

const inputFile = path.join('c:/Users/ADMIN/Desktop/PRN232/ASSAGMENT_FE/Pro_profile/src/index.css');
const outputDir = path.join('c:/Users/ADMIN/Desktop/PRN232/ASSAGMENT_FE/PRN_FE/src/features/profile');
const outputFile = path.join(outputDir, 'system-admin-profile.css');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let css = fs.readFileSync(inputFile, 'utf-8');

// Remove tailwind directives
css = css.replace(/@tailwind.*\n/g, '');

// Since postcss-prefixwrap might not be installed, we will use a naive approach for global selectors
css = css.replace(/:root/g, '.system-admin-profile');
css = css.replace(/html/g, '.system-admin-profile-html');
css = css.replace(/body/g, '.system-admin-profile');
css = css.replace(/\* \{/g, '.system-admin-profile * {');
css = css.replace(/\*,/g, '.system-admin-profile *,');
css = css.replace(/\*::before,/g, '.system-admin-profile *::before,');
css = css.replace(/\*::after \{/g, '.system-admin-profile *::after {');

css = css.replace(/button,/g, '.system-admin-profile button,');
css = css.replace(/input,/g, '.system-admin-profile input,');
css = css.replace(/a \{/g, '.system-admin-profile a {');
css = css.replace(/button \{/g, '.system-admin-profile button {');
css = css.replace(/button:focus-visible/g, '.system-admin-profile button:focus-visible');
css = css.replace(/a:focus-visible/g, '.system-admin-profile a:focus-visible');
css = css.replace(/input:focus-visible/g, '.system-admin-profile input:focus-visible');

// For other classes, let's prefix lines that start with . with .system-admin-profile .
// Wait, CSS classes can start anywhere. But in this file, they usually start at the beginning of the line.
// Actually, wrapping all rules inside .system-admin-profile { ... } and using Sass is better.
fs.writeFileSync(path.join('c:/Users/ADMIN/Desktop/PRN232/ASSAGMENT_FE/PRN_FE/temp.scss'), `.system-admin-profile {\n${css}\n}`);
