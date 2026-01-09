import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { nationalities } from '../constants/nationalities';
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Building2, Shield, ArrowLeft, Trash2, FileText, UploadCloud, Download, Printer, Ban, FileSpreadsheet, Lock } from 'lucide-react';

const EmployeeProfilePage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showActionsMenu, setShowActionsMenu] = useState(false);

    // Metadata & Roles
    const [allJobPositions, setAllJobPositions] = useState([]);
    const [potentialManagers, setPotentialManagers] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null); // Added for ownership check

    // Fetch user role and ID
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserRole(payload.role || 'Employee');
                setCurrentUserId(payload.id); // Extract ID
            } catch (e) {
                console.error("Failed to decode token", e);
            }
        }
    }, []);

    // Helper: Check if can edit
    const canEdit = () => {
        const role = (currentUserRole || '').toLowerCase();
        if (['admin', 'manager', 'owner'].includes(role)) return true; // Admin can edit all
        if (currentUserId && employee && currentUserId === employee.id) return true; // Self can edit
        return false;
    };

    // ... (rest of component code)

    // In the return JSX, find the buttons section:
    /*
                    <div className="flex gap-2 relative">
                        {canEdit() && (
                            <Button variant="outline" onClick={handleEditClick}>{t('profile.edit_profile')}</Button>
                        )}
                        
                        {['admin', 'manager', 'owner'].includes((currentUserRole || '').toLowerCase()) && (
                             <Button variant="destructive" onClick={handleDeleteEmployee} className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}

                        <div className="relative">
    */


    // Edit State
    const [showEditModal, setShowEditModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobPositionId: '',
        managerId: '', // Added managerId
        dob: '',
        gender: '',
        nationality: '',
        address: '',
        nationalId: ''
    });

    const fetchEditMetadata = async () => {
        try {
            const token = localStorage.getItem('token');
            const [posRes, empRes] = await Promise.all([
                axios.get('http://localhost:5000/api/organization/positions', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/employees', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setAllJobPositions(posRes.data);
            setPotentialManagers(empRes.data.filter(e => e.id !== parseInt(id))); // Exclude self
        } catch (error) {
            console.error("Failed to fetch edit metadata", error);
        }
    };

    const handleEditClick = () => {
        if (!employee) return;
        fetchEditMetadata();
        setEditForm({
            firstName: employee.first_name,
            lastName: employee.last_name,
            email: employee.email,
            phone: employee.phone || '',
            jobPositionId: employee.job_position_id || '',
            managerId: employee.manager_id || '',
            dob: employee.dob ? employee.dob.split('T')[0] : '',
            gender: employee.gender || 'Male',
            nationality: employee.nationality || '',
            address: employee.address || '',
            nationalId: employee.national_id || ''
        });
        setShowEditModal(true);
    };

    const handleDeleteEmployee = async () => {
        if (window.confirm(t('profile.action_menu.confirm_delete'))) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/employees/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert(t('profile.action_menu.deleted_success'));
                navigate('/employees');
            } catch (error) {
                console.error("Delete failed", error);
                alert(t('profile.action_menu.failed_delete'));
            }
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');

            // Sanitize payload: valid SQL requires NULL for empty optional fields, not empty strings
            const payload = {
                ...editForm,
                jobPositionId: editForm.jobPositionId || null,
                manager_id: editForm.managerId || null,
                phone: editForm.phone || null,
                dob: editForm.dob || null,
                gender: editForm.gender || null,
                nationality: editForm.nationality || null,
                address: editForm.address || null,
                nationalId: editForm.nationalId || null
            };

            await axios.put(`http://localhost:5000/api/employees/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowEditModal(false);
            // Refresh Data
            const res = await axios.get(`http://localhost:5000/api/employees/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployee(res.data);
            alert(t('profile.action_menu.update_success') || 'Updated successfully');
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to update profile';
            const detail = error.response?.data?.error || '';
            // alert(`Debug: ${JSON.stringify(error.response)}\n${msg}\n${detail}`);
            alert(`${msg}\n${detail}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Roles Logic State
    const [roles, setRoles] = useState([]);
    const [assignedRoleIds, setAssignedRoleIds] = useState([]);

    // Fetch Employee Data
    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:5000/api/employees/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEmployee(res.data);
            } catch (error) {
                console.error("Failed to fetch employee", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployee();
    }, [id]);

    // Fetch Roles Data
    useEffect(() => {
        const fetchRolesData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [allRolesRes, assignedRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/roles', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`http://localhost:5000/api/roles/employee/${id}`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setRoles(allRolesRes.data);
                setAssignedRoleIds(assignedRes.data.map(r => r.id));
            } catch (error) {
                console.error("Failed to fetch roles", error);
            }
        };
        if (id) fetchRolesData();
    }, [id]);

    const toggleRole = async (roleId) => {
        const token = localStorage.getItem('token');
        const isAssigned = assignedRoleIds.includes(roleId);
        try {
            if (isAssigned) {
                await axios.post('http://localhost:5000/api/roles/remove', { employeeId: id, roleId }, { headers: { Authorization: `Bearer ${token}` } });
                setAssignedRoleIds(prev => prev.filter(r => r !== roleId));
            } else {
                await axios.post('http://localhost:5000/api/roles/assign', { employeeId: id, roleId }, { headers: { Authorization: `Bearer ${token}` } });
                setAssignedRoleIds(prev => [...prev, roleId]);
            }
        } catch (error) {
            alert('Failed to update role');
        }
    };

    // Documents Logic
    const [documents, setDocuments] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        type: 'CONTRACT',
        number: '',
        startDate: '',
        endDate: '',
        file: null
    });
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (activeTab === 'documents' && id) {
            const fetchDocs = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`http://localhost:5000/api/documents/employee/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setDocuments(res.data);
                } catch (error) {
                    console.error("Failed to fetch documents", error);
                }
            };
            fetchDocs();
        }
    }, [activeTab, id]);

    const handleDocumentSubmit = async (e) => {
        e.preventDefault();
        if (!uploadForm.file) {
            alert('Please select a file');
            return;
        }

        const formData = new FormData();
        formData.append('employee_id', id);
        formData.append('document_type', uploadForm.type);
        formData.append('document_number', uploadForm.number);
        formData.append('start_date', uploadForm.startDate);
        formData.append('end_date', uploadForm.endDate);
        formData.append('file', uploadForm.file);

        setIsUploading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/documents/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowUploadModal(false);
            setUploadForm({ type: 'CONTRACT', number: '', startDate: '', endDate: '', file: null });

            // Refresh
            const res = await axios.get(`http://localhost:5000/api/documents/employee/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDocuments(res.data);
            alert(t('profile.action_menu.update_success') || 'Document uploaded successfully');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to upload document');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (!window.confirm(t('profile.documents.confirm_delete'))) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/documents/${docId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDocuments(prev => prev.filter(d => d.id !== docId));
        } catch (error) {
            alert('Failed to delete document');
        }
    };

    // --- Actions Handlers ---
    const handlePrint = () => {
        window.print();
        setShowActionsMenu(false);
    };

    const handleSendEmail = () => {
        if (employee.email) {
            window.location.href = `mailto:${employee.email}`;
        }
        setShowActionsMenu(false);
    };

    const handleExportCSV = () => {
        // Simple CSV generation
        const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Job Title', 'Department', 'Status'];
        const data = [
            employee.first_name,
            employee.last_name,
            employee.email,
            employee.phone,
            employee.job_title,
            employee.department_name,
            employee.is_active ? 'Active' : 'Inactive'
        ];

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + data.join(",");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${employee.first_name}_${employee.last_name}_profile.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowActionsMenu(false);
    };

    const handleToggleStatus = async () => {
        const newStatus = !employee.is_active;
        const confirmMsg = newStatus
            ? t('profile.action_menu.activate') + '?'
            : t('profile.action_menu.suspend') + '?';

        if (window.confirm(confirmMsg)) {
            try {
                const token = localStorage.getItem('token');
                await axios.put(`http://localhost:5000/api/employees/${id}`, {
                    is_active: newStatus
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEmployee(prev => ({ ...prev, is_active: newStatus }));
                alert(t('profile.action_menu.status_updated'));
            } catch (error) {
                console.error("Status update failed", error);
                alert('Failed to update status');
            }
        }
        setShowActionsMenu(false);
    };

    // Fetch Salary Data
    const [salary, setSalary] = useState(null);
    useEffect(() => {
        if (id) {
            const fetchSalary = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`http://localhost:5000/api/salaries/employee/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setSalary(res.data);
                } catch (error) {
                    console.error("Failed to fetch salary", error);
                }
            };
            fetchSalary();
        }
    }, [id]);

    // Helper for date formatting
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toISOString().split('T')[0];
    };

    if (loading) return <Layout><div>{t('dashboard.loading')}</div></Layout>;
    if (!employee) return <Layout><div>Employee not found</div></Layout>;

    const tabs = [
        { id: 'overview', label: t('profile.tabs.overview') },
        { id: 'personal', label: t('profile.tabs.personal') },
        { id: 'job', label: t('profile.tabs.job') },
        { id: 'roles', label: t('profile.tabs.roles') },
        { id: 'documents', label: t('profile.tabs.documents') },
    ];

    return (
        <Layout>
            <div className="print:hidden">
                <Button variant="ghost" className="mb-4" onClick={() => navigate('/employees')}>
                    <ArrowLeft className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" /> {t('profile.back_to_list')}
                </Button>

                {/* Header Profile Card */}
                <div className="bg-white border border-secondary-200 rounded-2xl p-8 mb-6 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-sm">
                    <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold border-4 border-white shadow-md">
                        {employee.first_name[0]}{employee.last_name[0]}
                    </div>
                    <div className="flex-1 text-center md:text-left rtl:md:text-right">
                        <h1 className="text-3xl font-bold text-secondary-900">{employee.first_name} {employee.last_name}</h1>
                        <p className="text-secondary-500 font-medium flex items-center justify-center md:justify-start rtl:md:justify-start gap-2 mt-1">
                            <Briefcase className="w-4 h-4" /> {employee.job_title || t('profile.no_title')}
                            <span className="text-secondary-300">•</span>
                            <Building2 className="w-4 h-4" /> {employee.department_name || t('profile.no_dept')}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start rtl:md:justify-start">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${employee.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {employee.is_active ? t('profile.active_employee') : t('profile.inactive')}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-100">
                                {employee.employee_id_code}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 relative">
                        {/* Edit Button - Only Owner or Admin */}
                        {((currentUserRole || '').toLowerCase() === 'admin' ||
                            (currentUserRole || '').toLowerCase() === 'manager' ||
                            (currentUserRole || '').toLowerCase() === 'owner' ||
                            (currentUserId && employee && currentUserId === employee.id)) && (
                                <Button variant="outline" onClick={handleEditClick}>{t('profile.edit_profile')}</Button>
                            )}

                        {/* Delete Button - Only Admin */}
                        {['admin', 'manager', 'owner'].includes((currentUserRole || '').toLowerCase()) && (
                            <Button variant="destructive" onClick={handleDeleteEmployee} className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}

                        <div className="relative">
                            <Button onClick={() => setShowActionsMenu(!showActionsMenu)}>
                                {t('profile.actions')}
                            </Button>

                            {showActionsMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-secondary-200 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
                                    <button onClick={handlePrint} className="w-full text-start px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center gap-2">
                                        <Printer className="w-4 h-4" /> {t('profile.action_menu.print')}
                                    </button>
                                    <button onClick={handleExportCSV} className="w-full text-start px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center gap-2">
                                        <FileSpreadsheet className="w-4 h-4" /> {t('profile.action_menu.export')}
                                    </button>
                                    <button onClick={handleSendEmail} className="w-full text-start px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center gap-2">
                                        <Mail className="w-4 h-4" /> {t('profile.action_menu.email')}
                                    </button>
                                    <div className="border-t border-secondary-100 my-1"></div>
                                    <button onClick={handleToggleStatus} className={`w-full text-start px-4 py-2 text-sm flex items-center gap-2 ${employee.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                                        {employee.is_active ? (
                                            <><Ban className="w-4 h-4" /> {t('profile.action_menu.suspend')}</>
                                        ) : (
                                            <><Lock className="w-4 h-4" /> {t('profile.action_menu.activate')}</>
                                        )}
                                    </button>
                                </div>
                            )}
                            {/* Overlay to close when clicking outside */}
                            {showActionsMenu && (
                                <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(false)}></div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-secondary-200 mb-6 space-x-6 rtl:space-x-reverse overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-secondary-500 hover:text-secondary-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column (Main Info) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* ... other tabs ... */}
                        {activeTab === 'overview' && (
                            <Card title={t('profile.contact_info.title')}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InfoItem icon={Mail} label={t('profile.contact_info.email')} value={employee.email} />
                                    <InfoItem icon={Phone} label={t('profile.contact_info.phone')} value={employee.phone || t('profile.employment.none')} />
                                    <InfoItem icon={MapPin} label={t('profile.contact_info.location')} value="Main HQ" />
                                    <InfoItem icon={Calendar} label={t('profile.contact_info.joining_date')} value={formatDate(employee.hire_date)} />
                                </div>
                            </Card>
                        )}

                        {activeTab === 'personal' && (
                            <Card title={t('profile.tabs.personal')}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InfoItem icon={Calendar} label={t('profile.contact_info.dob')} value={formatDate(employee.dob)} />
                                    <InfoItem icon={User} label={t('profile.contact_info.gender')} value={employee.gender || t('profile.employment.none')} />
                                    <InfoItem icon={Shield} label={t('profile.contact_info.national_id')} value={employee.national_id || t('profile.employment.none')} />
                                    <InfoItem icon={MapPin} label={t('profile.contact_info.nationality')} value={employee.nationality ? t(`countries.${employee.nationality}`) : t('profile.employment.none')} />
                                    <div className="md:col-span-2">
                                        <InfoItem icon={MapPin} label={t('profile.contact_info.address')} value={employee.address || t('profile.employment.none')} />
                                    </div>
                                </div>
                            </Card>
                        )}

                        {activeTab === 'job' && (
                            <Card title={t('profile.employment.title')}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InfoItem icon={Building2} label={t('profile.employment.department')} value={employee.department_name} />
                                    <InfoItem icon={Briefcase} label={t('profile.employment.job_title')} value={employee.job_title} />
                                    <InfoItem icon={User} label={t('profile.employment.manager')} value={employee.manager_first ? `${employee.manager_first} ${employee.manager_last}` : t('profile.employment.none')} />
                                    <InfoItem icon={Shield} label={t('profile.employment.system_role')} value="Employee" />
                                </div>
                            </Card>
                        )}

                        {activeTab === 'roles' && (
                            <Card title={t('profile.manage_roles.title')}>
                                <p className="text-secondary-500 text-sm mb-4">{t('profile.manage_roles.description')}</p>
                                <div className="space-y-3">
                                    {roles.length === 0 ? (
                                        <p className="text-sm text-secondary-400 italic">{t('profile.manage_roles.no_roles')}</p>
                                    ) : (
                                        roles.map(role => {
                                            const isAssigned = assignedRoleIds.includes(role.id);
                                            return (
                                                <div key={role.id} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${isAssigned ? 'border-primary-200 bg-primary-50' : 'border-secondary-100 hover:bg-secondary-50'}`}>
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-lg ${isAssigned ? 'bg-primary-100 text-primary-600' : 'bg-secondary-100 text-secondary-400'}`}>
                                                            <Shield className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className={`font-semibold ${isAssigned ? 'text-primary-900' : 'text-secondary-900'}`}>{role.name}</h4>
                                                            <p className="text-sm text-secondary-500">{role.description || 'No description'}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant={isAssigned ? "outline" : "default"}
                                                        onClick={() => toggleRole(role.id)}
                                                    >
                                                        {isAssigned ? 'Remove' : 'Assign'}
                                                    </Button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </Card>
                        )}

                        {activeTab === 'documents' && (
                            <Card title={t('profile.documents.title')}>
                                <div className="flex justify-between items-center mb-6">
                                    <p className="text-secondary-500 text-sm">{t('profile.documents.description')}</p>
                                    <div>
                                        <Button onClick={() => setShowUploadModal(true)} icon={UploadCloud}>
                                            {t('profile.documents.upload_btn')}
                                        </Button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left rtl:text-right">
                                        <thead className="text-xs text-secondary-500 uppercase bg-secondary-50">
                                            <tr>
                                                <th className="px-4 py-3">{t('profile.documents.name')}</th>
                                                <th className="px-4 py-3">{t('profile.documents.date')}</th>
                                                <th className="px-4 py-3">{t('profile.documents.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {documents.length === 0 ? (
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-8 text-center text-secondary-500 italic">
                                                        {t('profile.documents.no_docs')}
                                                    </td>
                                                </tr>
                                            ) : (
                                                documents.map(doc => (
                                                    <tr key={doc.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                                                        <td className="px-4 py-3 font-medium text-secondary-900 flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-primary-500" />
                                                            {doc.name}
                                                        </td>
                                                        <td className="px-4 py-3 text-secondary-500">
                                                            {new Date(doc.uploaded_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-3 flex gap-2">
                                                            <a
                                                                href={`http://localhost:5000${doc.file_path}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </a>
                                                            <button
                                                                onClick={() => handleDeleteDocument(doc.id)}
                                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right Column (Side Stats/Actions) */}
                    <div className="space-y-6">
                        <Card title={t('profile.stats.title')}>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-secondary-500">{t('profile.stats.leave_balance')}</span>
                                    <span className="font-bold text-secondary-900">21 {t('profile.stats.days')}</span>
                                </div>
                                <div className="w-full bg-secondary-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-primary-500 h-full w-3/4"></div>
                                </div>

                                <div className="border-t border-secondary-100 pt-4 flex justify-between items-center text-sm">
                                    <span className="text-secondary-500">{t('profile.stats.attendance_month')}</span>
                                    <span className="font-bold text-green-600">98%</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* DEDICATED PRINT VIEW - HIDDEN ON SCREEN */}
            <div className="hidden print:block space-y-8 p-4">
                {/* Print Header */}
                <div className="flex items-start gap-6 border-b border-gray-200 pb-6">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-3xl font-bold border-4 border-white">
                        {employee.first_name[0]}{employee.last_name[0]}
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mt-2">{employee.first_name} {employee.last_name}</h1>
                        <p className="text-xl text-gray-600 mt-1">{employee.job_title} - {employee.department_name}</p>
                        <p className="text-md text-gray-500 mt-1">ID: {employee.employee_id_code} | Joined: {formatDate(employee.hire_date)}</p>
                    </div>
                </div>

                {/* Print Content Grid */}
                <div className="grid grid-cols-1 gap-8">
                    {/* Personal Details */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">{t('profile.tabs.personal')}</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <PrintItem label={t('profile.contact_info.email')} value={employee.email} />
                            <PrintItem label={t('profile.contact_info.phone')} value={employee.phone} />
                            <PrintItem label={t('profile.contact_info.dob')} value={formatDate(employee.dob)} />
                            <PrintItem label={t('profile.contact_info.gender')} value={employee.gender} />
                            <PrintItem label={t('profile.contact_info.national_id')} value={employee.national_id} />
                            <PrintItem label={t('profile.contact_info.nationality')} value={employee.nationality ? t(`countries.${employee.nationality}`) : '-'} />
                            <PrintItem label={t('profile.contact_info.address')} value={employee.address} fullWidth />
                        </div>
                    </div>

                    {/* Job Details */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">{t('profile.tabs.job')}</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <PrintItem label={t('profile.employment.department')} value={employee.department_name} />
                            <PrintItem label={t('profile.employment.job_title')} value={employee.job_title} />
                            <PrintItem label={t('profile.employment.manager')} value={employee.manager_first ? `${employee.manager_first} ${employee.manager_last}` : '-'} />
                            <PrintItem label={t('profile.employment.system_role')} value="Employee" />
                        </div>
                    </div>

                    {/* Salary Details */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">{t('sidebar.salaries')}</h2>
                        {salary && salary.base_salary ? (
                            <div className="grid grid-cols-2 gap-4">
                                <PrintItem label={t('salaries.table.base_salary')} value={`${salary.base_salary} ${salary.currency || 'SAR'}`} />
                                <PrintItem label={t('salaries.table.housing')} value={`${salary.housing_allowance} ${salary.currency || 'SAR'}`} />
                                <PrintItem label={t('salaries.table.transport')} value={`${salary.transport_allowance} ${salary.currency || 'SAR'}`} />
                                <PrintItem label={t('salaries.other_allowances')} value={`${salary.other_allowances} ${salary.currency || 'SAR'}`} />
                                <div className="col-span-2 pt-4 border-t mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold">{t('salaries.table.total')}</span>
                                        <span className="text-xl font-bold text-green-700">
                                            {(Number(salary.base_salary) + Number(salary.housing_allowance) + Number(salary.transport_allowance) + Number(salary.other_allowances)).toFixed(2)} {salary.currency || 'SAR'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No salary information available for this employee.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal (Hidden on Print) */}
            {
                showEditModal && (
                    <div className="print:hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in overflow-y-auto py-10">
                        <Card className="w-full max-w-2xl mx-4">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-secondary-900">{t('profile.edit_modal.title')}</h2>
                                <button onClick={() => setShowEditModal(false)} className="text-secondary-400 hover:text-secondary-600">
                                    <span className="sr-only">Close</span>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Restricted Fields: Job Title & Manager */}
                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100 pb-4 mb-2 bg-gray-50/50 rounded-lg p-3">
                                        <div className="col-span-2 mb-2 flex justify-between items-center">
                                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-primary-600" />
                                                {t('profile.edit_modal.admin_section')}
                                            </h3>
                                            {!['manager', 'admin', 'owner'].includes((currentUserRole || '').toLowerCase()) && (
                                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 flex items-center gap-1">
                                                    <Lock className="w-3 h-3" /> {t('profile.edit_modal.admin_only')}
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.employment.job_title')}</label>
                                            <select
                                                className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                value={editForm.jobPositionId}
                                                onChange={e => setEditForm({ ...editForm, jobPositionId: e.target.value })}
                                                disabled={!['manager', 'admin', 'owner'].includes((currentUserRole || '').toLowerCase())}
                                            >
                                                <option value="">{t('common.select')}</option>
                                                {allJobPositions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.employment.manager')}</label>
                                            <select
                                                className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                value={editForm.managerId}
                                                onChange={e => setEditForm({ ...editForm, managerId: e.target.value })}
                                                disabled={!['manager', 'admin', 'owner'].includes((currentUserRole || '').toLowerCase())}
                                            >
                                                <option value="">{t('organization.no_parent')}</option>
                                                {potentialManagers.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.edit_modal.first_name')}</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            value={editForm.firstName}
                                            onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.edit_modal.last_name')}</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            value={editForm.lastName}
                                            onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.edit_modal.email')}</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            value={editForm.email}
                                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.edit_modal.phone')}</label>
                                        <input
                                            type="tel"
                                            className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            value={editForm.phone}
                                            onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.contact_info.dob')}</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            value={editForm.dob}
                                            onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.contact_info.gender')}</label>
                                        <select
                                            className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            value={editForm.gender}
                                            onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.contact_info.national_id')}</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                            value={editForm.nationalId}
                                            onChange={e => setEditForm({ ...editForm, nationalId: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.contact_info.nationality')}</label>
                                        <select
                                            className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            value={editForm.nationality || ''}
                                            onChange={e => setEditForm({ ...editForm, nationality: e.target.value })}
                                            disabled={!['manager', 'admin', 'owner'].includes((currentUserRole || '').toLowerCase())}
                                        >
                                            <option value="">{t('common.select')}</option>
                                            {nationalities.map(n => (
                                                <option key={n} value={n}>{t(`countries.${n}`)}</option>
                                            ))}
                                        </select>
                                        {!['manager', 'admin', 'owner'].includes((currentUserRole || '').toLowerCase()) && (
                                            <p className="text-xs text-secondary-400 mt-1">{t('profile.edit_modal.cant_change_nationality')}</p>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.contact_info.address')}</label>
                                        <textarea
                                            className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all h-24 resize-none"
                                            value={editForm.address}
                                            onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 gap-3">
                                    <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)}>{t('profile.edit_modal.cancel')}</Button>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? t('profile.edit_modal.saving') : t('profile.edit_modal.save')}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )
            }

            {/* Upload Document Modal */}
            {showUploadModal && (
                <div className="print:hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in overflow-y-auto py-10">
                    <Card className="w-full max-w-lg mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-secondary-900">{t('profile.documents.upload_title') || 'Upload Document'}</h2>
                            <button onClick={() => setShowUploadModal(false)} className="text-secondary-400 hover:text-secondary-600">
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleDocumentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.documents.type')}</label>
                                <select
                                    className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    value={uploadForm.type}
                                    onChange={e => setUploadForm({ ...uploadForm, type: e.target.value })}
                                >
                                    <option value="CONTRACT">Contract</option>
                                    <option value="ID">National ID / Iqama</option>
                                    <option value="PASSPORT">Passport</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.documents.number')}</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    value={uploadForm.number}
                                    onChange={e => setUploadForm({ ...uploadForm, number: e.target.value })}
                                    placeholder="e.g. 1045..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.documents.start_date')}</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        value={uploadForm.startDate}
                                        onChange={e => setUploadForm({ ...uploadForm, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.documents.end_date')}</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        value={uploadForm.endDate}
                                        onChange={e => setUploadForm({ ...uploadForm, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">{t('profile.documents.file')}</label>
                                <input
                                    type="file"
                                    required
                                    className="w-full px-3 py-2 bg-white border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    onChange={e => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                                />
                            </div>

                            <div className="flex justify-end pt-4 gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowUploadModal(false)}>{t('profile.edit_modal.cancel')}</Button>
                                <Button type="submit" disabled={isUploading}>
                                    {isUploading ? t('profile.documents.uploading') : t('profile.documents.upload_confirm')}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </Layout >
    );
};

// Helper Component (Moved up for cleanliness or keep down)
const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        <div className="p-2 bg-secondary-50 rounded-lg text-secondary-500">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-xs text-secondary-400 font-medium mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-secondary-900">{value || '-'}</p>
        </div>
    </div>
);

// Simple Print Item Helper
const PrintItem = ({ label, value, fullWidth }) => (
    <div className={`flex flex-col ${fullWidth ? 'col-span-2' : ''}`}>
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <span className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-1">{value || '-'}</span>
    </div>
);

export default EmployeeProfilePage;
