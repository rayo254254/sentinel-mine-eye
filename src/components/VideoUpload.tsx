import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Play, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const VideoUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchParams] = useSearchParams();
  const [videoUrl, setVideoUrl] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const videoPath = searchParams.get("video");
  const frameNumber = searchParams.get("frame");

  useEffect(() => {
    const loadVideo = async () => {
      if (videoPath && videoPath !== "null" && videoPath !== "undefined") {
        const { data } = supabase.storage
          .from('videos')
          .getPublicUrl(videoPath);
        setVideoUrl(data.publicUrl);
      } else {
        setVideoUrl("");
      }
    };
    
    loadVideo();
  }, [videoPath]);

  useEffect(() => {
    if (!(videoRef.current && frameNumber && videoUrl)) return;
    const video = videoRef.current;
    const timeInSeconds = parseInt(frameNumber) / 30;

    const doSeek = () => {
      if (!video) return;
      
      video.pause();
      video.currentTime = timeInSeconds;
      
      // Force another pause after seek completes to ensure it stays
      const onSeeked = () => {
        setTimeout(() => {
          if (video) {
            video.currentTime = timeInSeconds;
            video.pause();
          }
        }, 50);
        video.removeEventListener('seeked', onSeeked);
      };
      
      video.addEventListener('seeked', onSeeked);
    };

    // Wait for video to be fully ready
    if (video.readyState >= 3) {
      // Video is ready, seek immediately
      setTimeout(doSeek, 100);
    } else {
      // Wait for video to be ready
      video.addEventListener('canplaythrough', doSeek, { once: true });
    }

    return () => {
      video.removeEventListener('canplaythrough', doSeek);
    };
  }, [frameNumber, videoUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 250 * 1024 * 1024) {
        toast.error("File size must be less than 250MB");
        return;
      }
      setSelectedFile(file);
      toast.success("Video file selected");
    }
  };

  const extractFrames = async (file: File, count = 6) => {
    return new Promise<{ blobs: Blob[]; times: number[] }>((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.src = url;
      video.preload = 'metadata';
      video.crossOrigin = 'anonymous';

      video.onloadedmetadata = async () => {
        const duration = video.duration || 0;
        const width = 640;
        const height = Math.max(1, Math.round((video.videoHeight / (video.videoWidth || 1)) * width));
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }

        const blobs: Blob[] = []; const times: number[] = [];
        const captureAt = (t: number) => new Promise<void>((res) => {
          const onSeeked = () => {
            ctx.drawImage(video, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) { blobs.push(blob); times.push(t); }
              video.removeEventListener('seeked', onSeeked);
              res();
            }, 'image/jpeg', 0.75);
          };
          video.addEventListener('seeked', onSeeked);
          video.currentTime = Math.min(Math.max(0, t), Math.max(0, duration - 0.05));
        });

        const frames = Math.max(3, count);
        for (let i = 0; i < frames; i++) {
          const t = duration ? ((i + 1) / (frames + 1)) * duration : 0;
          // eslint-disable-next-line no-await-in-loop
          await captureAt(t);
        }
        URL.revokeObjectURL(url);
        resolve({ blobs, times });
      };
      video.onerror = () => reject(new Error('Failed to load video for frame extraction'));
    });
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    toast.info("Analyzing video with YOLO... This may take a moment.");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to analyze videos");
        return;
      }

      // Extract a few frames for accurate AI analysis
      let frames: { blobs: Blob[]; times: number[] } | null = null;
      try {
        toast.info('Extracting video frames for analysis...');
        frames = await extractFrames(selectedFile, 6);
      } catch {
        console.warn('Frame extraction failed, proceeding without frames');
      }

      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('videoName', selectedFile.name);
      formData.append('userId', user.id);
      if (frames && frames.blobs.length) {
        formData.append('frames_meta', JSON.stringify(frames.times));
        frames.blobs.forEach((blob, i) => {
          formData.append(`frame_${i}` as string, blob, `frame_${i}.jpg`);
        });
      }
      
      const { data, error } = await supabase.functions.invoke('analyze-video', {
        body: formData,
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Analysis complete! Found ${data.violations} violations. Check logs for details.`);
      } else {
        toast.error("Analysis failed: " + data.error);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("Failed to analyze video. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    toast.info("File removed");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Video Analysis
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload recorded videos for safety violation detection
        </p>
      </div>

      {videoUrl && (
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle>Video Player</CardTitle>
            <CardDescription>
              Viewing violation at frame {frameNumber}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <video 
              key={videoPath || videoUrl}
              ref={videoRef}
              controls 
              preload="auto"
              playsInline
              className="w-full rounded-lg"
              src={videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle>Upload Video</CardTitle>
          <CardDescription>
            Supported formats: MP4, AVI, MOV (max 250MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input
              type="file"
              accept="video/mp4,video/avi,video/mov"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload"
            />
            <label htmlFor="video-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
              <div className="flex items-center gap-3">
                <Play className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                disabled={isAnalyzing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={!selectedFile || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? "Analyzing..." : "Start Analysis"}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle>Processing Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Frame extraction and preprocessing</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>YOLOv8 object detection</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Violation classification</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Output generation and logging</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoUpload;
