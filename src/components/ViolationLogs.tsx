import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Filter, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ViolationLogs = () => {
  const navigate = useNavigate();
  
  const logs = [
    { id: 1, timestamp: "2025-10-13 14:23:45", violation: "No Helmet", zone: "A-3", confidence: "94.2%", frame: 1245, severity: "critical", videoId: "video_1" },
    { id: 2, timestamp: "2025-10-13 14:18:32", violation: "No Vest", zone: "B-1", confidence: "89.7%", frame: 987, severity: "warning", videoId: "video_1" },
    { id: 3, timestamp: "2025-10-13 14:15:18", violation: "Phone Usage", zone: "A-2", confidence: "96.5%", frame: 756, severity: "warning", videoId: "video_2" },
    { id: 4, timestamp: "2025-10-13 14:12:05", violation: "Too Close to Machinery", zone: "C-4", confidence: "91.3%", frame: 634, severity: "critical", videoId: "video_2" },
    { id: 5, timestamp: "2025-10-13 14:08:47", violation: "Missing Gloves", zone: "B-3", confidence: "87.9%", frame: 498, severity: "warning", videoId: "video_3" },
    { id: 6, timestamp: "2025-10-13 14:05:21", violation: "Unsafe Posture", zone: "A-1", confidence: "88.4%", frame: 342, severity: "warning", videoId: "video_3" },
    { id: 7, timestamp: "2025-10-13 14:02:10", violation: "No Helmet", zone: "C-2", confidence: "95.8%", frame: 189, severity: "critical", videoId: "video_4" },
    { id: 8, timestamp: "2025-10-13 13:58:33", violation: "Restricted Zone Entry", zone: "A-4", confidence: "93.1%", frame: 67, severity: "critical", videoId: "video_4" },
  ];

  const handleTimestampClick = (frame: number, videoId: string) => {
    // Navigate to upload page with frame and video parameters
    navigate(`/upload?video=${videoId}&frame=${frame}`);
  };

  const handleExport = () => {
    // Simulate CSV export
    const csv = "timestamp,violation,zone,confidence,frame,severity\n" + 
      logs.map(log => `${log.timestamp},${log.violation},${log.zone},${log.confidence},${log.frame},${log.severity}`).join("\n");
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'violation_logs.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Violation Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete history of detected safety violations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle>Detection History</CardTitle>
          <CardDescription>All violations detected from uploaded video analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Violation Type</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Frame</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    <button
                      onClick={() => handleTimestampClick(log.frame, log.videoId)}
                      className="flex items-center gap-2 text-primary hover:underline cursor-pointer group"
                    >
                      <Play className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {log.timestamp}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.severity === "critical" ? "destructive" : "outline"} className={log.severity === "warning" ? "border-warning text-warning" : ""}>
                      {log.violation}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.zone}</TableCell>
                  <TableCell className="text-primary font-medium">{log.confidence}</TableCell>
                  <TableCell className="font-mono text-sm">#{log.frame}</TableCell>
                  <TableCell>
                    <Badge variant={log.severity === "critical" ? "destructive" : "secondary"}>
                      {log.severity}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViolationLogs;
