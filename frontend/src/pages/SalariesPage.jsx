import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DollarSign, Edit2, TrendingUp, Users, Download, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SalariesPage = () => {
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState('salaries');
    const [employees, setEmployees] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPayrollModal, setShowPayrollModal] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [salaryForm, setSalaryForm] = useState({
        baseSalary: 0,
        housingAllowance: 0,
        transportAllowance: 0,
        otherAllowances: 0,
        deductions: 0
    });

    const [processing, setProcessing] = useState(false);
    const [payrollStep, setPayrollStep] = useState('initial');
    const [previewData, setPreviewData] = useState(null);
    const [payrollMonth, setPayrollMonth] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

    // Native Browser Print - Bypasses React Ref issues
    const handleNativePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print');
            return;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html dir="${i18n.language === 'ar' ? 'rtl' : 'ltr'}">
            <head>
                <title>Payroll Sheet ${payrollMonth.month}/${payrollMonth.year}</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; direction: ${i18n.language === 'ar' ? 'rtl' : 'ltr'}; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: center; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .text-right { text-align: ${i18n.language === 'ar' ? 'left' : 'right'}; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .footer { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 50px; direction: ltr; }
                    .signature { text-align: center; }
                    .line { border-top: 1px solid #000; width: 150px; margin-top: 40px; }
                    @media print {
                        @page { size: landscape; margin: 0.5cm; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${t('salaries.sheet_title')}</h1>
                    <p>${t('salaries.table.period')}: ${payrollMonth.month}/${payrollMonth.year}</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>${t('salaries.table.employee')}</th>
                            <th>${t('salaries.working_days')}</th>
                            <th>${t('salaries.table.base_salary')}</th>
                            <th>${t('salaries.allowances')}</th>
                            <th>${t('salaries.deductions')}</th>
                            <th>${t('salaries.net_salary')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${previewData.preview.map(emp => `
                            <tr>
                                <td style="text-align: right;">
                                    <b>${emp.first_name} ${emp.last_name}</b><br/>
                                    <small>${emp.employee_id_code}</small>
                                </td>
                                <td>${emp.workingDays}</td>
                                <td>${Number(emp.base_salary).toLocaleString()}</td>
                                <td>${Number(emp.manualAllowances).toLocaleString()}</td>
                                <td>${Number(emp.manualDeductions + emp.absenceDeduction).toLocaleString()}</td>
                                <td><b>${Number(emp.netSalary).toLocaleString()}</b></td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #f9f9f9;">
                            <td colspan="5" style="text-align:center; font-weight:bold;">${t('salaries.table.total')}</td>
                            <td><b>${previewData.preview.reduce((sum, e) => sum + e.netSalary, 0).toLocaleString()} SAR</b></td>
                        </tr>
                    </tfoot>
                </table>

                <div class="footer">
                    <div class="signature">
                        <p>${t('salaries.signatures.hr')}</p>
                        <div class="line"></div>
                    </div>
                    <div class="signature">
                        <p>${t('salaries.signatures.finance')}</p>
                        <div class="line"></div>
                    </div>
                    <div class="signature">
                        <p>${t('salaries.signatures.general')}</p>
                        <div class="line"></div>
                    </div>
                </div>

                <script>
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 500);
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const fetchSalaries = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/salaries', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployees(res.data);
        } catch (error) {
            console.error("Failed to fetch salaries", error);
            const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
            alert(`API Error: ${errorMsg}`);
        }
    };

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/payroll/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const handlePreviewPayroll = async () => {
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/payroll/preview', payrollMonth, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Ensure numbers for calculation
            const formatted = res.data.preview.map(emp => ({
                ...emp,
                manualAllowances: emp.totalAllowances,
                manualDeductions: emp.fixedDeductions
            }));
            setPreviewData({ ...res.data, preview: formatted });
            setPayrollStep('review');
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to preview';
            alert(errorMsg);
        } finally {
            setProcessing(false);
        }
    };

    const handlePayrollChange = (employeeId, field, value) => {
        const updatedPreview = { ...previewData };
        updatedPreview.preview = updatedPreview.preview.map(emp => {
            if (emp.id === employeeId) {
                const updatedEmp = { ...emp, [field]: Number(value) };

                // Recalculate
                const days = Number(updatedEmp.workingDays);
                const absentDays = Math.max(0, days - updatedEmp.attendedDays);
                const absenceDeduction = Math.round(absentDays * updatedEmp.dailyRate);

                // Use manual overrides if field is touched, otherwise fallback would be messy, so we track manual fields
                const totalDeductions = updatedEmp.manualDeductions + absenceDeduction;
                const netSalary = (updatedEmp.base_salary + updatedEmp.manualAllowances) - totalDeductions;

                return { ...updatedEmp, absenceDeduction, netSalary, totalDeductions, totalAllowances: updatedEmp.manualAllowances };
            }
            return emp;
        });
        setPreviewData(updatedPreview);
    };

    const confirmPayroll = async () => {
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/payroll/confirm', {
                month: payrollMonth.month,
                year: payrollMonth.year,
                employees: previewData.preview
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Payroll Confirmed! Paid ${res.data.stats.employees} employees.`);
            setShowPayrollModal(false);
            setPayrollStep('initial');
            fetchHistory();
        } catch (error) {
            alert('Failed to confirm payroll');
        } finally {
            setProcessing(false);
        }
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(previewData.preview.map(emp => ({
            'Name': `${emp.first_name} ${emp.last_name}`,
            'Attended Days': emp.attendedDays,
            'Working Days': emp.workingDays,
            'Base Salary': emp.base_salary,
            'Total Allowances': emp.manualAllowances,
            'Absence Deduction': emp.absenceDeduction,
            'Fixed Deductions': emp.manualDeductions,
            'Net Salary': emp.netSalary
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");
        XLSX.writeFile(workbook, `Payroll_${payrollMonth.month}_${payrollMonth.year}.xlsx`);
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchSalaries(), fetchHistory()]).finally(() => setLoading(false));
    }, []);

    const handleEditClick = (emp) => {
        setSelectedEmployee(emp);
        setSalaryForm({
            baseSalary: Number(emp.base_salary) || 0,
            housingAllowance: Number(emp.housing_allowance) || 0,
            transportAllowance: Number(emp.transport_allowance) || 0,
            otherAllowances: Number(emp.other_allowances) || 0,
            deductions: Number(emp.deductions) || 0
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/salaries/update', {
                employeeId: selectedEmployee.id,
                ...salaryForm
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            fetchSalaries();
        } catch (error) {
            alert('Failed to update salary');
        }
    };

    const calculateTotal = (emp) => {
        const base = Number(emp.base_salary) || 0;
        const housing = Number(emp.housing_allowance) || 0;
        const transport = Number(emp.transport_allowance) || 0;
        const other = Number(emp.other_allowances) || 0;
        const deductions = Number(emp.deductions) || 0;
        return (base + housing + transport + other) - deductions;
    }

    if (loading) return <Layout><div>{t('dashboard.loading')}</div></Layout>;

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">{t('salaries.title')}</h1>
                    <p className="text-secondary-500">{t('salaries.subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant={activeTab === 'salaries' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('salaries')}
                    >
                        {t('sidebar.salaries')}
                    </Button>
                    <Button
                        variant={activeTab === 'history' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('history')}
                    >
                        {t('salaries.history')}
                    </Button>
                    <Button variant="outline" icon={TrendingUp} onClick={() => {
                        setPayrollStep('initial');
                        setShowPayrollModal(true);
                    }}>
                        {t('salaries.run_payroll')}
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-secondary-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-secondary-500 text-sm font-medium">{t('salaries.total_monthly')}</p>
                            <h3 className="text-2xl font-bold text-secondary-900 mt-2">
                                {employees.reduce((sum, emp) => sum + calculateTotal(emp), 0).toLocaleString()} SAR
                            </h3>
                        </div>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-secondary-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-secondary-500 text-sm font-medium">{t('salaries.employees_on_payroll')}</p>
                            <h3 className="text-2xl font-bold text-secondary-900 mt-2">{employees.length}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {activeTab === 'salaries' && (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary-50 border-b border-secondary-200">
                                <tr>
                                    <th className="text-left rtl:text-right py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">{t('salaries.table.employee')}</th>
                                    <th className="text-right rtl:text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">{t('salaries.table.base_salary')}</th>
                                    <th className="text-right rtl:text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">{t('salaries.table.housing')}</th>
                                    <th className="text-right rtl:text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">{t('salaries.table.transport')}</th>
                                    <th className="text-right rtl:text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">{t('salaries.table.total')}</th>
                                    <th className="text-right rtl:text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">{t('salaries.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {employees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-secondary-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                                                    {emp.first_name[0]}{emp.last_name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-secondary-900">{emp.first_name} {emp.last_name}</p>
                                                    <p className="text-xs text-secondary-500">{emp.employee_id_code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right rtl:text-left text-sm text-secondary-600">
                                            {Number(emp.base_salary || 0).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right rtl:text-left text-sm text-secondary-600">
                                            {Number(emp.housing_allowance || 0).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right rtl:text-left text-sm text-secondary-600">
                                            {Number(emp.transport_allowance || 0).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right rtl:text-left text-sm font-bold text-secondary-900">
                                            {calculateTotal(emp).toLocaleString()} SAR
                                        </td>
                                        <td className="py-3 px-4 text-right rtl:text-left">
                                            <button
                                                onClick={() => handleEditClick(emp)}
                                                className="p-1 hover:bg-secondary-200 rounded text-secondary-500 hover:text-primary-600 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === 'history' && (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary-50 border-b border-secondary-200">
                                <tr>
                                    <th className="text-left rtl:text-right py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">{t('salaries.table.period')}</th>
                                    <th className="text-left rtl:text-right py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">{t('salaries.table.payment_date')}</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">{t('salaries.table.employees_paid')}</th>
                                    <th className="text-right rtl:text-left py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">{t('salaries.table.total_amount')}</th>
                                    <th className="text-center py-3 px-4 text-xs font-semibold text-secondary-500 uppercase">{t('salaries.table.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-secondary-500">{t('attendance.no_history')}</td>
                                    </tr>
                                ) : (
                                    history.map((record, idx) => (
                                        <tr key={idx} className="hover:bg-secondary-50 transition-colors">
                                            <td className="py-3 px-4 text-sm font-medium text-secondary-900">
                                                {record.pay_period_month}/{record.pay_period_year}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-secondary-600">
                                                {new Date(record.last_payment_date).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-secondary-600">
                                                {record.employee_count}
                                            </td>
                                            <td className="py-3 px-4 text-right rtl:text-left text-sm font-bold text-secondary-900">
                                                {Number(record.total_paid).toLocaleString()} SAR
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {t('salaries.paid')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Run Payroll Modal - Full Workflow */}
            {showPayrollModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in overflow-y-auto py-10">
                    <Card className={`mx-4 p-6 transition-all duration-300 my-auto ${payrollStep === 'review' ? 'w-full max-w-6xl' : 'w-full max-w-md'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-secondary-900">{t('salaries.confirm_payroll')}</h2>
                            <button onClick={() => setShowPayrollModal(false)} className="text-secondary-400 hover:text-secondary-600">✕</button>
                        </div>

                        {payrollStep === 'initial' && (
                            <div className="space-y-4">
                                <p className="text-secondary-600">
                                    {t('salaries.confirm_msg', { date: `${payrollMonth.month}/${payrollMonth.year}` })}
                                </p>
                                <div className="flex justify-end gap-3 mt-6">
                                    <Button variant="ghost" onClick={() => setShowPayrollModal(false)}>{t('common.cancel')}</Button>
                                    <Button onClick={handlePreviewPayroll} disabled={processing}>
                                        {processing ? t('salaries.processing') : t('salaries.preview_payroll')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {payrollStep === 'review' && previewData && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-semibold">{t('salaries.review_edit')}</h3>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" icon={Printer} onClick={() => setShowPrintPreview(true)}>{t('salaries.print_preview')}</Button>
                                        <Button variant="outline" size="sm" icon={Download} onClick={exportToExcel}>{t('salaries.excel')}</Button>
                                    </div>
                                </div>

                                <div className="max-h-[60vh] overflow-y-auto border border-secondary-200 rounded-lg">
                                    <div className="max-h-[60vh] overflow-y-auto border border-secondary-200 rounded-lg">
                                        <table className="w-full text-sm">
                                            <thead className="bg-secondary-50 border-b border-secondary-200 sticky top-0 print:static">
                                                <tr>
                                                    <th className="px-4 py-2 text-left rtl:text-right">{t('salaries.table.employee')}</th>
                                                    <th className="px-4 py-2 text-center w-24">{t('salaries.working_days')}</th>
                                                    <th className="px-4 py-2 text-center w-24">{t('salaries.allowances')}</th>
                                                    <th className="px-4 py-2 text-center w-24">{t('salaries.deductions')}</th>
                                                    <th className="px-4 py-2 text-right rtl:text-left">{t('salaries.net_salary')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-secondary-100">
                                                {previewData.preview.map(emp => (
                                                    <tr key={emp.id} className="hover:bg-secondary-50">
                                                        <td className="px-4 py-2 font-medium">
                                                            <div>{emp.first_name} {emp.last_name}</div>
                                                            <div className="text-xs text-secondary-400">{t('salaries.attended_days')}: {emp.attendedDays} {t('profile.stats.days')}</div>
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <input
                                                                type="number"
                                                                className="w-16 h-8 text-center border border-secondary-300 rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                                                value={emp.workingDays}
                                                                onChange={(e) => handlePayrollChange(emp.id, 'workingDays', e.target.value)}
                                                                min="0" max="31"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <input
                                                                type="number"
                                                                className="w-24 h-8 text-center border border-secondary-300 rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                                                value={emp.manualAllowances}
                                                                onChange={(e) => handlePayrollChange(emp.id, 'manualAllowances', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <input
                                                                    type="number"
                                                                    className="w-24 h-8 text-center border border-secondary-300 rounded focus:ring-2 focus:ring-primary-500 outline-none"
                                                                    value={emp.manualDeductions}
                                                                    onChange={(e) => handlePayrollChange(emp.id, 'manualDeductions', e.target.value)}
                                                                />
                                                                {emp.absenceDeduction > 0 && <span className="text-[10px] text-red-500">{t('salaries.absence')}: {emp.absenceDeduction}</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-bold text-green-700">
                                                            {Number(emp.netSalary).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>


                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-secondary-100">
                                    <div className="text-sm text-secondary-500">
                                        {t('salaries.total_calc')}: <span className="font-bold text-secondary-900">{previewData.preview.reduce((sum, e) => sum + e.netSalary, 0).toLocaleString()} SAR</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="ghost" onClick={() => setPayrollStep('initial')} disabled={processing}>{t('common.cancel')}</Button>
                                        <Button onClick={confirmPayroll} disabled={processing}>
                                            {processing ? t('salaries.processing') : t('salaries.confirm_payment')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* Edit Salary Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
                    <Card className="w-full max-w-lg mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-secondary-900">{t('salaries.edit_salary')}</h2>
                            <button onClick={() => setShowModal(false)} className="text-secondary-400 hover:text-secondary-600">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="bg-secondary-50 p-4 rounded-lg mb-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                    {selectedEmployee?.first_name[0]}{selectedEmployee?.last_name[0]}
                                </div>
                                <div>
                                    <p className="font-semibold text-secondary-900">{selectedEmployee?.first_name} {selectedEmployee?.last_name}</p>
                                    <p className="text-xs text-secondary-500">{selectedEmployee?.employee_id_code}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">{t('salaries.table.base_salary')}</label>
                                <input
                                    type="number" className="input-field w-full border rounded p-2"
                                    value={salaryForm.baseSalary}
                                    onChange={e => setSalaryForm({ ...salaryForm, baseSalary: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">{t('salaries.table.housing')}</label>
                                    <input
                                        type="number" className="input-field w-full border rounded p-2"
                                        value={salaryForm.housingAllowance}
                                        onChange={e => setSalaryForm({ ...salaryForm, housingAllowance: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">{t('salaries.table.transport')}</label>
                                    <input
                                        type="number" className="input-field w-full border rounded p-2"
                                        value={salaryForm.transportAllowance}
                                        onChange={e => setSalaryForm({ ...salaryForm, transportAllowance: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">{t('salaries.other_allowances')}</label>
                                    <input
                                        type="number" className="input-field w-full border rounded p-2"
                                        value={salaryForm.otherAllowances}
                                        onChange={e => setSalaryForm({ ...salaryForm, otherAllowances: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">{t('salaries.fixed_deductions')}</label>
                                    <input
                                        type="number" className="input-field w-full border rounded p-2"
                                        value={salaryForm.deductions}
                                        onChange={e => setSalaryForm({ ...salaryForm, deductions: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
                                <Button type="submit">{t('salaries.save_changes')}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Print Preview Modal - Visible and Printable */}
            {showPrintPreview && previewData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] animate-in fade-in overflow-y-auto py-10">
                    <Card className="mx-4 p-6 w-full max-w-4xl bg-white relative">
                        <div className="flex justify-between items-center mb-4 no-print">
                            <h2 className="text-xl font-bold text-secondary-900">{t('salaries.print_preview')}</h2>
                            <button onClick={() => setShowPrintPreview(false)} className="text-secondary-400 hover:text-secondary-600">✕</button>
                        </div>

                        <div className="border border-gray-200 p-4 rounded overflow-auto bg-white max-h-[70vh]">
                            <div className="p-8 font-sans bg-white min-w-[800px]">
                                <div className="text-center mb-6">
                                    <h1 className="text-2xl font-bold mb-2">{t('salaries.sheet_title')}</h1>
                                    <p className="text-gray-600">{t('salaries.table.period')}: {payrollMonth.month}/{payrollMonth.year}</p>
                                </div>
                                <table className="w-full border-collapse border border-gray-400 text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-gray-400 px-4 py-2 text-left">{t('salaries.table.employee')}</th>
                                            <th className="border border-gray-400 px-4 py-2 text-center">{t('salaries.working_days')}</th>
                                            <th className="border border-gray-400 px-4 py-2 text-right">{t('salaries.table.base_salary')}</th>
                                            <th className="border border-gray-400 px-4 py-2 text-right">{t('salaries.allowances')}</th>
                                            <th className="border border-gray-400 px-4 py-2 text-right">{t('salaries.deductions')}</th>
                                            <th className="border border-gray-400 px-4 py-2 text-right">{t('salaries.net_salary')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.preview.map(emp => (
                                            <tr key={emp.id}>
                                                <td className="border border-gray-400 px-4 py-2">
                                                    <div>{emp.first_name} {emp.last_name}</div>
                                                    <div className="text-xs text-gray-500">{emp.employee_id_code}</div>
                                                </td>
                                                <td className="border border-gray-400 px-4 py-2 text-center">{emp.workingDays}</td>
                                                <td className="border border-gray-400 px-4 py-2 text-right">{Number(emp.base_salary).toLocaleString()}</td>
                                                <td className="border border-gray-400 px-4 py-2 text-right">{Number(emp.manualAllowances).toLocaleString()}</td>
                                                <td className="border border-gray-400 px-4 py-2 text-right">{Number(emp.manualDeductions + emp.absenceDeduction).toLocaleString()}</td>
                                                <td className="border border-gray-400 px-4 py-2 text-right font-bold">{Number(emp.netSalary).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50 font-bold">
                                            <td className="border border-gray-400 px-4 py-2 text-right" colSpan="5">{t('salaries.table.total')}</td>
                                            <td className="border border-gray-400 px-4 py-2 text-right">
                                                {previewData.preview.reduce((sum, e) => sum + e.netSalary, 0).toLocaleString()} SAR
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div className="mt-12 flex justify-between px-8">
                                    <div className="text-center">
                                        <p className="font-bold mb-12">{t('salaries.signatures.hr')}</p>
                                        <div className="border-t border-black w-48"></div>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold mb-12">{t('salaries.signatures.finance')}</p>
                                        <div className="border-t border-black w-48"></div>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold mb-12">{t('salaries.signatures.general')}</p>
                                        <div className="border-t border-black w-48"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 no-print">
                            <Button variant="ghost" onClick={() => setShowPrintPreview(false)}>{t('common.cancel')}</Button>
                            <Button onClick={handleNativePrint} icon={Printer}>
                                {t('salaries.print_now')}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </Layout>
    );
};

export default SalariesPage;
