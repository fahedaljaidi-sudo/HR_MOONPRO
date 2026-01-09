import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Search, User, Briefcase, Mail, Phone, Calendar, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import OrgChartModal from '../components/employees/OrgChartModal';
import { nationalities } from '../constants/nationalities';

const EmployeesPage = () => {
    const { t } = useTranslation();
    const [employees, setEmployees] = useState([]);
    const [positions, setPositions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isChartOpen, setIsChartOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobPositionId: '',
        hireDate: '',
        manager_id: '',
        nationality: ''
    });

    // Permission Logic
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.id);
                const role = (payload.role || '').toLowerCase();
                setIsAdmin(['admin', 'manager', 'owner'].includes(role));
            } catch (e) { }
        }
    }, [token]);

    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    const fetchData = async () => {
        try {
            const [empRes, posRes] = await Promise.all([
                api.get('/employees'),
                api.get('/org/positions')
            ]);
            setEmployees(empRes.data);
            setPositions(posRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/employees', formData);
            setFormData({
                firstName: '', lastName: '', email: '', phone: '', jobPositionId: '', hireDate: '', manager_id: '', nationality: ''
            });
            setShowForm(false);
            fetchData();
            alert(t('employees.success_add'));
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || t('employees.failed_add'));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toISOString().split('T')[0];
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">{t('employees.title')}</h1>
                    <p className="text-secondary-500">{t('employees.subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsChartOpen(true)}>
                        <BarChart3 className="w-4 h-4 rtl:ml-2 ltr:mr-2" /> {t('employees.chart_view')}
                    </Button>
                    {isAdmin && (
                        <Button onClick={() => setShowForm(!showForm)}>
                            <Plus className="w-4 h-4 rtl:ml-2 ltr:mr-2" /> {t('employees.add_employee')}
                        </Button>
                    )}
                </div>
            </div>

            {showForm && (
                <Card className="mb-6 border-primary-100 ring-4 ring-primary-50">
                    <h2 className="text-lg font-semibold mb-4 text-secondary-900">{t('employees.new_employee_details')}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="firstName" placeholder={t('employees.first_name')} value={formData.firstName} onChange={handleChange} required />
                        <Input name="lastName" placeholder={t('employees.last_name')} value={formData.lastName} onChange={handleChange} required />

                        <Input name="email" type="email" placeholder={t('employees.email')} value={formData.email} onChange={handleChange} required />
                        <Input name="phone" placeholder={t('employees.phone')} value={formData.phone} onChange={handleChange} />

                        <div className="space-y-1">
                            <select
                                name="jobPositionId"
                                className="w-full h-10 rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none"
                                value={formData.jobPositionId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">{t('employees.select_job_position')}</option>
                                {positions.map(p => (
                                    <option key={p.id} value={p.id}>{p.title} - {p.department_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <select
                                name="nationality"
                                className="w-full h-10 rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none"
                                value={formData.nationality}
                                onChange={handleChange}
                                required
                            >
                                <option value="">{t('employees.select_nationality')}</option>
                                {nationalities.map(n => (
                                    <option key={n} value={n}>{t(`countries.${n}`)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <select
                                name="manager_id"
                                className="w-full h-10 rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none"
                                value={formData.manager_id}
                                onChange={handleChange}
                            >
                                <option value="">{t('employees.select_manager_optional')}</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                                ))}
                            </select>
                        </div>

                        <Input name="hireDate" type="date" value={formData.hireDate} onChange={handleChange} />

                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? t('employees.saving') : t('employees.create_account')}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left rtl:text-right text-sm text-secondary-600">
                        <thead className="bg-secondary-50 border-b border-secondary-100 text-secondary-900 font-medium">
                            <tr>
                                <th className="px-6 py-4">{t('employees.table.employee')}</th>
                                <th className="px-6 py-4">{t('employees.table.role_dept')}</th>
                                <th className="px-6 py-4">{t('employees.table.contact')}</th>
                                <th className="px-6 py-4">{t('employees.table.status')}</th>
                                <th className="px-6 py-4">{t('employees.table.joined')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-secondary-400">
                                        {t('employees.no_employees')}
                                    </td>
                                </tr>
                            )}
                            {employees.map(emp => (
                                <tr
                                    key={emp.id}
                                    className={`transition-colors ${isAdmin || currentUserId === emp.id
                                        ? 'hover:bg-secondary-50/50 cursor-pointer'
                                        : 'opacity-75 cursor-not-allowed'
                                        }`}
                                    onClick={() => {
                                        if (isAdmin || currentUserId === emp.id) {
                                            window.location.href = `/employees/${emp.id}`;
                                        } else {
                                            alert(t('common.access_denied') || "Access Denied");
                                        }
                                    }}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                                {emp.first_name[0]}{emp.last_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-secondary-900">{emp.first_name} {emp.last_name}</p>
                                                <p className="text-xs text-secondary-500">{emp.employee_id_code}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-secondary-900">{emp.job_title || '-'}</p>
                                        <p className="text-xs text-secondary-500">{emp.department_name || 'No Dept'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="flex items-center gap-2"><Mail className="w-3 h-3" /> {emp.email}</span>
                                            {emp.phone && <span className="flex items-center gap-2"><Phone className="w-3 h-3" /> {emp.phone}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {emp.is_active ? t('employees.active') : t('employees.inactive')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-secondary-500">
                                        {formatDate(emp.hire_date || emp.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <OrgChartModal
                isOpen={isChartOpen}
                onClose={() => setIsChartOpen(false)}
                employees={employees}
                onRefresh={fetchData}
            />
        </Layout>
    );
};

export default EmployeesPage;
