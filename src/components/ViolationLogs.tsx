import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Filter, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ViolationLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchViolations();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('violations-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'violations'
        },
        () => {
          fetchViolations();
          toast.success("New violation detected!");
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const fetchViolations = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('violations')
        .select('*')
        .order('detected_at', { ascending: false });
      
      if (error) throw error;
      
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching violations:', error);
      toast.error("Failed to load violations");
    } finally {
      setLoading(false);
    }
  };

  const handleTimestampClick = (frame: number, videoName: string) => {
    navigate(`/upload?video=${encodeURIComponent(videoName)}&frame=${frame}`);
  };

  const handleExport = () => {
    const csv = "timestamp,violation,zone,confidence,frame,severity\n" + 
      logs.map(log => `${log.detected_at},${log.violation_type},${log.metadata?.zone || 'N/A'},${(parseFloat(log.confidence) * 100).toFixed(1)}%,${log.frame_number},${log.metadata?.severity || 'N/A'}`).join("\n");
    
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading violations...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No violations detected yet. Upload a video to start analysis.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      <button
                        onClick={() => handleTimestampClick(log.frame_number, log.source_name)}
                        className="flex items-center gap-2 text-primary hover:underline cursor-pointer group"
                      >
                        <Play className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {new Date(log.detected_at).toLocaleString()}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={log.metadata?.severity === "critical" ? "destructive" : "outline"} 
                        className={log.metadata?.severity === "warning" ? "border-warning text-warning" : ""}
                      >
                        {log.violation_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.metadata?.zone || 'N/A'}</TableCell>
                    <TableCell className="text-primary font-medium">
                      {(parseFloat(log.confidence) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="font-mono text-sm">#{log.frame_number}</TableCell>
                    <TableCell>
                      <Badge variant={log.metadata?.severity === "critical" ? "destructive" : "secondary"}>
                        {log.metadata?.severity || 'unknown'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViolationLogs;
