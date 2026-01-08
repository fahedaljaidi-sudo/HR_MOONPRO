import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield, Plus, Trash2, Edit } from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
    { id: 'manage_employees', label: 'Manage Employees (Add/Edit/Delete)' },
    { id: 'view_employees', label: 'View Employees Only' },
    { id: 'manage_attendance', label: 'Manage Attendance' },
    { id: 'view_attendance', label: 'View Attendance Reports' },
    { id: 'manage_roles', label: 'Manage Roles & Permissions' },
    { id: 'manage_settings', label: 'Manage Company Settings' },
];

const RolesPage = () => {
    const { t } = useTranslation();
    const [roles, setRoles] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', permissions: [] });
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem('token');
    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data);
        } catch (error) {
            console.error('Fetch Roles Error', error);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handlePermissionToggle = (permId) => {
        setFormData(prev => {
            const newPerms = prev.permissions.includes(permId)
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId];
            return { ...prev, permissions: newPerms };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/roles', formData);
            await fetchRoles();
            setShowForm(false);
            setFormData({ name: '', description: '', permissions: [] });
        } catch (error) {
            alert('Failed to create role');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this role?')) return;
        try {
            await api.delete(`/roles/${id}`);
            fetchRoles();
        } catch (error) {
            alert('Failed to delete role');
        }
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">{t('roles.title')}</h1>
                    <p className="text-secondary-500">{t('roles.subtitle')}</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? t('common.cancel') : <><Plus className="w-4 h-4 mr-2" /> {t('roles.create_role')}</>}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-6 animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">{t('roles.role_name')}</label>
                                <Input
                                    placeholder={t('roles.placeholder_name') || "e.g. HR Manager"}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">{t('roles.description')}</label>
                                <Input
                                    placeholder={t('roles.placeholder_desc') || "Brief description of the role..."}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">{t('roles.permissions')}</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {AVAILABLE_PERMISSIONS.map(p => (
                                    <label key={p.id} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-secondary-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                            checked={formData.permissions.includes(p.id)}
                                            onChange={() => handlePermissionToggle(p.id)}
                                        />
                                        <span className="text-sm text-secondary-700">{t(`permissions.${p.id.toUpperCase()}`)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={loading}>
                                {loading ? t('roles.creating') : t('roles.create_role')}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map(role => (
                    <Card key={role.id} className="hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
                                <Shield className="w-6 h-6" />
                            </div>
                            <button
                                onClick={() => handleDelete(role.id)}
                                className="text-secondary-400 hover:text-red-500 p-1"
                                title="Delete Role"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <h3 className="text-lg font-bold text-secondary-900 mb-1">{role.name}</h3>
                        <p className="text-sm text-secondary-500 mb-4 h-10 line-clamp-2">
                            {role.description || 'No description provided.'}
                        </p>

                        <div className="border-t border-secondary-100 pt-4">
                            <h4 className="text-xs font-bold text-secondary-400 uppercase tracking-wider mb-2">{t('roles.permissions')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {(role.permissions || []).length > 0 ? (
                                    // Parse if string, otherwise assume array (db returns json typically but mysql driver might return object)
                                    (typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions).slice(0, 3).map(p => (
                                        <span key={p} className="text-xs px-2 py-1 bg-secondary-100 text-secondary-600 rounded-full">
                                            {t(`permissions.${p.toUpperCase()}`)}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-secondary-400 italic">No specific permissions</span>
                                )}
                                {(typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions).length > 3 && (
                                    <span className="text-xs px-2 py-1 bg-secondary-100 text-secondary-400 rounded-full">
                                        +{(typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions).length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </Layout>
    );
};

export default RolesPage;
