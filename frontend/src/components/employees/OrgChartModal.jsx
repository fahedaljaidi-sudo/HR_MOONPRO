import { X, Edit2, Check, Save } from 'lucide-react';
import { Card } from '../ui/Card';
import { useState } from 'react';
import axios from 'axios';

const OrgChartModal = ({ isOpen, onClose, employees, onRefresh }) => {
    if (!isOpen) return null;

    const [isEditMode, setIsEditMode] = useState(false);
    const [editingNode, setEditingNode] = useState(null);
    const [targetManagerId, setTargetManagerId] = useState('');
    const [loading, setLoading] = useState(false);

    // Filter employees for dropdown (exclude self)
    const potentialManagers = employees.filter(e => editingNode && e.id !== editingNode.id);

    // Build Tree Logic
    const buildTree = (emps) => {
        const map = {};
        const roots = [];
        // Sort for consistency
        const sortedEmps = [...emps].sort((a, b) => a.first_name.localeCompare(b.first_name));

        sortedEmps.forEach(emp => {
            map[emp.id] = { ...emp, children: [] };
        });

        sortedEmps.forEach(emp => {
            if (emp.manager_id && map[emp.manager_id]) {
                map[emp.manager_id].children.push(map[emp.id]);
            } else {
                roots.push(map[emp.id]);
            }
        });
        return roots;
    };

    const treeData = buildTree(employees);

    const handleSaveManager = async () => {
        if (!editingNode) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                manager_id: targetManagerId || ''
            };

            await axios.put(`http://localhost:5000/api/employees/${editingNode.id}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (onRefresh) onRefresh();
            setEditingNode(null);
            setTargetManagerId('');
        } catch (e) {
            console.error(e);
            alert("Failed to update manager");
        } finally {
            setLoading(false);
        }
    };

    // Recursive Node Component with Connectors
    const TreeNode = ({ node }) => {
        const hasChildren = node.children && node.children.length > 0;
        const isEditing = editingNode?.id === node.id;

        return (
            <div className="flex flex-col items-center">
                {/* Node Card */}
                <div
                    className={`
                        relative w-48 bg-white rounded-xl shadow-sm border transition-all duration-200 z-10 flex flex-col items-center p-3
                        ${isEditMode ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : ''}
                        ${isEditing ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-200 hover:border-primary-200'}
                    `}
                    onClick={() => {
                        if (isEditMode) {
                            setEditingNode(node);
                            setTargetManagerId(node.manager_id || '');
                        }
                    }}
                >
                    {/* Edit mode indicator */}
                    {isEditMode && (
                        <div className="absolute top-2 right-2 text-primary-400">
                            <Edit2 className="w-3 h-3" />
                        </div>
                    )}

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-primary-700 font-bold text-lg mb-2 shadow-inner">
                        {node.first_name[0]}{node.last_name[0]}
                    </div>

                    {/* Info */}
                    <div className="text-center w-full">
                        <h3 className="font-bold text-gray-800 text-sm truncate px-2">{node.first_name} {node.last_name}</h3>
                        <p className="text-xs text-primary-600 font-medium truncate px-2">{node.job_title || 'No Title'}</p>
                    </div>

                    {/* Line Down from Card (if children exist) */}
                    {hasChildren && (
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-px h-6 bg-gray-300"></div>
                    )}
                </div>

                {/* Children Container */}
                {hasChildren && (
                    <div className="flex pt-6 relative">
                        {node.children.map((child, index) => {
                            const isFirst = index === 0;
                            const isLast = index === node.children.length - 1;
                            const isSole = node.children.length === 1;

                            return (
                                <div key={child.id} className="flex flex-col items-center relative px-4">
                                    {/* Lines Logic */}

                                    {/* 1. Vertical Line UP to Parent's level */}
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-px h-6 bg-gray-300"></div>

                                    {/* 2. Horizontal Connector Line (Bar) */}
                                    {!isSole && (
                                        <>
                                            {/* Line from Center to Next Sibling (Right in LTR, Left in RTL) */}
                                            {!isLast && <div className="absolute -top-6 h-px bg-gray-300 ltr:left-1/2 ltr:right-0 rtl:left-0 rtl:right-1/2"></div>}
                                            {/* Line from Prev Sibling to Center (Left in LTR, Right in RTL) */}
                                            {!isFirst && <div className="absolute -top-6 h-px bg-gray-300 ltr:left-0 ltr:right-1/2 rtl:left-1/2 rtl:right-0"></div>}
                                        </>
                                    )}

                                    {/* Recursion */}
                                    <TreeNode node={child} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-[90vw] h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center px-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Organizational Structure</h2>
                        <p className="text-sm text-gray-500">Visual hierarchy of the company</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${isEditMode
                                ? 'bg-primary-600 text-white shadow-primary-200 ring-2 ring-primary-100'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {isEditMode ? <><Check className="w-4 h-4" /> Save Order</> : <><Edit2 className="w-4 h-4" /> Edit Structure</>}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="flex-1 overflow-auto p-12 cursor-grab active:cursor-grabbing bg-dot-pattern">
                    <div className="min-w-fit min-h-fit mx-auto flex justify-center pb-20">
                        {treeData.map(root => (
                            <TreeNode key={root.id} node={root} />
                        ))}
                        {treeData.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-20">
                                <p>No employees found in the default organization.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Modal */}
                {editingNode && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border-none ring-1 ring-black/5">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-900">Change Manager</h3>
                                        <p className="text-sm text-gray-500 mt-1">Select a new direct report for this employee</p>
                                    </div>
                                    <button onClick={() => setEditingNode(null)} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                            {editingNode.first_name[0]}{editingNode.last_name[0]}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">{editingNode.first_name} {editingNode.last_name}</div>
                                            <div className="text-xs text-gray-500">{editingNode.job_title || 'No Title'}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Manager</label>
                                        <select
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2.5 text-sm"
                                            value={targetManagerId}
                                            onChange={(e) => setTargetManagerId(e.target.value)}
                                        >
                                            <option value="">No Manager (Top Level)</option>
                                            <option disabled>──────────</option>
                                            {potentialManagers.map(m => (
                                                <option key={m.id} value={m.id}>{m.first_name} {m.last_name} - {m.job_title}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button onClick={() => setEditingNode(null)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveManager}
                                            disabled={loading}
                                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Change</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrgChartModal;
