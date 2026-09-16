// Entirely synthetic, local-only demo. No server identities or credentials.
export const CURRENT_TERM = 'FA26';
export const DEMO_NOW = '2026-09-16T10:00:00+07:00';
export const PEOPLE = [
    {
        id: 'linh',
        name: 'Nguyễn Khánh Linh',
        initials: 'KL',
        role: 'STUDENT',
        headline: 'Biến những ý tưởng nhỏ thành trải nghiệm có ý nghĩa.',
        major: 'Kỹ thuật phần mềm',
        code: 'SE180246',
        year: 'K18',
        interest: 'Công nghệ · Thiết kế · Cộng đồng',
        about: 'Mình là Linh, sinh viên Kỹ thuật phần mềm tại FPTU. Mình thích xây dựng sản phẩm cùng những người có chung sự tò mò, tổ chức workshop và giúp các bạn mới tìm thấy niềm vui trong lập trình.',
        skills: ['React', 'UI/UX', 'Làm việc nhóm', 'Tổ chức sự kiện'],
        project: 'Campus Companion — lịch học và hoạt động trong một nơi',
        label: 'Linh · Chủ F-Code / thành viên FStyle',
    },
    {
        id: 'minh',
        name: 'Trần Nhật Minh',
        initials: 'NM',
        role: 'STUDENT',
        headline: 'Học một điều mới. Gặp một người bạn mới.',
        major: 'Thiết kế mỹ thuật số',
        code: 'GD190128',
        year: 'K19',
        interest: 'Nghệ thuật · Nhiếp ảnh',
        about: 'Mình yêu thiết kế, nhảy và những hoạt động có thể kể một câu chuyện. Hiện mình đang tìm cơ hội đóng góp vào các dự án sáng tạo tại trường.',
        skills: ['Figma', 'Nhiếp ảnh', 'Biên tập video'],
        project: 'Một ngày ở FPTU — bộ ảnh đời sống sinh viên',
        label: 'Minh · Thành viên 2 CLB',
    },
    {
        id: 'an',
        name: 'Lê Hoài An',
        initials: 'HA',
        role: 'STUDENT',
        headline: 'Bắt đầu hành trình của riêng mình.',
        major: 'Kinh doanh quốc tế',
        code: 'IB210032',
        year: 'K21',
        interest: 'Cộng đồng · Kinh doanh',
        about: 'Sinh viên năm nhất, mong muốn tìm một cộng đồng để học hỏi, thử sức và làm quen với cuộc sống đại học.',
        skills: ['Tiếng Anh', 'Thuyết trình'],
        project: '',
        label: 'An · Sinh viên chưa tham gia CLB',
    },
    {
        id: 'bao',
        name: 'Lê Quốc Bảo',
        initials: 'QB',
        role: 'STUDENT',
        headline: 'Cùng nhau làm nên một mùa hoạt động đáng nhớ.',
        major: 'Truyền thông đa phương tiện',
        code: 'MC170061',
        year: 'K17',
        interest: 'Nghệ thuật · Tình nguyện',
        about: 'Mình phụ trách điều phối các dự án cộng đồng và hoạt động sáng tạo. Điều mình yêu thích nhất là nhìn thấy các thành viên mới tự tin nhận vai trò dẫn dắt.',
        skills: ['Điều phối', 'Truyền thông', 'Mentoring'],
        project: 'Sân khấu xanh — nghệ thuật vì cộng đồng',
        label: 'Bảo · Chủ FStyle và Cóc Xanh',
    },
    {
        id: 'staff',
        name: 'Phạm Thu Hà',
        initials: 'TH',
        role: 'ADMIN',
        headline: 'Kết nối các cộng đồng sinh viên.',
        major: 'Công tác sinh viên',
        code: '',
        year: '',
        interest: '',
        about: '',
        skills: [],
        project: '',
        label: 'Hà · Role khác / khu khám phá',
    },
];

