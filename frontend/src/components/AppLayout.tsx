import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, LayoutDashboard, FileText, FileBadge, LogOut } from 'lucide-react';
import { Separator } from './ui/separator';

export default function AppLayout() {
  const { logout, name, email } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/jobs',      label: 'Jobs',       icon: Briefcase },
    { to: '/applications', label: 'Applications', icon: FileBadge },
    { to: '/resumes',   label: 'Resumes',    icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Dark sidebar */}
      <aside className="w-[200px] flex-shrink-0 flex flex-col bg-sidebar text-sidebar-foreground">
        {/* Wordmark */}
        <div className="px-5 pt-8 pb-6">
          <span className="text-xl font-display leading-none tracking-wide text-sidebar-primary-foreground">
            CareerOS
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 px-3 py-2 rounded-sm text-[13px] font-medium transition-colors duration-100',
                      isActive
                        ? 'text-sidebar-primary-foreground border-l-2 border-primary pl-[10px]'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-primary-foreground',
                    ].join(' ')
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User row */}
        <div className="mt-auto">
          <Separator className="bg-sidebar-border" />
          <div className="px-4 py-4">
            <div
              className="text-[11px] text-sidebar-foreground/60 truncate mb-1"
              title={email ?? ''}
            >
              {email ?? ''}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-sidebar-primary-foreground truncate" title={name || ''}>
                {name}
              </span>
              <button
                onClick={logout}
                className="p-1.5 flex-shrink-0 text-sidebar-foreground/60 hover:text-sidebar-primary-foreground transition-colors rounded-sm"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto px-10 py-9">
        <Outlet />
      </main>
    </div>
  );
}