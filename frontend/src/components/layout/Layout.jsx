import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
        // Global Error Handler for 401/403
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    // console.warn("Session expired, redirecting to login...");
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [navigate]);

    return (
        <div className="min-h-screen bg-secondary-50 flex font-sans" dir={document.documentElement.dir}>
            <Sidebar />
            <div className="flex-1 flex flex-col ml-64 rtl:ml-0 rtl:mr-64 transition-all duration-300">
                <Header />
                <main className="flex-1 p-6 mt-16 overflow-y-auto h-[calc(100vh-64px)]">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
