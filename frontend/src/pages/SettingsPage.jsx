import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Globe, Bell, Lock, Clock } from 'lucide-react';
import i18n from '../i18n';
import axios from 'axios';

const SettingsPage = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('general');
    const [currentLang, setCurrentLang] = useState(i18n.language);

    // Attendance Settings State
    const [attendanceSettings, setAttendanceSettings] = useState({
        work_start_time: '09:00',
        work_end_time: '17:00',
        late_threshold_minutes: '15'
    });
    const [loading, setLoading] = useState(false);

    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data) {
                setAttendanceSettings(prev => ({
                    ...prev,
                    ...res.data
                }));
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
        }
    };

    const handleSaveAttendance = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/settings/update', attendanceSettings);
            alert(t('settings.attendance.update_success'));
        } catch (error) {
            alert('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang);
        setCurrentLang(lang);
        document.dir = lang === 'ar' ? 'rtl' : 'ltr';
    };

    const tabs = [
        { id: 'general', label: t('settings.tabs.general'), icon: Globe },
        { id: 'attendance', label: t('settings.attendance.title'), icon: Clock },
        { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
        { id: 'security', label: t('settings.tabs.security'), icon: Lock },
    ];

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-secondary-900">{t('settings.title')}</h1>
                <p className="text-secondary-500">{t('settings.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <Card className="p-2">
                        <nav className="space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                                        }`}
                                >
                                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-primary-600' : 'text-secondary-400'}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </Card>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {activeTab === 'general' && (
                        <Card title={t('settings.general.language')}>
                            <div className="flex items-center justify-between p-4 border border-secondary-100 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-secondary-900">{t('settings.general.app_language')}</h3>
                                        <p className="text-sm text-secondary-500">{t('settings.general.language_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleLanguageChange('en')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${currentLang === 'en'
                                            ? 'bg-primary-600 text-white border-primary-600'
                                            : 'bg-white text-secondary-600 border-secondary-200 hover:bg-secondary-50'
                                            }`}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => handleLanguageChange('ar')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-all ${currentLang === 'ar'
                                            ? 'bg-primary-600 text-white border-primary-600'
                                            : 'bg-white text-secondary-600 border-secondary-200 hover:bg-secondary-50'
                                            }`}
                                    >
                                        العربية
                                    </button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'attendance' && (
                        <Card title={t('settings.attendance.title')}>
                            <form onSubmit={handleSaveAttendance} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">{t('settings.attendance.work_start')}</label>
                                        <input
                                            type="time"
                                            className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                            value={attendanceSettings.work_start_time}
                                            onChange={(e) => setAttendanceSettings({ ...attendanceSettings, work_start_time: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">{t('settings.attendance.work_end')}</label>
                                        <input
                                            type="time"
                                            className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                            value={attendanceSettings.work_end_time}
                                            onChange={(e) => setAttendanceSettings({ ...attendanceSettings, work_end_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">{t('settings.attendance.late_threshold')}</label>
                                    <input
                                        type="number"
                                        className="w-full max-w-xs px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                        value={attendanceSettings.late_threshold_minutes}
                                        onChange={(e) => setAttendanceSettings({ ...attendanceSettings, late_threshold_minutes: e.target.value })}
                                    />
                                    <p className="text-xs text-secondary-500 mt-1">
                                        الوقت المسموح به بعد بداية الدوام قبل احتساب التأخير.
                                    </p>
                                </div>
                                <div className="pt-2 flex justify-end">
                                    <Button type="submit" disabled={loading}>
                                        {loading ? t('common.loading') : t('salaries.save_changes')}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {activeTab === 'notifications' && (
                        <Card title={t('settings.notifications.title')}>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border-b border-secondary-100">
                                    <div>
                                        <h3 className="font-medium text-secondary-900">{t('settings.notifications.email_alerts')}</h3>
                                        <p className="text-sm text-secondary-500">{t('settings.notifications.email_desc')}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between p-4">
                                    <div>
                                        <h3 className="font-medium text-secondary-900">{t('settings.notifications.browser_alerts')}</h3>
                                        <p className="text-sm text-secondary-500">{t('settings.notifications.browser_desc')}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" />
                                        <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card title={t('settings.security.title')}>
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">{t('settings.security.current_password')}</label>
                                    <input type="password" className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">{t('settings.security.new_password')}</label>
                                    <input type="password" className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                                </div>
                                <div className="pt-2">
                                    <Button>{t('settings.security.update_password')}</Button>
                                </div>
                            </form>
                        </Card>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default SettingsPage;