export const CLUBS = [
    {
        id: 'fcode',
        name: 'F-Code',
        fullName: 'Câu lạc bộ Lập trình F-Code',
        category: 'Công nghệ',
        mark: '</>',
        color: '#c95628',
        tone: 'code',
        tagline: 'Code together. Grow together.',
        description: 'Từ dòng code đầu tiên đến sản phẩm đầu tay. Cùng học, cùng xây và cùng tiến xa hơn.',
        schedule: 'Thứ 4 & Thứ 7 · 18:00–20:00',
        place: 'Phòng Innovation · Tòa Gamma',
        recruiting: true,
        finance: true,
        founded: 2017,
        tags: ['Lập trình', 'Sản phẩm', 'Mentoring'],
    },
    {
        id: 'fstyle',
        name: 'FStyle Crew',
        fullName: 'Câu lạc bộ Nghệ thuật FStyle Crew',
        category: 'Nghệ thuật',
        mark: 'fs.',
        color: '#685894',
        tone: 'dance',
        tagline: 'Find your own rhythm.',
        description: 'Một nhịp nhạc, nhiều cá tính. Không gian để bạn chuyển động, sáng tạo và là chính mình.',
        schedule: 'Thứ 3 & Thứ 5 · 17:30–19:30',
        place: 'Phòng tập · Nhà văn hóa sinh viên',
        recruiting: true,
        finance: false,
        founded: 2015,
        tags: ['Nhảy', 'Biểu diễn', 'Sáng tạo'],
    },
    {
        id: 'green',
        name: 'Cóc Xanh',
        fullName: 'Câu lạc bộ Tình nguyện Cóc Xanh',
        category: 'Cộng đồng',
        mark: 'cx',
        color: '#397965',
        tone: 'green',
        tagline: 'Small acts. Real impact.',
        description: 'Góp một chút thời gian, tạo nên nhiều thay đổi. Những dự án tử tế bắt đầu từ chúng mình.',
        schedule: 'Chủ nhật · 08:00–11:00',
        place: 'Sảnh Alpha · Điểm tập trung',
        recruiting: true,
        finance: false,
        founded: 2016,
        tags: ['Tình nguyện', 'Môi trường', 'Cộng đồng'],
    },
    {
        id: 'lens',
        name: 'F-Lens',
        fullName: 'Câu lạc bộ Nhiếp ảnh F-Lens',
        category: 'Nghệ thuật',
        mark: 'FL',
        color: '#927144',
        tone: 'photo',
        tagline: 'See the everyday differently.',
        description: 'Lưu lại những câu chuyện của tuổi trẻ qua góc nhìn rất riêng của bạn.',
        schedule: 'Thứ 7 · 09:00–11:00',
        place: 'Studio · Tòa Beta',
        recruiting: true,
        finance: false,
        founded: 2018,
        tags: ['Nhiếp ảnh', 'Kể chuyện'],
    },
    {
        id: 'basket',
        name: 'FPTU Basketball',
        fullName: 'Câu lạc bộ Bóng rổ FPTU',
        category: 'Thể thao',
        mark: '23',
        color: '#b65b33',
        tone: 'sport',
        tagline: 'One team. Every shot.',
        description: 'Rèn luyện mỗi ngày, cháy hết mình trên sân. Dành cho mọi trình độ và mọi đam mê.',
        schedule: 'Thứ 2 & Thứ 6 · 17:00–19:00',
        place: 'Sân bóng rổ · Khu thể thao',
        recruiting: false,
        finance: false,
        founded: 2014,
        tags: ['Bóng rổ', 'Đồng đội'],
    },
    {
        id: 'bec',
        name: 'Business & Economics',
        fullName: 'Business & Economics Club',
        category: 'Kinh doanh',
        mark: 'be.',
        color: '#466e8d',
        tone: 'business',
        tagline: 'Ideas meet opportunity.',
        description: 'Tư duy kinh doanh, góc nhìn kinh tế và những ý tưởng được thử thách trong thực tế.',
        schedule: 'Thứ 6 · 18:00–20:00',
        place: 'Phòng Seminar · Tòa Alpha',
        recruiting: true,
        finance: false,
        founded: 2016,
        tags: ['Kinh tế', 'Khởi nghiệp'],
    },
];
export const clubById = (id) => CLUBS.find((c) => c.id === id);
export const personById = (id) => PEOPLE.find((p) => p.id === id);
export const membership = (state, userId, clubId) =>
    state.memberships.find((m) => m.userId === userId && m.clubId === clubId && m.status === 'approved');
