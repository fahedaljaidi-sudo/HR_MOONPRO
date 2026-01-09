import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
    Layout,
    Plus,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Calendar,
    DollarSign,
    Briefcase,
    File,
    Pencil,
    Trash2,
    Eye
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

const RequestsPage = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('my-requests');
    const [myRequests, setMyRequests] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);
    const [viewingRequest, setViewingRequest] = useState(null);
    const [leaveBalance, setLeaveBalance] = useState(0);

    // Form State
    const [newRequest, setNewRequest] = useState({
        type: 'LEAVE',
        request_date: '',
        end_date: '',
        reason: '',
        amount: '',
        document_type: '', // For Official Letter
        entity_name: '', // For Official Letter
        file: null // For Attachment
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // ... fetch effects ...
    const fetchMyRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/requests/my/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyRequests(res.data);
        } catch (error) {
            console.error("Error fetching requests", error);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/requests/pending', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingRequests(res.data);
        } catch (error) {
            console.error("Error fetching pending requests", error);
        }
    };

    const fetchLeaveBalance = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/requests/balance/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeaveBalance(res.data.balance);
        } catch (error) {
            console.error("Error fetching balance", error);
        }
    };

    useEffect(() => {
        if (user.id) {
            fetchMyRequests();
            fetchPendingRequests();
            fetchLeaveBalance();
        }
    }, [user.id]);

    const handleEditClick = (req) => {
        setEditingRequest(req);

        // Parse details if it exists and is a string, or object
        let details = {};
        if (req.details) {
            details = typeof req.details === 'string' ? JSON.parse(req.details) : req.details;
        }

        setNewRequest({
            type: req.type,
            request_date: req.start_date ? req.start_date.split('T')[0] : '', // Format date for input
            end_date: req.end_date ? req.end_date.split('T')[0] : '',
            reason: req.reason || '',
            amount: req.amount || '',
            document_type: details.document_type || '',
            entity_name: details.entity_name || '',
            file: null // Do not pre-fill file input
        });
        setIsModalOpen(true);
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();

            // For Create: employee_id is required
            // For Update: usually immutable, but we can send it just in case or skip
            formData.append('employee_id', user.id);

            formData.append('type', newRequest.type);
            formData.append('start_date', newRequest.request_date); // Note: Backend expects start_date now
            if (newRequest.end_date) formData.append('end_date', newRequest.end_date);
            if (newRequest.reason) formData.append('reason', newRequest.reason);
            if (newRequest.amount) formData.append('amount', newRequest.amount);

            // Handle Details JSON
            const details = {};
            if (newRequest.type === 'DOCUMENT') {
                details.document_type = newRequest.document_type;
                details.entity_name = newRequest.entity_name;
            }
            formData.append('details', JSON.stringify(details));

            if (newRequest.file) {
                formData.append('file', newRequest.file);
            }

            const headers = {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            };

            if (editingRequest) {
                // UPDATE Mode
                await axios.put(`http://localhost:5000/api/requests/${editingRequest.id}`, formData, { headers });
            } else {
                // CREATE Mode
                await axios.post('http://localhost:5000/api/requests', formData, { headers });
            }

            // Reset and Close
            setIsModalOpen(false);
            setEditingRequest(null);
            setNewRequest({
                type: 'LEAVE',
                request_date: '',
                end_date: '',
                reason: '',
                amount: '',
                document_type: '',
                entity_name: '',
                file: null
            });
            fetchMyRequests();
        } catch (error) {
            console.error("Error submitting request", error);
            alert(t('requests.submit_error') || "Failed to submit request");
        } finally {
            setIsLoading(false);
        }
    };



    const handleCancelRequest = async (id) => {
        if (!window.confirm(t('requests.cancel_confirmation') || "Are you sure you want to cancel this request?")) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/requests/${id}/cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMyRequests();
        } catch (error) {
            console.error("Error cancelling request", error);
            alert("Failed to cancel request");
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/requests/${id}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchPendingRequests();
        } catch (error) {
            console.error(error);
            alert("Failed to update status");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700';
            case 'REJECTED': return 'bg-red-100 text-red-700';
            case 'PENDING': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'LEAVE': return <Calendar className="w-4 h-4" />;
            case 'SICK_LEAVE': return <Plus className="w-4 h-4" />;
            case 'LOAN': return <DollarSign className="w-4 h-4" />;
            case 'DOCUMENT': return <File className="w-4 h-4" />;
            case 'RESIGNATION': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    return (
        <div className="flex h-screen bg-secondary-50">
            <Sidebar />
            <div className="flex-1 flex flex-col ml-64 rtl:ml-0 rtl:mr-64 transition-all duration-300">
                <Header />
                <main className="flex-1 p-6 overflow-y-auto mt-16">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-secondary-900">{t('requests.title')}</h1>
                            <p className="text-secondary-500 text-sm mt-1">{t('requests.subtitle')}</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                                <div className="bg-blue-50 p-2 rounded-full text-blue-600">
                                    <Briefcase className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Annual Balance</p>
                                    <p className="text-lg font-bold text-gray-900 leading-none">{leaveBalance} Days</p>
                                </div>
                            </div>

                            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                                <Plus className="w-4 h-4" />
                                {t('requests.new_request')}
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-6 border-b border-secondary-200">
                        <button
                            onClick={() => setActiveTab('my-requests')}
                            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'my-requests'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-secondary-500 hover:text-secondary-700'
                                }`}
                        >
                            {t('requests.my_requests')}
                        </button>
                        <button
                            onClick={() => setActiveTab('approvals')}
                            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'approvals'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-secondary-500 hover:text-secondary-700'
                                }`}
                        >
                            {t('requests.pending_approvals')}
                        </button>
                    </div>

                    {/* Content */}
                    {activeTab === 'my-requests' ? (
                        <div className="grid gap-4">
                            {myRequests.map(req => (
                                <Card key={req.id} className="hover:shadow-md transition-shadow">
                                    <div className="p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                                                {getTypeIcon(req.type)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-secondary-900 flex items-center gap-2">
                                                    {t(`requests.types.${req.type}`)}
                                                </h3>
                                                <p className="text-sm text-secondary-500">
                                                    {req.request_date && !isNaN(new Date(req.request_date)) ? new Date(req.request_date).toLocaleDateString() : 'N/A'}
                                                    {req.end_date && !isNaN(new Date(req.end_date)) && ` - ${new Date(req.end_date).toLocaleDateString()}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {req.amount && <span className="text-sm font-medium">{req.amount} SAR</span>}
                                            <Badge className={getStatusColor(req.status)} variant="secondary">
                                                {t(`requests.status.${req.status}`)}
                                            </Badge>
                                            {req.status === 'PENDING' && (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => { console.log('View Clicked', req); setViewingRequest(req); }}
                                                        className="p-1 hover:bg-blue-50 rounded-full text-blue-500 hover:text-blue-700 transition"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditClick(req)}
                                                        className="p-1 hover:bg-gray-100 rounded-full text-secondary-500 hover:text-secondary-700 transition"
                                                        title="Edit Request"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelRequest(req.id)}
                                                        className="p-1 hover:bg-red-50 rounded-full text-red-400 hover:text-red-600 transition"
                                                        title="Cancel Request"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                    {req.reason && <div className="px-4 pb-4 text-sm text-secondary-600 border-t border-gray-50 pt-2">{req.reason}</div>}
                                </Card>
                            ))}
                            {myRequests.length === 0 && <p className="text-center text-secondary-400 py-10">{t('requests.no_requests')}</p>}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {/* Approvals List */}
                            {pendingRequests.map(req => (
                                <Card key={req.id}>
                                    <div className="p-4 flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-secondary-200 flex items-center justify-center font-bold text-secondary-600">
                                                {req.first_name[0]}{req.last_name[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-secondary-900">{req.first_name} {req.last_name}</h3>
                                                <p className="text-xs text-secondary-500">{req.job_title} • {req.department_name}</p>
                                                <div className="mt-2 text-sm bg-gray-50 p-2 rounded border border-gray-100">
                                                    <span className="font-medium flex mb-1 items-center gap-2">
                                                        {getTypeIcon(req.type)} {t(`requests.types.${req.type}`)}
                                                        {req.amount && ` (${req.amount} SAR)`}
                                                    </span>
                                                    <p className="text-gray-600">{req.reason}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{t('requests.requested_for')}: {req.request_date && !isNaN(new Date(req.request_date)) ? new Date(req.request_date).toLocaleDateString() : 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                                            >
                                                {t('requests.reject')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                                            >
                                                {t('requests.approve')}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {pendingRequests.length === 0 && <p className="text-center text-secondary-400 py-10">{t('requests.no_approvals')}</p>}
                        </div>
                    )}

                    {/* New Request Modal */}
                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <Card className="w-full max-w-lg">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle>{editingRequest ? 'Edit Request' : t('requests.new_request')}</CardTitle>
                                    <button onClick={() => { setIsModalOpen(false); setEditingRequest(null); }} className="text-gray-500 hover:text-gray-700">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateRequest} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>{t('requests.form.type')}</Label>
                                            <Select
                                                value={newRequest.type}
                                                onValueChange={(val) => setNewRequest({ ...newRequest, type: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('requests.form.select_type')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="LEAVE">{t('requests.types.LEAVE')}</SelectItem>
                                                    <SelectItem value="SICK_LEAVE">{t('requests.types.SICK_LEAVE')}</SelectItem>
                                                    <SelectItem value="LOAN">{t('requests.types.LOAN')}</SelectItem>
                                                    <SelectItem value="DOCUMENT">{t('requests.types.DOCUMENT')}</SelectItem>
                                                    <SelectItem value="RESIGNATION">{t('requests.types.RESIGNATION')}</SelectItem>
                                                    <SelectItem value="NON_RENEWAL">{t('requests.types.NON_RENEWAL')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>{t('requests.form.start_date')}</Label>
                                                <Input
                                                    type="date"
                                                    value={newRequest.request_date}
                                                    onChange={e => setNewRequest({ ...newRequest, request_date: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            {(['LEAVE', 'SICK_LEAVE'].includes(newRequest.type)) && (
                                                <div className="space-y-2">
                                                    <Label>{t('requests.form.end_date')}</Label>
                                                    <Input
                                                        type="date"
                                                        value={newRequest.end_date}
                                                        onChange={e => setNewRequest({ ...newRequest, end_date: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {newRequest.type === 'LOAN' && (
                                            <div className="space-y-2">
                                                <Label>{t('requests.form.amount')}</Label>
                                                <Input
                                                    type="number"
                                                    value={newRequest.amount}
                                                    onChange={e => setNewRequest({ ...newRequest, amount: e.target.value })}
                                                    placeholder="e.g. 5000"
                                                />
                                            </div>
                                        )}

                                        {newRequest.type === 'DOCUMENT' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>{t('requests.form.doc_subject') || 'Subject'}</Label>
                                                    <Input
                                                        value={newRequest.document_type}
                                                        onChange={e => setNewRequest({ ...newRequest, document_type: e.target.value })}
                                                        placeholder={t('requests.form.doc_subject_ph') || "e.g. Salary Certificate"}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>{t('requests.form.entity_name') || 'Entity Name'}</Label>
                                                    <Input
                                                        value={newRequest.entity_name}
                                                        onChange={e => setNewRequest({ ...newRequest, entity_name: e.target.value })}
                                                        placeholder={t('requests.form.entity_name_ph') || "e.g. Al Rajhi Bank"}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* File Upload Field */}
                                        {newRequest.type === 'SICK_LEAVE' && (
                                            <div className="space-y-2">
                                                <Label>
                                                    {t('requests.form.attachment') || 'Attachment'}
                                                    <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    type="file"
                                                    accept=".pdf,.png,.jpg,.jpeg"
                                                    onChange={e => setNewRequest({ ...newRequest, file: e.target.files[0] })}
                                                    required
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label>{t('requests.form.reason')}</Label>
                                            <Textarea
                                                value={newRequest.reason}
                                                onChange={e => setNewRequest({ ...newRequest, reason: e.target.value })}
                                                placeholder={t('requests.form.placeholder')}
                                                rows={3}
                                            />
                                        </div>

                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading ? t('requests.form.submitting') : (editingRequest ? 'Update Request' : t('requests.form.submit'))}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    )} {/* End isModalOpen */}



                    {/* View Details Modal - Moved to ensure visibility */}
                    {viewingRequest && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <Card className="w-full max-w-lg">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gray-50/50 rounded-t-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-white rounded-md border border-gray-100 shadow-sm">
                                            {getTypeIcon(viewingRequest.type)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{t(`requests.types.${viewingRequest.type}`)}</CardTitle>
                                            <Badge className={`mt-1 ${getStatusColor(viewingRequest.status)}`}>{t(`requests.status.${viewingRequest.status}`)}</Badge>
                                        </div>
                                    </div>
                                    <button onClick={() => setViewingRequest(null)} className="text-gray-500 hover:text-gray-700">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">

                                    {/* Dates & Financials */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-gray-500 text-xs uppercase tracking-wide">Start Date</Label>
                                            <div className="font-medium flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {viewingRequest.start_date ? new Date(viewingRequest.start_date).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </div>
                                        {viewingRequest.end_date && (
                                            <div className="space-y-1">
                                                <Label className="text-gray-500 text-xs uppercase tracking-wide">End Date</Label>
                                                <div className="font-medium flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {new Date(viewingRequest.end_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        )}
                                        {viewingRequest.amount && (
                                            <div className="space-y-1">
                                                <Label className="text-gray-500 text-xs uppercase tracking-wide">Amount</Label>
                                                <div className="font-medium text-green-700">{viewingRequest.amount} SAR</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dynamic Details (JSON) */}
                                    {(() => {
                                        try {
                                            const details = typeof viewingRequest.details === 'string'
                                                ? JSON.parse(viewingRequest.details)
                                                : viewingRequest.details;

                                            if (!details || Object.keys(details).length === 0) return null;

                                            return (
                                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                                                    {details.document_type && (
                                                        <div>
                                                            <span className="text-gray-500 text-xs block">Document Subject</span>
                                                            <span className="font-medium">{details.document_type}</span>
                                                        </div>
                                                    )}
                                                    {details.entity_name && (
                                                        <div>
                                                            <span className="text-gray-500 text-xs block">Entity Name</span>
                                                            <span className="font-medium">{details.entity_name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        } catch (e) { return null; }
                                    })()}

                                    {/* Reason */}
                                    {viewingRequest.reason && (
                                        <div className="space-y-1">
                                            <Label className="text-gray-500 text-xs uppercase tracking-wide">Reason</Label>
                                            <p className="text-sm bg-gray-50 p-3 rounded-md text-gray-700 leading-relaxed border border-gray-100">
                                                {viewingRequest.reason}
                                            </p>
                                        </div>
                                    )}

                                    {/* Attachment */}
                                    {viewingRequest.attachment_url && (
                                        <div className="pt-2">
                                            <Label className="text-gray-500 text-xs uppercase tracking-wide mb-2 block">Attachment</Label>
                                            <a
                                                href={`http://localhost:5000${viewingRequest.attachment_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 border border-blue-100 bg-blue-50/50 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors group"
                                            >
                                                <div className="p-2 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">View Attached Document</div>
                                                    <div className="text-xs text-blue-400">Click to open</div>
                                                </div>
                                            </a>
                                        </div>
                                    )}

                                    {/* Manager Feedback */}
                                    {(viewingRequest.rejection_reason || viewingRequest.manager_comment) && (
                                        <div className={`p-4 rounded-lg border ${viewingRequest.status === 'REJECTED' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                            <Label className={`text-xs uppercase tracking-wide block mb-1 ${viewingRequest.status === 'REJECTED' ? 'text-red-500' : 'text-green-600'}`}>
                                                Manager Feedback
                                            </Label>
                                            <p className="text-sm font-medium">
                                                {viewingRequest.rejection_reason || viewingRequest.manager_comment}
                                            </p>
                                        </div>
                                    )}

                                </CardContent>
                            </Card>
                        </div>
                    )}

                </main>
            </div >
        </div >
    );
};

export default RequestsPage;
