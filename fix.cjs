const fs = require('fs');

// 1. Fix Layout.jsx
const layoutPath = 'c:/Users/ADMIN/Desktop/PRN232/ASSAGMENT_FE/PRN_FE/src/components/Layout.jsx';
let layout = fs.readFileSync(layoutPath, 'utf8');
layout = layout.replace(/<<<<<<< HEAD\n  const \[isMobileOpen, setIsMobileOpen\] = useState\(false\)\n=======\n  const \[isSidebarOpen, setIsSidebarOpen\] = useState\(false\)\n>>>>>>> [a-f0-9]+\n/, '  const [isMobileOpen, setIsMobileOpen] = useState(false)\n');
layout = layout.replace(/<<<<<<< HEAD\n      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} \/>\n\n      {\/\* Main Content Area \*\/}\n      <div className="lg:ml-\[250px\] min-h-screen flex flex-col transition-all duration-300">\n        {\/\* Header \*\/}\n        <Header \n          title={title} \n          subtitle={subtitle} \n          onMenuClick={\(\) => setIsMobileOpen\(true\)} \n=======\n      <Sidebar isOpen={isSidebarOpen} onClose={\(\) => setIsSidebarOpen\(false\)} \/>\n\n      {\/\* Main Content Area \*\/}\n      <div className="min-h-screen flex flex-col lg:ml-64">\n        {\/\* Header \*\/}\n        <Header\n          title={title}\n          subtitle={subtitle}\n          onOpenSidebar={\(\) => setIsSidebarOpen\(true\)}\n>>>>>>> [a-f0-9]+\n/, `      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />\n\n      {/* Main Content Area */}\n      <div className="lg:ml-[250px] min-h-screen flex flex-col transition-all duration-300">\n        {/* Header */}\n        <Header \n          title={title} \n          subtitle={subtitle} \n          onMenuClick={() => setIsMobileOpen(true)} \n`);
fs.writeFileSync(layoutPath, layout);

// 2. Fix ProfilePage.jsx
const profilePath = 'c:/Users/ADMIN/Desktop/PRN232/ASSAGMENT_FE/PRN_FE/src/pages/ProfilePage.jsx';
let profile = fs.readFileSync(profilePath, 'utf8');
profile = profile.replace(/<<<<<<< HEAD\nimport SystemAdminProfile from '\.\.\/features\/profile\/SystemAdminProfile'\n\nfunction ExistingProfile\(\) {[\s\S]*?=======\nexport default function ProfilePage\(\) {\n  const \{ user, clubAccess \} = useAuth\(\)\n  const approvedClubs = clubAccess\.filter\(access => access\.isApprovedMember \|\| access\.isManager\)\n>>>>>>> [a-f0-9]+\n/, `import SystemAdminProfile from '../features/profile/SystemAdminProfile'\n\nfunction ExistingProfile() {\n  const { user, clubAccess } = useAuth()\n  const approvedClubs = clubAccess.filter(access => access.isApprovedMember || access.isManager)\n`);
fs.writeFileSync(profilePath, profile);

// For Header and Sidebar, it's easier to just git checkout --ours and then apply the logic from the remote manually, because the conflicts are large.
