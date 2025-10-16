import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ModelManagement = () => {
  const modelFileRef = useRef<HTMLInputElement>(null);
  const datasetFileRef = useRef<HTMLInputElement>(null);
  const modelFolderRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [uploadingModel, setUploadingModel] = useState(false);
  const [uploadingDataset, setUploadingDataset] = useState(false);
  const [uploadingFolder, setUploadingFolder] = useState(false);
  const [detectionMethod, setDetectionMethod] = useState<'roboflow' | 'custom'>('roboflow');

  // Fetch uploaded models from database
  const { data: uploadedModels = [], refetch } = useQuery({
    queryKey: ['uploaded-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch detection settings
  const { data: settings } = useQuery({
    queryKey: ['detection-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('detection_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  useEffect(() => {
    if (settings) {
      setDetectionMethod(settings.detection_method as 'roboflow' | 'custom');
    }
  }, [settings]);

  // Update detection method mutation
  const updateDetectionMethodMutation = useMutation({
    mutationFn: async (method: 'roboflow' | 'custom') => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: upsertError } = await supabase
        .from('detection_settings')
        .upsert({ 
          user_id: user.id, 
          detection_method: method 
        }, {
          onConflict: 'user_id'
        });
      
      if (upsertError) throw upsertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detection-settings'] });
      toast.success('Detection method updated');
    },
    onError: (error) => {
      toast.error('Failed to update detection method: ' + error.message);
    }
  });

  const handleDetectionMethodChange = (method: 'roboflow' | 'custom') => {
    setDetectionMethod(method);
    updateDetectionMethodMutation.mutate(method);
  };

  // Activate model mutation
  const activateModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      // Deactivate all models first
      await supabase
        .from('models')
        .update({ is_active: false })
        .neq('id', modelId);
      
      // Activate selected model
      const { error } = await supabase
        .from('models')
        .update({ is_active: true })
        .eq('id', modelId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploaded-models'] });
      toast.success('Model activated successfully');
    },
    onError: (error) => {
      toast.error('Failed to activate model: ' + error.message);
    }
  });

  const handleUploadModel = () => {
    modelFileRef.current?.click();
  };

  const handleUploadDataset = () => {
    datasetFileRef.current?.click();
  };

  const handleModelFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingModel(true);
    try {
      // Upload to storage
      const filePath = `models/${Date.now()}_${file.name}`;
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
          type: 'model',
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user?.id
        });

      if (dbError) throw dbError;

      toast.success('Model uploaded successfully');
      refetch();
    } catch (error: any) {
      toast.error('Failed to upload model: ' + error.message);
    } finally {
      setUploadingModel(false);
      if (modelFileRef.current) modelFileRef.current.value = '';
    }
  };

  const handleUploadFolder = () => {
    modelFolderRef.current?.click();
  };

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFolder(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const folderName = `trained_model_${Date.now()}`;
      let totalSize = 0;
      const uploadedFiles: string[] = [];

      // Upload each file in the folder
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        totalSize += file.size;
        
        const filePath = `models/${folderName}/${file.webkitRelativePath || file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('models')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        uploadedFiles.push(file.name);
      }

      // Save folder metadata to database
      const { error: dbError } = await supabase
        .from('models')
        .insert({
          name: folderName,
          file_path: `models/${folderName}`,
          type: 'trained_folder',
          file_size: totalSize,
          mime_type: 'application/x-folder',
          uploaded_by: user?.id,
          metadata: {
            files: uploadedFiles,
            file_count: files.length
          }
        });

      if (dbError) throw dbError;

      toast.success(`Trained model folder uploaded: ${files.length} files`);
      refetch();
    } catch (error: any) {
      toast.error('Failed to upload folder: ' + error.message);
    } finally {
      setUploadingFolder(false);
      if (modelFolderRef.current) modelFolderRef.current.value = '';
    }
  };

  const handleDatasetFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
          uploaded_by: user?.id
        });

      if (dbError) throw dbError;

      toast.success('Dataset uploaded successfully');
      refetch();
    } catch (error: any) {
      toast.error('Failed to upload dataset: ' + error.message);
    } finally {
      setUploadingDataset(false);
      if (datasetFileRef.current) datasetFileRef.current.value = '';
    }
  };

  const activeModel = uploadedModels.find(m => m.is_active && m.type === 'model');

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={modelFileRef}
        onChange={handleModelFileChange}
        accept=".pt,.onnx,.pth"
        className="hidden"
      />
      <input
        type="file"
        ref={datasetFileRef}
        onChange={handleDatasetFileChange}
        accept=".zip"
        className="hidden"
      />
      <input
        type="file"
        ref={modelFolderRef}
        onChange={handleFolderUpload}
        {...({ webkitdirectory: "", directory: "", multiple: true } as any)}
        className="hidden"
      />

      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Model Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage detection models and training datasets
        </p>
      </div>

      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle>Detection Method</CardTitle>
          <CardDescription>Choose how violations should be detected</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => handleDetectionMethodChange('roboflow')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                detectionMethod === 'roboflow'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-4 w-4 rounded-full border-2 ${
                  detectionMethod === 'roboflow' 
                    ? 'border-primary bg-primary' 
                    : 'border-muted-foreground'
                }`} />
                <h3 className="font-semibold">Roboflow API</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Use Roboflow's cloud-based detection service
              </p>
            </button>

            <button
              onClick={() => handleDetectionMethodChange('custom')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                detectionMethod === 'custom'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-4 w-4 rounded-full border-2 ${
                  detectionMethod === 'custom' 
                    ? 'border-primary bg-primary' 
                    : 'border-muted-foreground'
                }`} />
                <h3 className="font-semibold">Custom Trained Models </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Use AI-powered analysis based on your training data and labels
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle>Uploaded Models</CardTitle>
            <CardDescription>Your trained YOLO detection models</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploadedModels.filter(m => m.type === 'model').length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No models uploaded yet. Upload your trained model to get started.
              </p>
            ) : (
              uploadedModels
                .filter(m => m.type === 'model')
                .map((model) => (
                  <div
                    key={model.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      model.is_active
                        ? "border-primary bg-primary/5"
                        : "border-border bg-secondary hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-medium">{model.name}</p>
                        {model.is_active && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      {!model.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => activateModelMutation.mutate(model.id)}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">
                          {(model.file_size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                        <p>Size</p>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          {new Date(model.created_at).toLocaleDateString()}
                        </span>
                        <p>Uploaded</p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle>Upload New Model</CardTitle>
              <CardDescription>Upload a trained .pt or .onnx model file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleUploadModel} className="w-full" disabled={uploadingModel}>
                {uploadingModel ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploadingModel ? 'Uploading...' : 'Upload Model File'}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <Button onClick={handleUploadFolder} variant="outline" className="w-full" disabled={uploadingFolder}>
                {uploadingFolder ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploadingFolder ? 'Uploading Folder...' : 'Upload Trained Model Folder'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Upload a complete trained model folder with weights, config, and label files
              </p>
              {uploadedModels.filter(m => m.type === 'trained_folder').length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium">Uploaded Folders:</p>
                  {uploadedModels
                    .filter(m => m.type === 'trained_folder')
                    .map((folder) => (
                      <div
                        key={folder.id}
                        className="p-3 rounded-lg border border-border bg-secondary text-xs"
                      >
                        <p className="font-mono font-medium">{folder.name}</p>
                        <p className="text-muted-foreground mt-1">
                          {(folder.metadata as any)?.file_count || 0} files • {(folder.file_size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle>Training Datasets</CardTitle>
              <CardDescription>Upload YOLO-format dataset for model training</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={handleUploadDataset} variant="outline" className="w-full" disabled={uploadingDataset}>
                {uploadingDataset ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploadingDataset ? 'Uploading...' : 'Upload Dataset (ZIP)'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Dataset should include images and labels in YOLO format
              </p>
              {uploadedModels.filter(m => m.type === 'dataset').length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedModels
                    .filter(m => m.type === 'dataset')
                    .map((dataset) => (
                      <div
                        key={dataset.id}
                        className="p-3 rounded-lg border border-border bg-secondary text-xs"
                      >
                        <p className="font-mono font-medium">{dataset.name}</p>
                        <p className="text-muted-foreground mt-1">
                          {(dataset.file_size / (1024 * 1024)).toFixed(2)} MB • {new Date(dataset.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                </div>
              )}
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
