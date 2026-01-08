import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        companyName: '',
        subDomain: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Simple handler for inputs
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // In a real app, use an env var for API URL
            const API_URL = 'http://localhost:5000/api/auth/register';

            const response = await axios.post(API_URL, formData);

            if (response.status === 201) {
                // Success! Redirect to login or dashboard
                navigate('/login', { state: { message: t('auth.success_reg') } });
            }
        } catch (err) {
            console.error(err);
            const serverError = err.response?.data?.error;
            const serverMessage = err.response?.data?.message;
            setError(serverError ? `${serverMessage}: ${serverError}` : serverMessage || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/4 w-[1000px] h-[1000px] rounded-full bg-primary-200/20 blur-3xl"></div>
                <div className="absolute -bottom-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-accent/10 blur-3xl"></div>
            </div>

            <div className="w-full max-w-md z-10 p-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent">
                        HR MOON PRO
                    </h1>
                    <p className="text-secondary-500 mt-2">{t('auth.create_workspace')}</p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-secondary-800 border-b border-secondary-100 pb-2">
                                {t('auth.company_details')}
                            </h3>
                            <Input
                                name="companyName"
                                placeholder={t('auth.company_name')}
                                required
                                value={formData.companyName}
                                onChange={handleChange}
                            />
                            <Input
                                name="subDomain"
                                placeholder={t('auth.domain')}
                                value={formData.subDomain}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-4 mt-6">
                            <h3 className="text-lg font-semibold text-secondary-800 border-b border-secondary-100 pb-2">
                                {t('auth.admin')}
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    name="firstName"
                                    placeholder={t('auth.first_name')}
                                    required
                                    value={formData.firstName}
                                    onChange={handleChange}
                                />
                                <Input
                                    name="lastName"
                                    placeholder={t('auth.last_name')}
                                    required
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                            </div>
                            <Input
                                name="email"
                                type="email"
                                placeholder={t('auth.work_email')}
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                            <Input
                                name="phone"
                                placeholder={t('auth.phone')}
                                value={formData.phone}
                                onChange={handleChange}
                            />
                            <Input
                                name="password"
                                type="password"
                                placeholder={t('auth.password')}
                                required
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full mt-6 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                            disabled={loading}
                        >
                            {loading ? t('auth.registering') : t('auth.register')}
                        </Button>

                        <p className="text-center text-sm text-secondary-500 mt-4">
                            {t('auth.already_account')} <a href="/login" className="text-primary-600 hover:underline">{t('auth.login')}</a>
                        </p>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default RegisterPage;
