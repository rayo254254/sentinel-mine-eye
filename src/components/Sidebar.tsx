import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Video, FileText, Settings, ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/upload", label: "Video Analysis", icon: Video },
    { to: "/logs", label: "Violation Logs", icon: FileText },
    { to: "/models", label: "Model Management", icon: Settings },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      toast.success("Logged out successfully");
    }
  };

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
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
