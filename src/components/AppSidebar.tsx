import { NavLink, useLocation } from "react-router-dom";
import { MessageSquare, Calendar, Bell, User, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/chat", icon: MessageSquare, label: "Chat" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/notice", icon: Bell, label: "Notice" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function AppSidebar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-60 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-primary">LIVE</span>
          <span className="text-sidebar-foreground">-P</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              currentUser?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate flex items-center gap-1.5">
              {currentUser?.name}
              {currentUser?.isAdmin && <Shield className="h-3 w-3 text-primary" />}
            </p>
            <p className="text-xs text-muted-foreground truncate">{currentUser?.id}</p>
          </div>
          <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors" title="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
