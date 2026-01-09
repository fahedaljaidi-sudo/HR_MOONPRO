import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { API_URL } from '../config';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });

      if (response.data.token) {
        // Save token and user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect to Dashboard (not built yet, but let's go root)
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary-100/30 blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/20 blur-3xl"></div>
      </div>

      <div className="w-full max-w-sm z-10 p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">{t('auth.welcome_back')}</h1>
          <p className="text-secondary-500 mt-2">{t('auth.sign_in_subtitle')}</p>
        </div>

        <Card>
          {message && (
            <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input
                type="email"
                placeholder={t('auth.email')}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder={t('auth.password')}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? t('auth.signing_in') : t('auth.sign_in')}
            </Button>

            <p className="text-center text-sm text-secondary-500 mt-4">
              {t('auth.new_company')} <a href="/register" className="text-primary-600 hover:underline">{t('auth.create_workspace')}</a>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
