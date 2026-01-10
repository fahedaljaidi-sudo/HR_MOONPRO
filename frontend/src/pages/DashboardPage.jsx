import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Users, UserMinus, UserPlus, CalendarCheck, Megaphone, Calendar as CalendarIcon, X, Settings2, BarChart3, PieChart as PieChartIcon, Activity, Check, GripHorizontal } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DraggableGrid, HiddenWidgetBar } from '../components/dashboard/DashboardDnD';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];

const DashboardPage = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    // News Modal State
    const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
    const [newNews, setNewNews] = useState({ title: '', content: '', type: 'news', event_date: '' });

    const [isAdmin, setIsAdmin] = useState(false);

    // Customization State
    const [isEditMode, setIsEditMode] = useState(false);

    // Default Layout Definition
    const defaultLayout = [
        { id: 'stat_employees', visible: true, type: 'stat' },
        { id: 'stat_leave', visible: true, type: 'stat' },
        { id: 'stat_new_hires', visible: true, type: 'stat' },
        { id: 'stat_attendance', visible: true, type: 'stat' },
        { id: 'chart_dist', visible: true, type: 'chart' },
        { id: 'chart_attendance', visible: true, type: 'chart' },
        { id: 'chart_nationality', visible: true, type: 'chart' },
        { id: 'section_news', visible: true, type: 'chart' },
    ];

    const [layout, setLayout] = useState(() => {
        const saved = localStorage.getItem('dashboard_layout_v2');
        return saved ? JSON.parse(saved) : defaultLayout;
    });

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const role = (payload.role || '').toLowerCase();
                setIsAdmin(['admin', 'manager', 'owner'].includes(role));
            } catch (e) { }
        }
    }, [token]);

    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    const [errorMsg, setErrorMsg] = useState('');

    const fetchData = async () => {
        try {
            const [statsRes, newsRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/news')
            ]);
            setStats(statsRes.data);
            setNews(newsRes.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load dashboard", error);
            setErrorMsg(error.response?.data?.message || error.message || "Unknown error");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePostNews = async (e) => {
        e.preventDefault();
        try {
            await api.post('/news', newNews);
            setIsNewsModalOpen(false);
            setNewNews({ title: '', content: '', type: 'news', event_date: '' });
            fetchData(); // Refresh list
        } catch (error) {
            console.error("Failed to post news", error);
            alert("Failed to post");
        }
    };

    // --- Layout Management ---

    const updateLayout = (newLayout) => {
        setLayout(newLayout);
        localStorage.setItem('dashboard_layout_v2', JSON.stringify(newLayout));
    };

    const handleReorderStats = (newStatsOrder) => {
        const chartsPart = layout.filter(item => item.type !== 'stat');
        updateLayout([...newStatsOrder, ...chartsPart]);
    };

    const handleReorderCharts = (newChartsOrder) => {
        const statsPart = layout.filter(item => item.type === 'stat');
        updateLayout([...statsPart, ...newChartsOrder]);
    };

    const handleRemoveWidget = (id) => {
        const newLayout = layout.map(item => item.id === id ? { ...item, visible: false } : item);
        updateLayout(newLayout);
    };

    const handleAddWidget = (id) => {
        const newLayout = layout.map(item => item.id === id ? { ...item, visible: true } : item);
        updateLayout(newLayout);
    };

    // --- Widget Definitions ---
    const allWidgets = [
        { id: 'stat_employees', titleKey: 'dashboard.total_employees', defaultTitle: 'Total Employees', icon: Users, type: 'stat' },
        { id: 'stat_leave', titleKey: 'dashboard.on_leave', defaultTitle: 'On Leave', icon: UserMinus, type: 'stat' },
        { id: 'stat_new_hires', titleKey: 'dashboard.new_hires', defaultTitle: 'New Hires', icon: UserPlus, type: 'stat' },
        { id: 'stat_attendance', titleKey: 'dashboard.attendance_rate', defaultTitle: 'Attendance Rate', icon: CalendarCheck, type: 'stat' },
        { id: 'chart_dist', titleKey: 'dashboard.distribution', defaultTitle: 'Department Distribution', icon: PieChartIcon, type: 'chart' },
        { id: 'chart_attendance', titleKey: 'dashboard.attendance_status', defaultTitle: 'Attendance Status', icon: Activity, type: 'chart' },
        { id: 'chart_nationality', titleKey: 'dashboard.nationality_distribution', defaultTitle: 'Nationality Distribution', icon: BarChart3, type: 'chart' },
        { id: 'section_news', titleKey: 'dashboard.news_events', defaultTitle: 'News & Events', icon: Megaphone, type: 'section' },
    ];

    const renderWidget = (id) => {
        if (!stats) return null;

        switch (id) {
            // Stats
            case 'stat_employees':
                return <StatCard key={id} title={t('dashboard.total_employees')} value={stats.stats.totalEmployees} icon={Users} color="bg-blue-50 text-blue-600" />;
            case 'stat_leave':
                return <StatCard key={id} title={t('dashboard.on_leave')} value={stats.stats.onLeave} icon={UserMinus} color="bg-amber-50 text-amber-600" />;
            case 'stat_new_hires':
                return <StatCard key={id} title={t('dashboard.new_hires')} value={stats.stats.newHires} icon={UserPlus} color="bg-green-50 text-green-600" />;
            case 'stat_attendance':
                return <StatCard key={id} title={t('dashboard.attendance_rate')} value={`${stats.stats.attendanceRate}%`} icon={CalendarCheck} color="bg-purple-50 text-purple-600" />;

            // Charts
            case 'chart_dist':
                return (
                    <Card key={id} className="min-h-[350px] overflow-hidden flex flex-col">
                        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-6">{t('dashboard.distribution')}</h3>
                        <div className="w-full h-[250px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <PieChart>
                                    <Pie data={stats.charts.departmentDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count">
                                        {stats.charts.departmentDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#1f2937', fontWeight: 600 }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-sm font-medium text-secondary-600">{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                );
            case 'chart_attendance':
                return (
                    <Card key={id} className="min-h-[350px] flex flex-col relative overflow-hidden">
                        <h3 className="text-lg font-semibold text-secondary-900 mb-2">{t('dashboard.attendance_rate')}</h3>
                        <div className="flex-1 w-full min-h-[250px] flex items-center justify-center relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={24} data={[{ name: 'Attendance', value: stats.stats.attendanceRate || 0, fill: stats.stats.attendanceRate >= 75 ? '#10b981' : stats.stats.attendanceRate >= 50 ? '#f59e0b' : '#ef4444' }]} startAngle={180} endAngle={0}>
                                    <RadialBar background dataKey="value" cornerRadius={12} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
                                <span className="text-4xl font-bold text-secondary-900">{stats.stats.attendanceRate}%</span>
                                <span className="text-sm text-secondary-500 font-medium mt-1">{t('attendance.status')}</span>
                                <p className="text-xs text-secondary-400 mt-2 px-6 text-center">
                                    {stats.stats.attendanceRate >= 90 ? t('dashboard.perf_excellent') : stats.stats.attendanceRate >= 75 ? t('dashboard.perf_good') : t('dashboard.perf_improvement')}
                                </p>
                            </div>
                        </div>
                    </Card>
                );
            case 'chart_nationality':
                return (
                    <Card key={id} className="min-h-[350px] flex flex-col overflow-hidden">
                        <h3 className="text-lg font-semibold text-secondary-900 mb-6">{t('dashboard.nationality_distribution')}</h3>
                        <div className="w-full h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.charts.nationalityDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(value) => t(`countries.${value}`) || value} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f3f4f6' }} formatter={(value, name, props) => [value, t(`countries.${props.payload.name}`) || props.payload.name]} labelFormatter={(label) => t(`countries.${label}`) || label} />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30}>
                                        {stats.charts.nationalityDistribution?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                );
            case 'section_news':
                return (
                    <Card key={id} className="h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-6 border-b border-secondary-100 pb-4">
                            <Megaphone className="w-5 h-5 text-accent" />
                            <h3 className="text-lg font-semibold text-secondary-900">{t('dashboard.news_events')}</h3>
                        </div>
                        <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px]">
                            {news.length === 0 ? (
                                <p className="text-secondary-400 text-center py-4">{t('dashboard.no_news')}</p>
                            ) : (
                                news.map((item) => (
                                    <div key={item.id} className="p-3 rounded-lg border border-secondary-100 bg-secondary-50/50 hover:bg-white transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-3">
                                                <div className={`p-2 rounded-lg shrink-0 ${item.type === 'event' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {item.type === 'event' ? <CalendarIcon className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-secondary-900">{item.title}</h4>
                                                    <p className="text-xs text-secondary-500 mt-1 line-clamp-2">{item.content}</p>
                                                    {item.event_date && (
                                                        <div className="mt-2 text-xs font-medium text-purple-600 flex items-center gap-1">
                                                            <CalendarIcon className="w-3 h-3" />
                                                            {new Date(item.event_date).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-secondary-400 text-right mt-2">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                );
            default:
                return null;
        }
    };

    if (loading) return <Layout><div className="p-8 text-center">{t('dashboard.loading')}</div></Layout>;
    if (!stats) return (
        <Layout>
            <div className="p-8 text-center text-red-500">
                <h2 className="text-xl font-bold mb-2">{t('dashboard.error')}</h2>
                <p className="text-sm text-gray-600" dir="ltr">{errorMsg}</p>
                <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
                    Retry / إعادة المحاولة
                </Button>
            </div>
        </Layout>
    );

    // Filter visible items
    // Split Layout
    const visibleStats = layout.filter(item => item.visible && item.type === 'stat');
    const visibleCharts = layout.filter(item => item.visible && item.type !== 'stat');
    const hiddenItems = layout.filter(item => !item.visible);

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">{t('dashboard.title')}</h1>
                    <p className="text-secondary-500">{t('dashboard.welcome')}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setIsEditMode(!isEditMode)}
                        size="sm"
                        variant={isEditMode ? "default" : "outline"}
                        className={`gap-2 transition-all ${isEditMode ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md ring-2 ring-primary-200' : ''}`}
                    >
                        {isEditMode ? <Check className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
                        {isEditMode ? t('common.done') : t('dashboard.customize', 'Customize')}
                    </Button>

                    {!isEditMode && isAdmin && (
                        <Button onClick={() => setIsNewsModalOpen(true)} size="sm" className="bg-primary-600">
                            <Megaphone className="w-4 h-4 rtl:ml-2 ltr:mr-2" /> {t('dashboard.post_news')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Hidden Bar */}
            {isEditMode && (
                <HiddenWidgetBar
                    hiddenItems={hiddenItems}
                    allWidgetsInfo={allWidgets}
                    onAdd={handleAddWidget}
                />
            )}

            {/* Draggable Stats Zone */}
            <DraggableGrid
                items={visibleStats}
                renderItem={renderWidget}
                onReorder={handleReorderStats}
                onRemove={handleRemoveWidget}
                isEditMode={isEditMode}
                columns={4}
            />

            {/* Draggable Charts Zone */}
            <DraggableGrid
                items={visibleCharts}
                renderItem={renderWidget}
                onReorder={handleReorderCharts}
                onRemove={handleRemoveWidget}
                isEditMode={isEditMode}
                columns={3}
            />

            {/* Post News Modal */}
            {
                isNewsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center p-4 border-b border-secondary-100 bg-secondary-50">
                                <h3 className="font-semibold text-lg">{t('dashboard.modal_title')}</h3>
                                <button onClick={() => setIsNewsModalOpen(false)} className="text-secondary-400 hover:text-red-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handlePostNews} className="p-4 space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-secondary-700">{t('dashboard.input_title')}</label>
                                    <Input
                                        value={newNews.title}
                                        onChange={e => setNewNews({ ...newNews, title: e.target.value })}
                                        placeholder={t('dashboard.input_title')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-secondary-700">{t('dashboard.input_content')}</label>
                                    <textarea
                                        className="w-full mt-1 rounded-md border border-secondary-200 p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                        rows="3"
                                        value={newNews.content}
                                        onChange={e => setNewNews({ ...newNews, content: e.target.value })}
                                        placeholder={t('dashboard.input_content')}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-sm font-medium text-secondary-700">{t('dashboard.input_type')}</label>
                                        <select
                                            className="w-full mt-1 h-10 rounded-md border border-secondary-200 bg-white px-3 text-sm"
                                            value={newNews.type}
                                            onChange={e => setNewNews({ ...newNews, type: e.target.value })}
                                        >
                                            <option value="news">{t('dashboard.news_type')} 📢</option>
                                            <option value="event">{t('dashboard.event_type')} 📅</option>
                                        </select>
                                    </div>
                                    {newNews.type === 'event' && (
                                        <div className="flex-1">
                                            <label className="text-sm font-medium text-secondary-700">{t('dashboard.input_date')}</label>
                                            <Input
                                                type="date"
                                                value={newNews.event_date}
                                                onChange={e => setNewNews({ ...newNews, event_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="pt-2 flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsNewsModalOpen(false)}>{t('common.cancel')}</Button>
                                    <Button type="submit">{t('dashboard.post_news')}</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </Layout >
    );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="glass-card p-6 rounded-xl border border-secondary-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-secondary-500 text-sm font-medium mb-1 dark:text-secondary-400">{title}</p>
            <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
    </div>
);

export default DashboardPage;
