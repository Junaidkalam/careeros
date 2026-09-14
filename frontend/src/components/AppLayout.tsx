import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, LayoutDashboard, FileText, FileBadge, LogOut, Command, Sparkles } from 'lucide-react';

export default function AppLayout() {
  const { logout, name, email } = useAuth();

  const overviewItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];
  
  const workflowItems = [
    { to: '/jobs',              label: 'Jobs',            icon: Briefcase },
    { to: '/recommendations',   label: 'Recommended',     icon: Sparkles },
    { to: '/applications',      label: 'Applications',    icon: FileBadge },
    { to: '/resumes',           label: 'Resumes',         icon: FileText },
  ];

  const renderNavItems = (items: any[]) => (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            className={({ isActive }) =>
              [
                'relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-200 group overflow-hidden',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                )}
                <item.icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isActive ? 'text-primary scale-110' : 'group-hover:scale-110'}`} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 flex flex-col bg-sidebar border-r border-border/40 relative z-20">
        
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 mb-2 mt-2">
          <div className="flex items-center gap-3 w-full group cursor-default">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-sm ring-1 ring-primary/20 group-hover:shadow-md transition-all duration-300">
              <Command className="w-4 h-4" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-foreground">
              CareerOS
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <div className="px-3 mb-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground/70">Overview</div>
            {renderNavItems(overviewItems)}
          </div>
          <div className="mb-6">
            <div className="px-3 mb-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground/70">Workflow</div>
            {renderNavItems(workflowItems)}
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-4 mt-auto border-t border-border/40 bg-sidebar/50">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 transition-colors group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs ring-1 ring-border/50 group-hover:ring-primary/30 transition-all">
              {name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <span className="text-sm font-semibold text-foreground truncate block leading-tight">
                {name || 'User'}
              </span>
              <span className="text-[11px] text-muted-foreground/80 truncate block mt-0.5 font-medium">
                {email || 'user@careeros.app'}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 flex-shrink-0 text-muted-foreground/50 opacity-0 group-hover:opacity-100 group-hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background bg-dot-pattern relative custom-scrollbar">
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/90 to-background pointer-events-none z-0" />
        <div className="max-w-[1400px] mx-auto px-8 py-8 md:px-12 md:py-10 relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}