export const isManager = (state, userId, clubId) => membership(state, userId, clubId)?.role === 'manager';
export const canEnter = (state, userId, clubId) => Boolean(membership(state, userId, clubId));
export const ownPoints = (state, userId, clubId, term) =>
    state.ledger
        .filter((l) => l.userId === userId && (!clubId || l.clubId === clubId) && (!term || l.term === term))
        .reduce((sum, l) => sum + l.amount, 0);
export const wallet = (state, userId, clubId) =>
    ownPoints(state, userId, clubId) -
    state.redemptions.filter((r) => r.userId === userId && r.clubId === clubId).reduce((s, r) => s + r.cost, 0);

export function createInitialState() {
    const memberships = [
        { userId: 'linh', clubId: 'fcode', role: 'manager', status: 'approved' },
        { userId: 'linh', clubId: 'fstyle', role: 'member', status: 'approved' },
        { userId: 'minh', clubId: 'fcode', role: 'member', status: 'approved' },
        { userId: 'minh', clubId: 'green', role: 'member', status: 'approved' },
        { userId: 'bao', clubId: 'fstyle', role: 'manager', status: 'approved' },
        { userId: 'bao', clubId: 'green', role: 'manager', status: 'approved' },
    ];
    const members = [];
    const names = [
        'Phạm Minh Anh',
        'Đặng Tuấn Kiệt',
        'Ngô Hải Yến',
        'Vũ Gia Huy',
        'Đỗ Bảo Ngọc',
        'Trương Đức Phúc',
        'Nguyễn Thảo Vy',
        'Phan Anh Khoa',
    ];
    ['fcode', 'fstyle', 'green'].forEach((clubId, ci) =>
        names.forEach((name, i) => {
            const id = `${clubId}-member-${i}`;
            members.push({
                id,
                name,
                initials: name
                    .split(' ')
                    .slice(-2)
                    .map((n) => n[0])
                    .join(''),
                major: ['Kỹ thuật phần mềm', 'Truyền thông đa phương tiện', 'Kinh doanh quốc tế'][ci],
            });
            memberships.push({ userId: id, clubId, role: 'member', status: 'approved' });
        }),
    );
    const activityNames = {
        fcode: ['Build & Share: sản phẩm đầu tay', 'Code café: cùng gỡ một bài toán', 'Git Together: cộng tác với Git'],
        fstyle: [
            'Open practice: tìm nhịp của bạn',
            'Choreography lab: kể chuyện bằng chuyển động',
            'Welcome to the floor',
        ],
        green: [
            'Chủ nhật xanh: đổi rác lấy cây',
            'Gói một món quà, gửi một niềm vui',
            'Một buổi sáng vì khuôn viên xanh',
        ],
    };
    const activities = Object.keys(activityNames).flatMap((clubId) =>
        activityNames[clubId].map((title, i) => ({
            id: `${clubId}-event-${i}`,
            clubId,
            term: CURRENT_TERM,
            title,
            status: ['upcoming', 'live', 'completed'][i],
            date: ['2026-09-20T09:00:00+07:00', '2026-09-16T09:30:00+07:00', '2026-09-10T17:00:00+07:00'][i],
            location: clubById(clubId).place,
            capacity: 25,
            points: [40, 20, 30][i],
            public: i === 0,
            description:
                'Một buổi gặp gỡ để học điều mới, chia sẻ trải nghiệm và cùng tạo ra những kết nối ý nghĩa. Hãy mang theo sự tò mò và tinh thần sẵn sàng thử sức!',
            registered: memberships
                .filter((m) => m.clubId === clubId)
                .slice(0, i === 2 ? 7 : 4)
                .map((m) => m.userId),
            checkedIn:
                i === 2
                    ? memberships
                          .filter((m) => m.clubId === clubId)
                          .slice(0, 5)
                          .map((m) => m.userId)
                    : [],
            sessionOpen: i === 1,
        })),
    );
    activities.push({
        ...activities[2],
        id: 'fcode-old',
        title: 'Summer showcase: những điều đã làm được',
        term: 'SU26',
        date: '2026-07-25T09:00:00+07:00',
    });
    const ledger = [];
    memberships.forEach((m, i) => {
        ledger.push({
            id: `award-${i}`,
            ...m,
            amount: 120 + (i % 4) * 20,
            term: CURRENT_TERM,
            reason: 'Đóng góp workshop đầu học kỳ',
            date: '2026-09-12',
            verifier: 'Ban chủ nhiệm (demo)',
            source: 'Minh chứng tổ chức workshop',
        });
    });
    ledger.push({
        id: 'linh-old',
        userId: 'linh',
        clubId: 'fcode',
        amount: 90,
        term: 'SU26',
        reason: 'Điều phối Summer showcase',
        date: '2026-07-25',
        verifier: 'Ban chủ nhiệm (demo)',
        source: 'Biên bản hoạt động',
    });
    return {
        version: 1,
        memberships,
        members,
        activities,
        ledger,
        applications: [
            {
                id: 'application-vy',
                clubId: 'fcode',
                userId: 'visitor-vy',
                name: 'Hoàng Tường Vy',
                reason: 'Em muốn học phát triển web và góp sức tổ chức các buổi workshop cho sinh viên mới.',
                status: 'pending',
            },
        ],
        quests: ['fcode', 'fstyle', 'green'].map((clubId, i) => ({
            id: `${clubId}-quest`,
            clubId,
            term: CURRENT_TERM,
            title: ['Chia sẻ một điều bạn vừa học', 'Một chuyển động, một câu chuyện', 'Lan tỏa một thói quen xanh'][i],
            description:
                'Tạo một sản phẩm nhỏ, ghi lại quá trình và gửi minh chứng để ban chủ nhiệm ghi nhận đóng góp.',
            points: 50,
        })),
        submissions: [
            {
                id: 'sample-submission',
                questId: 'fcode-quest',
                clubId: 'fcode',
                term: CURRENT_TERM,
                userId: 'minh',
                evidence: 'Bài viết hướng dẫn dựng wireframe cho trang CLB, kèm bản thiết kế và phản hồi của nhóm.',
                status: 'pending',
            },
        ],
        gifts: ['fcode', 'fstyle', 'green'].flatMap((clubId) => [
            {
                id: `${clubId}-tote`,
                clubId,
                name: 'Túi tote cộng đồng',
                subtitle: 'Mang tinh thần CLB đi khắp nơi',
                cost: 100,
                stock: 8,
                kind: 'tote',
            },
            {
                id: `${clubId}-bottle`,
                clubId,
                name: 'Bình nước everyday',
                subtitle: 'Một người bạn cho ngày năng động',
                cost: 180,
                stock: 4,
                kind: 'bottle',
            },
            {
                id: `${clubId}-sticker`,
                clubId,
                name: 'Bộ sticker phiên bản giới hạn',
                subtitle: 'Một chút cá tính trên chiếc laptop',
                cost: 40,
                stock: 0,
                kind: 'sticker',
            },
        ]),
        redemptions: [],
        reports: ['fcode', 'fstyle', 'green'].map((clubId) => ({
            id: `${clubId}-report`,
            clubId,
            term: CURRENT_TERM,
            title: 'Kế hoạch hoạt động tháng 9',
            content: 'Tuyển thành viên mới, tổ chức buổi làm quen và một hoạt động chia sẻ kỹ năng.',
            status: 'draft',
        })),
        transactions: [
            {
                id: 'tx-1',
                clubId: 'fcode',
                term: CURRENT_TERM,
                title: 'Quỹ sinh hoạt đầu kỳ',
                amount: 2500000,
                date: '2026-09-01',
            },
            {
                id: 'tx-2',
                clubId: 'fcode',
                term: CURRENT_TERM,
                title: 'Vật tư workshop',
                amount: -450000,
                date: '2026-09-12',
            },
        ],
        profiles: {},
        settings: {},
        notices: [],
    };
}

