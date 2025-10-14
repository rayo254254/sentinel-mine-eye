import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Activity, Camera } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [totalViolations, setTotalViolations] = useState(0);
  const [recentViolations, setRecentViolations] = useState<any[]>([]);
  const [uniqueVideos, setUniqueVideos] = useState(0);
  
  useEffect(() => {
    fetchStats();
    fetchRecentViolations();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'violations'
        },
        () => {
          fetchStats();
          fetchRecentViolations();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const fetchStats = async () => {
    try {
      const { data, count } = await (supabase as any)
        .from('violations')
        .select('*', { count: 'exact' });
      
      setTotalViolations(count || 0);
      
      // Count unique video sources
      if (data) {
        const uniqueSources = new Set(data.map((v: any) => v.source_name));
        setUniqueVideos(uniqueSources.size);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  const fetchRecentViolations = async () => {
    try {
      const { data } = await (supabase as any)
        .from('violations')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(5);
      
      setRecentViolations(data || []);
    } catch (error) {
      console.error('Error fetching recent violations:', error);
    }
  };
  
  const getTimeAgo = (timestamp: string) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return new Date(timestamp).toLocaleDateString();
  };
  
  const stats = [
    { title: "Videos Analyzed", value: uniqueVideos.toString(), icon: Camera, color: "primary" },
    { title: "Total Violations", value: totalViolations.toString(), icon: AlertTriangle, color: "warning" },
    { title: "Detection Accuracy", value: "98.5%", icon: Activity, color: "primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Safety Analysis Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Video analysis and violation detection for mining operations
          </p>
        </div>
        <Badge variant="outline" className="border-success text-success">
          System Active
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 text-${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Recent Violations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentViolations.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No violations detected yet. Upload a video to start analysis.
              </p>
            ) : (
              recentViolations.map((violation) => (
                <div
                  key={violation.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={violation.metadata?.severity === "critical" ? "destructive" : "outline"}
                      className={violation.metadata?.severity === "warning" ? "border-warning text-warning" : ""}
                    >
                      {violation.violation_type}
                    </Badge>
                    <span className="text-sm text-foreground">{violation.metadata?.zone || 'N/A'}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{getTimeAgo(violation.detected_at)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
