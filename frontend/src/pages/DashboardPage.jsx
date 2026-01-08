import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Users, UserMinus, UserPlus, CalendarCheck, Activity, Megaphone, Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardPage = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    // News Modal State
    const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
    const [newNews, setNewNews] = useState({ title: '', content: '', type: 'news', event_date: '' });

    const token = localStorage.getItem('token');
    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { Authorization: `Bearer ${token}` }
    });

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

    if (loading) return <Layout><div className="p-8 text-center">{t('dashboard.loading')}</div></Layout>;
    if (!stats) return <Layout><div className="p-8 text-center text-red-500">{t('dashboard.error')}</div></Layout>;

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">{t('dashboard.title')}</h1>
                    <p className="text-secondary-500">{t('dashboard.welcome')}</p>
                </div>
                <Button onClick={() => setIsNewsModalOpen(true)} size="sm" className="bg-primary-600">
                    <Megaphone className="w-4 h-4 rtl:ml-2 ltr:mr-2" /> {t('dashboard.post_news')}
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title={t('dashboard.total_employees')} value={stats.stats.totalEmployees} icon={Users} color="bg-blue-50 text-blue-600" />
                <StatCard title={t('dashboard.on_leave')} value={stats.stats.onLeave} icon={UserMinus} color="bg-amber-50 text-amber-600" />
                <StatCard title={t('dashboard.new_hires')} value={stats.stats.newHires} icon={UserPlus} color="bg-green-50 text-green-600" />
                <StatCard title={t('dashboard.attendance_rate')} value={`${stats.stats.attendanceRate}%`} icon={CalendarCheck} color="bg-purple-50 text-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Department Distribution Chart */}
                <Card className="lg:col-span-2 min-h-[400px] overflow-hidden flex flex-col">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-6">{t('dashboard.distribution')}</h3>
                    <div className="w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={stats.charts.departmentDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f3f4f6' }} />
                                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* News & Events Feed */}
                <Card className="h-full flex flex-col">
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
            </div>

            {/* Post News Modal */}
            {isNewsModalOpen && (
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
            )}
        </Layout>
    );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl border border-secondary-100 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-secondary-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-secondary-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
    </div>
);

export default DashboardPage;
