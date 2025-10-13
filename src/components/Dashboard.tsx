import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Activity, Camera } from "lucide-react";

const Dashboard = () => {
  const stats = [
    { title: "Active Cameras", value: "8", icon: Camera, color: "primary" },
    { title: "Violations Today", value: "23", icon: AlertTriangle, color: "warning" },
    { title: "Safe Operations", value: "142", icon: CheckCircle, color: "success" },
    { title: "Detection Rate", value: "98.5%", icon: Activity, color: "primary" },
  ];

  const recentViolations = [
    { id: 1, type: "No Helmet", worker: "Zone A-3", time: "2 min ago", severity: "critical" },
    { id: 2, type: "No Vest", worker: "Zone B-1", time: "5 min ago", severity: "warning" },
    { id: 3, type: "Phone Usage", worker: "Zone A-2", time: "8 min ago", severity: "warning" },
    { id: 4, type: "Too Close to Machinery", worker: "Zone C-4", time: "12 min ago", severity: "critical" },
    { id: 5, type: "Missing Gloves", worker: "Zone B-3", time: "15 min ago", severity: "warning" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Safety Monitoring Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time violation detection for mining operations
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
            {recentViolations.map((violation) => (
              <div
                key={violation.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={violation.severity === "critical" ? "destructive" : "outline"}
                    className={violation.severity === "warning" ? "border-warning text-warning" : ""}
                  >
                    {violation.type}
                  </Badge>
                  <span className="text-sm text-foreground">{violation.worker}</span>
                </div>
                <span className="text-sm text-muted-foreground">{violation.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
