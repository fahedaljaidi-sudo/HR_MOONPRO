import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Banknote, CalendarCheck, MessageSquare, ShieldCheck, Settings, Building2, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from "../../lib/utils";

const Sidebar = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const role = (payload.role || '').toLowerCase();
                setIsAdmin(['admin', 'manager', 'owner'].includes(role));
            } catch (e) { }
        }
    }, []);

    const isActive = (path) => location.pathname === path;

    const menuItems = [
        { name: t('sidebar.dashboard'), path: '/', icon: LayoutDashboard },
        // Only show Organization if admin
        ...(isAdmin ? [{ name: t('sidebar.organization'), path: '/organization', icon: Building2 }] : []),
        { name: t('sidebar.employees'), path: '/employees', icon: Users },
        { name: t('sidebar.requests'), path: '/requests', icon: FileText },
        // Only show Salaries if admin
        ...(isAdmin ? [{ name: t('sidebar.salaries'), path: '/salaries', icon: Banknote }] : []),
        { name: t('sidebar.attendance'), path: '/attendance', icon: CalendarCheck },
        // Only show Roles in main menu if admin (if you had it there)
        ...(isAdmin ? [{ name: t('sidebar.roles'), path: '/roles', icon: ShieldCheck }] : []),
        { name: t('sidebar.messages'), path: '/messages', icon: MessageSquare },
    ];

    const bottomItems = [
        // Only show Permissions/Roles in bottom menu if admin
        ...(isAdmin ? [{ name: t('sidebar.permissions'), path: '/roles', icon: ShieldCheck }] : []),
        { name: t('sidebar.settings'), path: '/settings', icon: Settings },
    ];

    const NavItem = ({ item }) => (
        <Link
            to={item.path}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium",
                isActive(item.path)
                    ? "bg-primary-50 text-primary-700 shadow-sm"
                    : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
            )}
        >
            <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive(item.path) ? "text-primary-600" : "text-secondary-400 group-hover:text-secondary-600"
            )} />
            {item.name}
        </Link>
    );

    return (
        <aside className="w-64 border-r border-secondary-200 bg-white/50 backdrop-blur-xl flex flex-col h-screen fixed left-0 top-0 z-40 rtl:left-auto rtl:right-0 rtl:border-r-0 rtl:border-l">
            <div className="h-16 flex items-center px-6 border-b border-secondary-100">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-accent">
                    {t('sidebar.app_name') || 'HR MOON PRO'}
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <NavItem key={item.path} item={item} />
                ))}

                <div className="pt-4 mt-4 border-t border-secondary-100">
                    <p className="px-3 text-xs font-semibold text-secondary-400 uppercase tracking-wider mb-2">
                        {t('sidebar.system')}
                    </p>
                    {bottomItems.map((item) => (
                        <NavItem key={item.path} item={item} />
                    ))}
                </div>
            </nav>

        </aside>
    );
};

export default Sidebar;
