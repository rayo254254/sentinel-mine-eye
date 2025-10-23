import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const ModelManagement = () => {
  const datasetFileRef = useRef<HTMLInputElement>(null);
  const [uploadingDataset, setUploadingDataset] = useState(false);

  // Fetch uploaded datasets from database
  const { data: uploadedDatasets = [], refetch } = useQuery({
    queryKey: ['uploaded-datasets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('type', 'dataset')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const handleUploadDataset = () => {
    datasetFileRef.current?.click();
  };

  const handleDatasetFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      toast.error('Please upload a ZIP file containing YOLO training data');
      return;
    }

    setUploadingDataset(true);
    try {
      // Upload to storage
      const filePath = `datasets/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('models')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { data: { user } } = await supabase.auth.getUser();
      const { error: dbError } = await supabase
        .from('models')
        .insert({
          name: file.name,
          file_path: filePath,
          type: 'dataset',
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user?.id,
          is_active: true, // Mark as active for detection
          metadata: {
            format: 'yolo',
            extracted: false // Will be extracted by backend
          }
        });

      if (dbError) throw dbError;

      toast.success('Training dataset uploaded and will be extracted for use');
      refetch();
    } catch (error: any) {
      toast.error('Failed to upload dataset: ' + error.message);
    } finally {
      setUploadingDataset(false);
      if (datasetFileRef.current) datasetFileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={datasetFileRef}
        onChange={handleDatasetFileChange}
        accept=".zip"
        className="hidden"
      />

      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Training Datasets
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload YOLO training datasets to improve detection accuracy
        </p>
      </div>

      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle>Upload Training Dataset</CardTitle>
          <CardDescription>
            Upload a ZIP file containing YOLO-format training data (images + labels). 
            The system will automatically extract and use this data to improve violation detection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleUploadDataset} 
            className="w-full" 
            disabled={uploadingDataset}
            size="lg"
          >
            {uploadingDataset ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Upload className="h-5 w-5 mr-2" />
            )}
            {uploadingDataset ? 'Uploading Dataset...' : 'Upload YOLO Dataset (ZIP)'}
          </Button>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Dataset Requirements:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>ZIP file containing images and YOLO annotation files (.txt)</li>
              <li>Images should be in JPG, PNG, or similar formats</li>
              <li>Labels should follow YOLO format (class x y width height)</li>
              <li>The system will extract and integrate this data automatically</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {uploadedDatasets.length > 0 && (
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle>Uploaded Datasets</CardTitle>
            <CardDescription>Active training datasets being used for detection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploadedDatasets.map((dataset) => (
              <div
                key={dataset.id}
                className="p-4 rounded-lg border border-primary bg-primary/5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm font-medium">{dataset.name}</p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>
                        <span className="font-medium text-foreground">
                          {(dataset.file_size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </span>
                      <span>•</span>
                      <span>
                        Uploaded: {new Date(dataset.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModelManagement;