export function displayPerson(state, id) {
    return {
        ...(personById(id) ||
            state.members.find((p) => p.id === id) || { id, name: 'Thành viên demo', initials: 'TV' }),
        ...state.profiles[id],
    };
}

// One mutation boundary validates actor + club + resource relationship, even in mock mode.
export function transition(state, action) {
    const { type, userId, clubId, term = CURRENT_TERM, payload = {} } = action;
    const fail = (message) => ({ state, error: message });
    if (!personById(userId)) return fail('Nhân vật demo không hợp lệ.');
    if (type === 'profile') {
        const profiles = {
            ...state.profiles,
            [userId]: {
                headline: String(payload.headline || '').slice(0, 160),
                about: String(payload.about || '').slice(0, 2000),
                skills: String(payload.skills || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .slice(0, 12),
            },
        };
        return { state: { ...state, profiles }, message: 'Đã lưu hồ sơ minh họa.' };
    }
    if (!clubById(clubId)) return fail('Không tìm thấy CLB.');
    if (term !== CURRENT_TERM) return fail('Học kỳ này đã lưu trữ, chỉ có thể xem.');
    const member = membership(state, userId, clubId);
    const manager = member?.role === 'manager';
    const managerActions = [
        'reviewApplication',
        'createActivity',
        'session',
        'reviewContribution',
        'createQuest',
        'report',
        'fulfillGift',
        'settings',
    ];
    if (managerActions.includes(type) && !manager) return fail('Bạn không có quyền quản lý tại CLB này.');
    if (!['apply', 'withdraw'].includes(type) && !member) return fail('Bạn chưa là thành viên của CLB này.');
    const next = structuredClone(state);
    const id = payload.newId || `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    let message = 'Đã cập nhật dữ liệu minh họa.';
    switch (type) {
        case 'apply': {
            if (member) return fail('Bạn đã có quyền truy cập CLB này.');
            if (!(state.settings[clubId]?.recruiting ?? clubById(clubId).recruiting))
                return fail('CLB chưa mở tuyển thành viên.');
            if (!payload.reason?.trim()) return fail('Hãy giới thiệu lý do bạn muốn tham gia.');
            if (state.applications.some((a) => a.userId === userId && a.clubId === clubId && a.status === 'pending'))
                return fail('Bạn đã có đơn đang chờ duyệt.');
            next.applications.push({
                id,
                clubId,
                userId,
                name: personById(userId).name,
                reason: payload.reason.trim(),
                status: 'pending',
            });
            message = 'Đã gửi đơn. Chủ CLB sẽ xem và phản hồi cho bạn.';
            break;
        }
        case 'withdraw': {
            const a = next.applications.find(
                (a) => a.id === payload.id && a.clubId === clubId && a.userId === userId && a.status === 'pending',
            );
            if (!a) return fail('Không tìm thấy đơn đang chờ của bạn.');
            a.status = 'withdrawn';
            message = 'Đã rút đơn tham gia.';
            break;
        }
        case 'reviewApplication': {
            const a = next.applications.find(
                (a) => a.id === payload.id && a.clubId === clubId && a.status === 'pending',
            );
            if (!a) return fail('Đơn không tồn tại hoặc đã được xử lý.');
            if (!['approved', 'rejected'].includes(payload.status)) return fail('Trạng thái xét duyệt không hợp lệ.');
            a.status = payload.status;
            if (a.status === 'approved' && !membership(next, a.userId, clubId)) {
                next.memberships.push({ userId: a.userId, clubId, role: 'member', status: 'approved' });
                if (!personById(a.userId) && !next.members.some((m) => m.id === a.userId))
                    next.members.push({
                        id: a.userId,
                        name: a.name,
                        initials: a.name
                            .split(' ')
                            .slice(-2)
                            .map((s) => s[0])
                            .join(''),
                    });
            }
            message = a.status === 'approved' ? 'Đã chào đón thành viên mới vào CLB.' : 'Đã từ chối đơn tham gia.';
            break;
        }
        case 'register':
        case 'checkin':
        case 'session': {
            const event = next.activities.find((e) => e.id === payload.id && e.clubId === clubId && e.term === term);
            if (!event) return fail('Hoạt động không thuộc CLB/học kỳ hiện tại.');
            if (type === 'session') {
                if (event.status !== 'live') return fail('Chỉ mở điểm danh cho hoạt động đang diễn ra.');
                event.sessionOpen = !event.sessionOpen;
                break;
            }
            if (type === 'register') {
                if (event.status !== 'upcoming') return fail('Thời gian đăng ký đã kết thúc.');
                if (event.registered.includes(userId)) {
                    event.registered = event.registered.filter((u) => u !== userId);
                    message = 'Đã hủy đăng ký.';
                } else {
                    if (event.registered.length >= event.capacity) return fail('Hoạt động đã đủ chỗ.');
                    event.registered.push(userId);
                    message = 'Đã đăng ký. Hẹn gặp bạn tại hoạt động!';
                }
            } else {
                if (event.status !== 'live' || !event.sessionOpen)
                    return fail('Phiên điểm danh chưa mở hoặc đã kết thúc.');
                if (!event.registered.includes(userId)) return fail('Bạn chưa đăng ký hoạt động này.');
                if (event.checkedIn.includes(userId)) return fail('Bạn đã điểm danh hoạt động này.');
                if (String(payload.code).trim().toUpperCase() !== 'FPT26')
                    return fail('Mã demo không đúng. Hãy dùng FPT26.');
                event.checkedIn.push(userId);
                next.ledger.push({
                    id,
                    userId,
                    clubId,
                    term,
                    amount: event.points,
                    reason: `Tham gia: ${event.title}`,
                    source: event.id,
                    verifier: 'Phiên check-in mô phỏng',
                    date: '2026-09-16',
                });
                message = `Check-in thành công. Đã ghi nhận ${event.points} điểm demo.`;
            }
            break;
        }
        case 'createActivity': {
            if (!payload.title?.trim() || !payload.date || !payload.location?.trim())
                return fail('Vui lòng nhập tên, thời gian và địa điểm.');
            if (!Number.isFinite(Date.parse(payload.date)) || Date.parse(payload.date) <= Date.parse(DEMO_NOW))
                return fail('Chọn thời gian sau ngày demo 16/09/2026 lúc 10:00.');
            next.activities.push({
                id,
                clubId,
                term,
                title: payload.title.trim(),
                description: payload.description || 'Hoạt động mới của CLB.',
                date: payload.date,
                location: payload.location.trim(),
                capacity: 25,
                points: 20,
                public: false,
                status: 'upcoming',
                registered: [],
                checkedIn: [],
                sessionOpen: false,
            });
            message = 'Đã tạo hoạt động nội bộ.';
            break;
        }
        case 'createQuest': {
            if (!payload.title?.trim()) return fail('Vui lòng nhập tên nhiệm vụ.');
            next.quests.push({
                id,
                clubId,
                term,
                title: payload.title.trim(),
                description: payload.description || 'Gửi minh chứng đóng góp để được ghi nhận.',
                points: 50,
            });
            break;
        }
        case 'contribute': {
            const q = next.quests.find((q) => q.id === payload.id && q.clubId === clubId && q.term === term);
            if (!q || !payload.evidence?.trim()) return fail('Nhiệm vụ hoặc minh chứng chưa hợp lệ.');
            if (next.submissions.some((s) => s.questId === q.id && s.userId === userId && s.status !== 'revision'))
                return fail('Bạn đã gửi đóng góp cho nhiệm vụ này.');
            next.submissions = next.submissions.filter(
                (s) => !(s.questId === q.id && s.userId === userId && s.status === 'revision'),
            );
            next.submissions.push({
                id,
                questId: q.id,
                clubId,
                term,
                userId,
                evidence: payload.evidence.trim(),
                status: 'pending',
            });
            message = 'Đã gửi minh chứng, chờ chủ CLB xác nhận.';
            break;
        }
        case 'reviewContribution': {
            const sub = next.submissions.find(
                (s) => s.id === payload.id && s.clubId === clubId && s.term === term && s.status === 'pending',
            );
            if (!sub) return fail('Đóng góp không tồn tại hoặc đã được xử lý.');
            if (sub.userId === userId) return fail('Không tự xác nhận đóng góp của chính mình.');
            if (!payload.note?.trim()) return fail('Cần ghi rõ lý do xác nhận hoặc yêu cầu bổ sung.');
            if (!['approved', 'revision'].includes(payload.status)) return fail('Trạng thái không hợp lệ.');
            sub.status = payload.status;
            sub.note = payload.note.trim();
            const q = next.quests.find((q) => q.id === sub.questId && q.clubId === clubId);
            if (!q) return fail('Không tìm thấy nhiệm vụ.');
            if (sub.status === 'approved')
                next.ledger.push({
                    id,
                    userId: sub.userId,
                    clubId,
                    term,
                    amount: q.points,
                    reason: q.title,
                    source: sub.evidence,
                    verifier: personById(userId).name,
                    date: '2026-09-16',
                    note: sub.note,
                });
            message = 'Đã gửi kết quả xét duyệt đóng góp.';
            break;
        }
        case 'redeem': {
            const gift = next.gifts.find((g) => g.id === payload.id && g.clubId === clubId);
            if (!gift || gift.stock < 1) return fail('Quà đã hết hàng.');
            if (wallet(state, userId, clubId) < gift.cost) return fail('Số dư đổi quà chưa đủ.');
            gift.stock -= 1;
            next.redemptions.push({ id, clubId, userId, name: gift.name, cost: gift.cost, status: 'pending' });
            message = 'Đổi quà thành công. Bạn có thể nhận quà tại CLB.';
            break;
        }
        case 'fulfillGift': {
            const r = next.redemptions.find(
                (r) => r.id === payload.id && r.clubId === clubId && r.status === 'pending',
            );
            if (!r) return fail('Yêu cầu không tồn tại hoặc đã nhận quà.');
            r.status = 'received';
            message = 'Đã xác nhận trao quà.';
            break;
        }
        case 'report': {
            if (!payload.title?.trim() || !payload.content?.trim()) return fail('Báo cáo cần tiêu đề và nội dung.');
            let r = next.reports.find((r) => r.id === payload.id && r.clubId === clubId && r.term === term);
            if (payload.id && !r) return fail('Không tìm thấy báo cáo trong CLB này.');
            if (r?.status === 'submitted') return fail('Báo cáo đã nộp, không thể sửa.');
            if (!r) {
                r = { id, clubId, term };
                next.reports.push(r);
            }
            Object.assign(r, {
                title: payload.title.trim(),
                content: payload.content.trim(),
                status: payload.submit ? 'submitted' : 'draft',
            });
            message = payload.submit ? 'Đã nộp báo cáo mock.' : 'Đã lưu bản nháp.';
            break;
        }
        case 'settings': {
            next.settings[clubId] = {
                recruiting: Boolean(payload.recruiting),
                description: String(payload.description || '').slice(0, 1000),
            };
            message = 'Đã cập nhật giới thiệu CLB.';
            break;
        }
        default:
            return fail('Thao tác không được hỗ trợ.');
    }
    next.notices.unshift({ id, userId, clubId, message });
    next.notices = next.notices.slice(0, 30);
    return { state: next, message };
}
