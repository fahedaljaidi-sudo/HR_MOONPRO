import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Clock, CheckCircle, LogIn, LogOut, AlertCircle, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AttendancePage = () => {
    const { t } = useTranslation();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [status, setStatus] = useState('loading'); // loading, out, in, completed, not_employee
    const [record, setRecord] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingAction, setLoadingAction] = useState(false);

    const token = localStorage.getItem('token');
    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    // Clock Tick
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Initial Fetch
    const fetchData = async () => {
        try {
            const [statusRes, historyRes] = await Promise.all([
                api.get('/attendance/status'),
                api.get('/attendance/history')
            ]);

            setStatus(statusRes.data.status);
            setRecord(statusRes.data.record);
            setHistory(historyRes.data);

        } catch (error) {
            console.error("Fetch Error", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCheckIn = async () => {
        setLoadingAction(true);
        try {
            await api.post('/attendance/check-in');
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Check-in failed');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleCheckOut = async () => {
        setLoadingAction(true);
        try {
            await api.post('/attendance/check-out');
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Check-out failed');
        } finally {
            setLoadingAction(false);
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">{t('attendance.title')}</h1>
                    <p className="text-secondary-500">{t('attendance.subtitle')}</p>
                </div>
                <div className="text-right rtl:text-left">
                    <p className="text-sm text-secondary-500">
                        {currentTime.toISOString().split('T')[0]}
                    </p>
                    <p className="text-2xl font-mono font-bold text-primary-600">{currentTime.toLocaleTimeString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Action Card */}
                <div className="md:col-span-2">
                    <Card className="h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-white to-secondary-50">

                        {status === 'loading' && <p>{t('dashboard.loading')}</p>}

                        {status === 'not_employee' && (
                            <div className="text-red-500">
                                <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                                <h3 className="font-bold">{t('attendance.access_denied')}</h3>
                                <p>{t('attendance.not_linked')}</p>
                            </div>
                        )}

                        {status === 'out' && (
                            <>
                                <div className="w-20 h-20 rounded-full bg-secondary-100 flex items-center justify-center mb-4 text-secondary-400">
                                    <Clock className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-bold text-secondary-900 mb-2">{t('attendance.ready_to_start')}</h2>
                                <p className="text-secondary-500 mb-6">{t('attendance.not_checked_in')}</p>
                                <Button size="lg" className="w-48 h-12 text-lg" onClick={handleCheckIn} disabled={loadingAction}>
                                    <LogIn className="w-5 h-5 rtl:ml-2 ltr:mr-2" /> {loadingAction ? t('attendance.checking_in') : t('attendance.check_in')}
                                </Button>
                            </>
                        )}

                        {status === 'in' && (
                            <>
                                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4 text-green-600 animate-pulse">
                                    <CheckCircle className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-bold text-secondary-900 mb-2">{t('attendance.checked_in')}</h2>
                                <p className="text-secondary-500 mb-6">{t('attendance.since')} {formatTime(record?.check_in)}</p>
                                <Button size="lg" variant="destructive" className="w-48 h-12 text-lg" onClick={handleCheckOut} disabled={loadingAction}>
                                    <LogOut className="w-5 h-5 rtl:ml-2 ltr:mr-2" /> {loadingAction ? t('attendance.checking_out') : t('attendance.check_out')}
                                </Button>
                            </>
                        )}

                        {status === 'completed' && (
                            <>
                                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-4 text-primary-600">
                                    <CheckCircle className="w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-bold text-secondary-900 mb-2">{t('attendance.day_completed')}</h2>
                                <p className="text-secondary-500">
                                    {t('attendance.worked_from_to', { start: formatTime(record?.check_in), end: formatTime(record?.check_out) })}
                                </p>
                            </>
                        )}
                    </Card>
                </div>

                {/* Info / Stats Side */}
                <div className="space-y-6">
                    <Card title={t('attendance.today_summary')}>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-secondary-100 pb-2">
                                <span className="text-secondary-500">{t('attendance.check_in')}</span>
                                <span className="font-medium">{record ? formatTime(record.check_in) : '--:--'}</span>
                            </div>
                            <div className="flex justify-between border-b border-secondary-100 pb-2">
                                <span className="text-secondary-500">{t('attendance.check_out')}</span>
                                <span className="font-medium">{record?.check_out ? formatTime(record.check_out) : '--:--'}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* History Table */}
            <div className="mt-6">
                <Card title={t('attendance.history')} className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left rtl:text-right text-sm text-secondary-600">
                            <thead className="bg-secondary-50 text-secondary-900 font-medium">
                                <tr>
                                    <th className="px-4 py-3">{t('attendance.date')}</th>
                                    <th className="px-4 py-3">{t('attendance.check_in')}</th>
                                    <th className="px-4 py-3">{t('attendance.check_out')}</th>
                                    <th className="px-4 py-3">{t('attendance.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-4 text-center text-secondary-400">{t('attendance.no_history')}</td>
                                    </tr>
                                )}
                                {history.map(row => (
                                    <tr key={row.id}>
                                        <td className="px-4 py-3 font-medium text-secondary-900">
                                            {new Date(row.date).toISOString().split('T')[0]}
                                        </td>
                                        <td className="px-4 py-3">{formatTime(row.check_in)}</td>
                                        <td className="px-4 py-3">{formatTime(row.check_out)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs ${row.check_out ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {row.check_out ? t('attendance.completed') : t('attendance.working')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

        </Layout>
    );
};

export default AttendancePage;
