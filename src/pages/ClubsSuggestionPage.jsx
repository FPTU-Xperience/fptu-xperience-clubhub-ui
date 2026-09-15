import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

const CATEGORY_LABELS = {
    SPORTS: 'Thể thao',
    ARTS: 'Nghệ thuật',
    ACADEMIC: 'Học thuật',
    VOLUNTEER: 'Tình nguyện',
    TECHNOLOGY: 'Công nghệ',
    OTHER: 'Khác',
};

function normalizedStatus(value) {
    return value?.replace(/[^a-z]/gi, '').toUpperCase() || '';
}

export default function ClubsSuggestionPage() {
    const { error } = useToast();
    const [clubs, setClubs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        let active = true;
        const loadClubs = async () => {
            setIsLoading(true);
            try {
                const result = await api.getClubs();
                if (active) setClubs(Array.isArray(result) ? result : []);
            } catch (err) {
                if (active) error(err.message || 'Không thể tải danh sách câu lạc bộ đề xuất.');
            } finally {
                if (active) setIsLoading(false);
            }
        };
        loadClubs();
        return () => {
            active = false;
        };
    }, [error]);

    const filteredClubs = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return clubs;
        return clubs.filter((club) =>
            [club.name, club.code, club.description, CATEGORY_LABELS[club.category]].some((value) =>
                value?.toLowerCase().includes(query),
            ),
        );
    }, [clubs, searchQuery]);

    return (
        <div className="space-y-6">
            <motion.header
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
            >
                <div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
                        <Sparkles size={13} />
                        Câu lạc bộ đề xuất
                    </span>
                    <h2 className="mt-3 text-3xl font-bold text-white">Gợi ý câu lạc bộ dành riêng cho bạn</h2>
                    <p className="mt-1 max-w-3xl text-sm text-gray-400">
                        Khám phá những câu lạc bộ phù hợp với sở thích và định hướng của bạn. Tính năng gợi ý cá nhân
                        hóa sẽ sớm ra mắt.
                    </p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                        aria-label="Tìm kiếm câu lạc bộ đề xuất"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Tìm theo tên, mã hoặc lĩnh vực..."
                        className="min-w-0 w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-white outline-none focus:border-violet-500"
                    />
                </div>
            </motion.header>

            <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
                <p className="text-sm leading-6 text-violet-200">
                    💡 Tính năng gợi ý theo sở thích đang được phát triển. Danh sách bên dưới tạm thời được lấy từ cùng
                    nguồn dữ liệu câu lạc bộ để bạn dễ dàng khám phá.
                </p>
            </section>

            {isLoading ? (
                <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-violet-400" />
                </div>
            ) : filteredClubs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 py-16 text-center text-gray-500">
                    Không tìm thấy câu lạc bộ phù hợp.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredClubs.map((club, index) => {
                        const approvedMemberCount = (club.members || []).filter(
                            (item) => normalizedStatus(item.status) === 'APPROVED',
                        ).length;
                        return (
                            <motion.article
                                key={club.id}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/65 transition hover:-translate-y-1 hover:border-violet-500/40"
                            >
                                <div className="flex-1 p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        {club.logoUrl ? (
                                            <img
                                                src={club.logoUrl}
                                                alt=""
                                                className="h-12 w-12 rounded-xl object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-xl font-bold text-violet-300">
                                                {club.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-300">
                                            Đề xuất
                                        </span>
                                    </div>
                                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
                                        {club.code}
                                    </p>
                                    <h3 className="mt-1 text-xl font-bold text-white">{club.name}</h3>
                                    <p className="mt-1 text-xs font-semibold text-fuchsia-500">
                                        {CATEGORY_LABELS[club.category] || 'Khác'}
                                    </p>
                                    <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-gray-400">
                                        {club.description || 'Chưa có mô tả.'}
                                    </p>
                                    <dl className="mt-5 space-y-2 border-t border-slate-800 pt-4 text-sm">
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500">Thành viên</dt>
                                            <dd className="font-semibold text-white">{approvedMemberCount}</dd>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <dt className="text-gray-500">Liên hệ</dt>
                                            <dd className="truncate text-gray-300">{club.contactEmail}</dd>
                                        </div>
                                    </dl>
                                </div>
                                <div className="border-t border-slate-800 bg-slate-950/40 p-4">
                                    <p className="text-center text-xs text-gray-500">
                                        Thông tin chi tiết sẽ được bổ sung khi tính năng đề xuất chính thức ra mắt.
                                    </p>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}