import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Trash2, Building2, Briefcase, CornerDownRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const OrganizationPage = () => {
    const { t } = useTranslation();
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);

    // Form States
    const [newDeptName, setNewDeptName] = useState('');
    const [parentDeptId, setParentDeptId] = useState(''); // Hierarchy
    const [newPosTitle, setNewPosTitle] = useState('');
    const [selectedDeptId, setSelectedDeptId] = useState('');

    const token = localStorage.getItem('token');
    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: { Authorization: `Bearer ${token}` }
    });

    const fetchData = async () => {
        try {
            const [deptRes, posRes] = await Promise.all([
                api.get('/org/departments'),
                api.get('/org/positions')
            ]);
            setDepartments(deptRes.data);
            setPositions(posRes.data);

            if (deptRes.data.length > 0 && !selectedDeptId) {
                setSelectedDeptId(deptRes.data[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddDept = async (e) => {
        e.preventDefault();
        try {
            await api.post('/org/departments', {
                name: newDeptName,
                parent_department_id: parentDeptId || null
            });
            setNewDeptName('');
            setParentDeptId('');
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteDept = async (id) => {
        if (!confirm(t('organization.confirm_delete_dept'))) return;
        try {
            await api.delete(`/org/departments/${id}`);
            fetchData();
        } catch (err) {
            alert(t('organization.failed_delete_dept'));
            console.error(err);
        }
    };

    const handleAddPos = async (e) => {
        e.preventDefault();
        try {
            await api.post('/org/positions', {
                title: newPosTitle,
                department_id: selectedDeptId
            });
            setNewPosTitle('');
            fetchData();
        } catch (err) {
            alert(t('organization.select_dept_first'));
            console.error(err);
        }
    };

    const handleDeletePos = async (id) => {
        if (!confirm(t('organization.confirm_delete_pos'))) return;
        try {
            await api.delete(`/org/positions/${id}`);
            fetchData();
        } catch (err) {
            alert(t('organization.failed_delete_pos'));
            console.error(err);
        }
    };

    // Helper to render tree
    const renderDepartmentTree = (parentId = null, level = 0) => {
        const items = departments.filter(d => d.parent_department_id === parentId);

        return items.map(dept => (
            <div key={dept.id}>
                <div className="group flex items-center justify-between p-3 rounded-lg border border-secondary-100 bg-secondary-50 hover:border-primary-200 transition-all mb-2" style={{ marginInlineStart: `${level * 24}px` }}>
                    <div className="flex items-center gap-2">
                        {level > 0 && <CornerDownRight className="w-4 h-4 text-secondary-400 rtl:flip-x" />}
                        <span className="font-medium text-secondary-800">{dept.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-secondary-400">ID: {dept.id}</span>
                        <button onClick={() => handleDeleteDept(dept.id)} className="text-secondary-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {renderDepartmentTree(dept.id, level + 1)}
            </div>
        ));
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">{t('organization.title')}</h1>
                    <p className="text-secondary-500">{t('organization.subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* --- Departments Column --- */}
                <Card className="h-full">
                    <div className="flex items-center gap-3 mb-6 border-b border-secondary-100 pb-4">
                        <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-semibold text-secondary-900">{t('organization.departments')}</h2>
                    </div>

                    {/* Add Dept Form */}
                    <form onSubmit={handleAddDept} className="flex flex-col gap-3 mb-6 bg-secondary-50 p-4 rounded-lg border border-secondary-100">
                        <div className="flex gap-2">
                            <Input
                                placeholder={t('organization.new_department')}
                                value={newDeptName}
                                onChange={(e) => setNewDeptName(e.target.value)}
                                required
                                className="bg-white"
                            />
                            <Button type="submit" size="sm" className="shrink-0">
                                <Plus className="w-4 h-4 rtl:ml-2 ltr:mr-2" /> {t('common.add')}
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 w-full">
                            <select
                                className="w-full h-10 rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none"
                                value={parentDeptId}
                                onChange={(e) => setParentDeptId(e.target.value)}
                            >
                                <option value="">{t('organization.no_parent')}</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </form>

                    {/* List (Tree View) */}
                    <div className="space-y-1">
                        {departments.length === 0 && <p className="text-center text-secondary-400 py-4">{t('organization.no_departments')}</p>}
                        {renderDepartmentTree(null)}
                    </div>
                </Card>

                {/* --- Job Positions Column --- */}
                <Card className="h-full">
                    <div className="flex items-center gap-3 mb-6 border-b border-secondary-100 pb-4">
                        <div className="p-2 bg-accent/10 rounded-lg text-accent">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-semibold text-secondary-900">{t('organization.job_positions')}</h2>
                    </div>

                    {/* Add Pos Form */}
                    <form onSubmit={handleAddPos} className="space-y-3 mb-6 bg-secondary-50 p-4 rounded-lg border border-secondary-100">
                        <div>
                            <label className="text-xs font-medium text-secondary-500 mb-1 block">{t('organization.departments')}</label>
                            <select
                                className="w-full h-10 rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none"
                                value={selectedDeptId}
                                onChange={(e) => setSelectedDeptId(e.target.value)}
                                required
                            >
                                <option value="" disabled>{t('organization.select_department')}</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder={t('organization.new_position')}
                                value={newPosTitle}
                                onChange={(e) => setNewPosTitle(e.target.value)}
                                required
                                className="bg-white"
                            />
                            <Button type="submit" size="sm" className="shrink-0 bg-accent hover:bg-accent-hover text-white">
                                <Plus className="w-4 h-4 rtl:ml-2 ltr:mr-2" /> {t('common.add')}
                            </Button>
                        </div>
                    </form>

                    {/* List */}
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {positions.length === 0 && <p className="text-center text-secondary-400 py-4">{t('organization.no_positions')}</p>}

                        {positions.map(pos => (
                            <div key={pos.id} className="group flex items-center justify-between p-3 rounded-lg border border-secondary-100 bg-white hover:shadow-sm transition-all">
                                <div>
                                    <p className="font-medium text-secondary-800">{pos.title}</p>
                                    <p className="text-xs text-secondary-500">{pos.department_name}</p>
                                </div>
                                <button onClick={() => handleDeletePos(pos.id)} className="text-secondary-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </Layout>
    );
};

export default OrganizationPage;
