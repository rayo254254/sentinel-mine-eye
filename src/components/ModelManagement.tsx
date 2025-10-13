import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, Settings } from "lucide-react";
import { toast } from "sonner";

const ModelManagement = () => {
  const [activeModel, setActiveModel] = useState("yolov8n-safety.pt");

  const models = [
    { name: "yolov8n-safety.pt", status: "active", accuracy: "94.2%", size: "6.2 MB", lastTrained: "2025-10-10" },
    { name: "yolov8s-safety.pt", status: "available", accuracy: "96.5%", size: "22.5 MB", lastTrained: "2025-10-08" },
    { name: "yolov8m-safety.pt", status: "available", accuracy: "97.8%", size: "51.8 MB", lastTrained: "2025-10-05" },
  ];

  const handleModelSwitch = (modelName: string) => {
    setActiveModel(modelName);
    toast.success(`Switched to ${modelName}`);
  };

  const handleUploadModel = () => {
    toast.success("Model upload feature will connect to backend API");
  };

  const handleUploadDataset = () => {
    toast.success("Dataset upload feature will connect to backend API");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Model Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage detection models and training datasets
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle>Available Models</CardTitle>
            <CardDescription>Select and manage YOLO detection models</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {models.map((model) => (
              <div
                key={model.name}
                className={`p-4 rounded-lg border transition-colors ${
                  model.name === activeModel
                    ? "border-primary bg-primary/5"
                    : "border-border bg-secondary hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-medium">{model.name}</p>
                    {model.name === activeModel && (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  {model.name !== activeModel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleModelSwitch(model.name)}
                    >
                      Activate
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">{model.accuracy}</span>
                    <p>Accuracy</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{model.size}</span>
                    <p>Size</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{model.lastTrained}</span>
                    <p>Last Trained</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle>Upload New Model</CardTitle>
              <CardDescription>Upload a trained .pt or .onnx model file</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleUploadModel} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload Model File
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle>Training Dataset</CardTitle>
              <CardDescription>Upload YOLO-format dataset for model training</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleUploadDataset} variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload Dataset (ZIP)
              </Button>
              <p className="text-xs text-muted-foreground">
                Dataset should include images and labels in YOLO format
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle>Detection Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {["Person", "Helmet", "Vest", "Gloves", "Machinery", "Phone"].map((cls) => (
                  <div key={cls} className="flex items-center justify-between text-sm">
                    <span>{cls}</span>
                    <Badge variant="outline" className="text-xs">Trained</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Training Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium mb-1">Epochs</p>
              <p className="text-2xl font-bold text-primary">100</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Batch Size</p>
              <p className="text-2xl font-bold text-primary">16</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Image Size</p>
              <p className="text-2xl font-bold text-primary">640px</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelManagement;
