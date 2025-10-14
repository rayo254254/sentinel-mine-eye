import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Video, FileText, Settings, ShieldAlert } from "lucide-react";

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/upload", label: "Video Analysis", icon: Video },
    { to: "/logs", label: "Violation Logs", icon: FileText },
    { to: "/models", label: "Model Management", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <ShieldAlert className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
          MineGuard AI
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-secondary p-3 text-xs">
          <p className="font-medium mb-1">Backend Integration</p>
          <p className="text-muted-foreground">
            Connect to Flask API at <code className="text-primary">localhost:5000</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
