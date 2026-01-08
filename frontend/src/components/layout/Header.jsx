import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogOut, User as UserIcon, Bell, Search, Globe, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Header = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Notification States
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'ar' : 'en';
        i18n.changeLanguage(newLang);
        localStorage.setItem('language', newLang); // Save to localStorage
        document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = newLang;
    };

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const headers = { Authorization: `Bearer ${token}` };

                // Fetch both News and Expiring Documents in parallel
                const [newsRes, alertsRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/news', { headers }).catch(() => ({ data: [] })),
                    axios.get('http://localhost:5000/api/documents/expiring', { headers }).catch(() => ({ data: [] }))
                ]);

                // Format News
                const newsItems = newsRes.data.map(n => ({
                    ...n,
                    type: 'news',
                    notifTitle: n.title,
                    notifContent: n.content,
                    date: new Date(n.created_at)
                }));

                // Format Alerts
                const alertItems = alertsRes.data.map(d => ({
                    id: `doc-${d.id}`,
                    type: 'alert',
                    notifTitle: t('notifications.doc_expiry_title', 'Document Expiring'),
                    notifContent: `${d.document_type} for ${d.first_name} ${d.last_name} expires in ${d.days_left} days`,
                    date: new Date(), // Alerts are "now"
                    isUrgent: d.days_left <= 7
                }));

                // Merge and Sort
                const allNotifs = [...alertItems, ...newsItems].sort((a, b) => b.date - a.date).slice(0, 10);

                setNotifications(allNotifs);
                setUnreadCount(allNotifs.length);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [t]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <header className="h-16 px-6 bg-white/80 backdrop-blur-md border-b border-secondary-200 flex items-center justify-between fixed top-0 right-0 left-64 z-30 rtl:left-0 rtl:right-64 transition-all duration-300">
            {/* Search Bar */}
            <div className="flex items-center gap-3 bg-secondary-50 px-3 py-2 rounded-lg w-96 border border-secondary-100 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
                <Search className="w-5 h-5 text-secondary-400" />
                <input
                    type="text"
                    placeholder={t('header.search_placeholder', 'Search...')}
                    className="bg-transparent border-none outline-none text-sm text-secondary-700 w-full placeholder:text-secondary-400"
                />
            </div>

            <div className="flex items-center gap-4">
                {/* Language Switcher */}
                <button
                    onClick={toggleLanguage}
                    className="p-2 text-secondary-500 hover:text-primary-600 transition-colors"
                    title="Switch Language"
                >
                    <Globe className="w-5 h-5" />
                </button>

                {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="relative p-2 text-secondary-500 hover:text-secondary-700 rounded-full hover:bg-secondary-100 transition-colors"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        )}
                    </button>

                    {/* Dropdown */}
                    {isNotifOpen && (
                        <div className="absolute right-0 rtl:left-0 rtl:right-auto top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-secondary-100 py-2 animate-in fade-in zoom-in duration-200">
                            <div className="px-4 py-2 border-b border-secondary-100 flex justify-between items-center">
                                <h3 className="font-semibold text-secondary-900">{t('header.notifications', 'Notifications')}</h3>
                                <span className="text-xs text-primary-600 cursor-pointer hover:underline">{t('header.mark_all_read', 'Mark all read')}</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <p className="text-center text-sm text-secondary-400 py-4">{t('header.no_notifications', 'No new notifications')}</p>
                                ) : (
                                    notifications.map((item, idx) => (
                                        <div key={item.id || idx} className={`px-4 py-3 hover:bg-secondary-50 cursor-pointer border-b border-secondary-50 last:border-none ${item.type === 'alert' ? 'bg-red-50/50' : ''}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    {item.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                                    <p className={`text-sm font-semibold line-clamp-1 ${item.type === 'alert' ? 'text-red-700' : 'text-secondary-800'}`}>
                                                        {item.notifTitle}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] text-secondary-400 shrink-0 ml-2">
                                                    {item.date && item.date.toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-secondary-500 line-clamp-2">{item.notifContent}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="px-4 py-2 border-t border-secondary-100 text-center">
                                <Link to="/" className="text-xs font-medium text-primary-600 hover:text-primary-700">{t('header.view_all', 'View all updates')}</Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="flex items-center gap-3 pl-4 border-l border-secondary-200 rtl:pl-0 rtl:pr-4 rtl:border-l-0 rtl:border-r">
                    <div className="text-right hidden sm:block rtl:text-left">
                        <p className="text-sm font-medium text-secondary-900">
                            {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-secondary-500">Administrator</p>
                    </div>

                    <div className="relative group">
                        <button className="w-9 h-9 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                            <UserIcon className="w-5 h-5" />
                        </button>

                        <div className="absolute right-0 rtl:left-0 rtl:right-auto top-full mt-2 w-48 bg-white rounded-lg shadow-premium border border-secondary-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right">
                            <div className="p-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left rtl:text-right flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4 rtl:ml-2" />
                                    {t('sidebar.logout', 'Sign Out')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
