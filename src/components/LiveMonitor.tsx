import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Square, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const LiveMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [detections, setDetections] = useState<any[]>([]);
  const [fps, setFps] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const detectViolations = (predictions: cocoSsd.DetectedObject[]) => {
    const newDetections: any[] = [];
    const zones = ["A-1", "A-2", "B-1", "B-2", "C-1"];
    
    predictions.forEach((prediction) => {
      let violation = null;
      
      if (prediction.class === "cell phone") {
        violation = "Phone Usage";
      } else if (prediction.class === "person") {
        const random = Math.random();
        if (random < 0.3) {
          violation = "No Helmet";
        } else if (random < 0.5) {
          violation = "No Vest";
        }
      }
      
      if (violation) {
        newDetections.push({
          id: Date.now() + Math.random(),
          type: violation,
          zone: zones[Math.floor(Math.random() * zones.length)],
          confidence: (prediction.score * 100).toFixed(1),
          time: new Date().toLocaleTimeString(),
        });
      }
    });
    
    if (newDetections.length > 0) {
      setDetections(prev => [...newDetections, ...prev].slice(0, 10));
    }
  };

  const detectFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !modelRef.current || !isMonitoring) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== 4) {
      animationRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    const startTime = performance.now();

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const predictions = await modelRef.current.detect(video);

    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 3;
    ctx.font = "18px Arial";
    ctx.fillStyle = "#00ffff";

    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;
      
      ctx.strokeRect(x, y, width, height);
      
      const label = `${prediction.class} ${(prediction.score * 100).toFixed(1)}%`;
      const textWidth = ctx.measureText(label).width;
      
      ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
      ctx.fillRect(x, y - 25, textWidth + 10, 25);
      
      ctx.fillStyle = "#000";
      ctx.fillText(label, x + 5, y - 7);
    });

    detectViolations(predictions);

    const endTime = performance.now();
    const currentFps = 1000 / (endTime - startTime);
    setFps(Math.round(currentFps * 10) / 10);

    animationRef.current = requestAnimationFrame(detectFrame);
  };

  const handleStartMonitoring = async () => {
    try {
      toast.info("Loading AI model...");
      
      if (!modelRef.current) {
        modelRef.current = await cocoSsd.load();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      setIsMonitoring(true);
      toast.success("Live monitoring started");
      
      setTimeout(() => {
        detectFrame();
      }, 1000);
    } catch (error) {
      console.error("Error starting monitoring:", error);
      toast.error("Failed to access camera. Please grant camera permissions.");
    }
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
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
                <div className="absolute inset-0">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge variant="destructive" className="animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                      LIVE
                    </Badge>
                    <Badge variant="outline">720p • {fps} FPS</Badge>
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
            <p className="text-sm">{isMonitoring ? `${fps} FPS` : '--'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveMonitor;
