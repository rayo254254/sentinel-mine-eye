import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Square, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const LiveMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [detections, setDetections] = useState<any[]>([]);

  const handleStartMonitoring = () => {
    setIsMonitoring(true);
    toast.success("Live monitoring started");
    
    // Simulate real-time detections
    const interval = setInterval(() => {
      const violations = ["No Helmet", "No Vest", "Phone Usage", "Too Close"];
      const zones = ["A-1", "A-2", "B-1", "B-2", "C-1"];
      
      const newDetection = {
        id: Date.now(),
        type: violations[Math.floor(Math.random() * violations.length)],
        zone: zones[Math.floor(Math.random() * zones.length)],
        confidence: (85 + Math.random() * 15).toFixed(1),
        time: new Date().toLocaleTimeString(),
      };
      
      setDetections(prev => [newDetection, ...prev].slice(0, 10));
    }, 5000);

    return () => clearInterval(interval);
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
    toast.info("Live monitoring stopped");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Live Monitoring
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time camera feed analysis
          </p>
        </div>
        {isMonitoring ? (
          <Button onClick={handleStopMonitoring} variant="destructive">
            <Square className="h-4 w-4 mr-2" />
            Stop Monitoring
          </Button>
        ) : (
          <Button onClick={handleStartMonitoring}>
            <Camera className="h-4 w-4 mr-2" />
            Start Monitoring
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card border-border">
          <CardHeader>
            <CardTitle>Camera Feed</CardTitle>
            <CardDescription>RTSP Stream - Camera 01</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center relative overflow-hidden">
              {isMonitoring ? (
                <div className="absolute inset-0 bg-gradient-to-br from-secondary to-secondary/50">
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge variant="destructive" className="animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                      LIVE
                    </Badge>
                    <Badge variant="outline">720p • 25 FPS</Badge>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <Badge variant="outline">Detection Active</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Camera feed inactive</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Live Detections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {detections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No detections yet
                </p>
              ) : (
                detections.map((detection) => (
                  <div
                    key={detection.id}
                    className="p-3 rounded-lg bg-secondary border border-border hover:border-primary transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="destructive" className="text-xs">
                        {detection.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{detection.time}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">Zone {detection.zone}</span>
                      <span className="text-primary font-medium">{detection.confidence}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-sm">Camera Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-success' : 'bg-muted'}`}></div>
              <span className="text-sm">{isMonitoring ? 'Connected' : 'Disconnected'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-sm">Model Loaded</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono text-primary">yolov8n-safety.pt</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-sm">Detection FPS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{isMonitoring ? '12.5 FPS' : '--'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveMonitor;
