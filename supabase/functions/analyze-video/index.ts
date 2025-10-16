import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const roboflowApiKey = Deno.env.get('ROBOFLOW_API_KEY');
    
    if (!roboflowApiKey) {
      throw new Error('ROBOFLOW_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch active model from database
    const { data: activeModel } = await supabase
      .from('models')
      .select('*')
      .eq('type', 'model')
      .eq('is_active', true)
      .single();
    
    if (activeModel) {
      console.log(`Using active model: ${activeModel.name} (${activeModel.file_path})`);
    } else {
      console.log('No active model found, using default detection');
    }
    
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;
    const videoName = formData.get('videoName') as string;
    
    if (!videoFile) {
      throw new Error('No video file provided');
    }

    console.log(`Processing video: ${videoName}`);
    
    // Convert video to array buffer
    const videoBuffer = await videoFile.arrayBuffer();
    
    // Upload video to storage
    const timestamp = Date.now();
    const videoPath = `${timestamp}_${videoName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(videoPath, videoBuffer, {
        contentType: videoFile.type,
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading video:', uploadError);
      throw new Error(`Failed to upload video: ${uploadError.message}`);
    }
    
    console.log(`Video uploaded to storage: ${videoPath}`);
    
    // Simulate frame extraction and analysis
    // In a real implementation, you'd use FFmpeg or similar to extract frames
    const frameCount = Math.floor(Math.random() * 10) + 5; // Simulate 5-15 frames
    const violations = [];
    
    const violationTypes = [
      'No Helmet',
      'No Vest',
      'No Gloves',
      'Phone Usage',
      'Too Close to Machinery',
      'Unsafe Posture',
      'Restricted Zone Entry',
      'Missing Gloves'
    ];
    
    const zones = ['A-1', 'A-2', 'A-3', 'A-4', 'B-1', 'B-2', 'B-3', 'C-1', 'C-2', 'C-3', 'C-4'];
    
    // Simulate processing frames with YOLO
    for (let i = 0; i < frameCount; i++) {
      const frameNumber = Math.floor(Math.random() * 3000) + 100;
      
      // Simulate detection (in real implementation, call Roboflow API)
      // For demo purposes, randomly generate violations
      if (Math.random() > 0.3) { // 70% chance of detecting a violation per frame
        const violation = {
          violation_type: violationTypes[Math.floor(Math.random() * violationTypes.length)],
          confidence: (Math.random() * 0.15 + 0.85).toFixed(3), // 85-100% confidence
          source_type: 'video',
          source_name: videoName,
          video_path: videoPath,
          frame_number: frameNumber,
          metadata: {
            zone: zones[Math.floor(Math.random() * zones.length)],
            severity: Math.random() > 0.6 ? 'critical' : 'warning'
          }
        };
        
        violations.push(violation);
        
        // Insert violation into database
        const { error: insertError } = await supabase
          .from('violations')
          .insert(violation);
          
        if (insertError) {
          console.error('Error inserting violation:', insertError);
        }
      }
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Analysis complete. Found ${violations.length} violations.`);
    
    return new Response(
      JSON.stringify({
        success: true,
        violations: violations.length,
        details: violations
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Error in analyze-video function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});