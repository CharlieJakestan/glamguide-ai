
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { checkGanFunction } from '@/services/ganService';

export type SetupStatusType = 'not_started' | 'in_progress' | 'completed';
export type ComponentStatusType = 'checking' | 'ready' | 'error';

export const useSetupStatus = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<SetupStatusType>('not_started');
  const [modelStatus, setModelStatus] = useState<ComponentStatusType>('checking');
  const [edgeFunctionStatus, setEdgeFunctionStatus] = useState<ComponentStatusType>('checking');
  const [simulationMode, setSimulationMode] = useState(false);

  // Check if the GAN model and edge function are ready
  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Check if the edge function is working
      const edgeFunctionWorking = await checkEdgeFunctionStatus();
      
      // Check if model files exist
      const modelFilesExist = await checkModelFilesExist();
      
      // Determine overall setup status
      if (edgeFunctionWorking && modelFilesExist) {
        setSetupStatus('completed');
        setSimulationMode(false);
        toast({
          title: "Setup Complete",
          description: "The AI Makeup Manager is ready to use!",
        });
      } else if (!edgeFunctionWorking && !modelFilesExist) {
        setSetupStatus('not_started');
        setSimulationMode(true);
        toast({
          title: "Setup Simulation Mode Activated",
          description: "Using simulation mode due to configuration issues.",
        });
      } else {
        setSetupStatus('in_progress');
        setSimulationMode(true);
        toast({
          title: "Setup Incomplete",
          description: "Some components are still not ready. Using simulation mode.",
        });
      }
    } catch (error) {
      console.error("Error checking status:", error);
      setSetupStatus('in_progress');
      setSimulationMode(true);
      toast({
        title: "Setup Check Failed",
        description: "Error checking setup status. Using simulation mode.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Check for model files in Supabase storage using the edge function
  const checkModelFilesExist = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Checking for model files via AI Makeup Manager...');
      setModelStatus('checking');
      
      // Call the AI Makeup Manager edge function to check model status
      const { data, error } = await supabase.functions.invoke('ai-makeup-manager', {
        body: { action: 'check-status' },
      });
      
      if (error) {
        console.error('Error checking model files via edge function:', error);
        setModelStatus('error');
        return false;
      }
      
      // Check if the response indicates model files exist
      if (data && data.status === 'ok' && data.modelStatus) {
        const { ganModelExists, faceModelsExist } = data.modelStatus;
        
        if (ganModelExists && faceModelsExist) {
          console.log('Model files verified via edge function');
          setModelStatus('ready');
          return true;
        } else {
          console.log('Some model files missing according to edge function check');
          setModelStatus('error');
          return false;
        }
      }
      
      // If we're here, the edge function didn't return proper model status
      console.warn('Edge function did not provide adequate model status information');
      
      // Fall back to direct storage check
      try {
        // Try to list buckets to see if storage is accessible
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          console.error('Error accessing storage buckets:', bucketsError);
          setModelStatus('error');
          return false;
        }
        
        const ganBucket = buckets?.find(bucket => bucket.name === 'gantrainingfiles');
        const modelsBucket = buckets?.find(bucket => bucket.name === 'makeup-models');
        
        if (!ganBucket || !modelsBucket) {
          console.warn('Required storage buckets not found');
          setModelStatus('error');
          return false;
        }
        
        // Check for files in the GAN bucket
        const { data: ganFiles, error: ganError } = await supabase.storage
          .from('gantrainingfiles')
          .list();
        
        if (ganError) {
          console.error('Error listing GAN files:', ganError);
          setModelStatus('error');
          return false;
        }
        
        const ganModelExists = ganFiles?.some(file => 
          file.name.endsWith('.h5') || 
          file.name.endsWith('.model') || 
          file.name.endsWith('.weights')
        );
        
        // Check for face detection model files
        const { data: faceFiles, error: faceError } = await supabase.storage
          .from('makeup-models')
          .list('face-detection');
        
        // It's okay if the face-detection folder doesn't exist yet
        if (faceError && !faceError.message.includes('not found')) {
          console.error('Error listing face model files:', faceError);
        }
        
        const faceModelsExist = faceFiles && faceFiles.length > 0;
        
        if (ganModelExists && faceModelsExist) {
          console.log('Model files verified via direct storage check');
          setModelStatus('ready');
          return true;
        } else {
          console.log('Some model files missing according to direct storage check');
          setModelStatus('error');
          return false;
        }
      } catch (error) {
        console.error('Error checking for files:', error);
        setModelStatus('error');
        return false;
      }
    } catch (error) {
      console.error('Error checking model files:', error);
      setModelStatus('error');
      return false;
    }
  }, []);

  // Check if edge function is working
  const checkEdgeFunctionStatus = useCallback(async (): Promise<boolean> => {
    try {
      setEdgeFunctionStatus('checking');
      const isActive = await checkGanFunction();
      
      if (isActive) {
        console.log('AI Makeup Manager edge function is working');
        setEdgeFunctionStatus('ready');
        return true;
      } else {
        console.warn('AI Makeup Manager edge function check failed');
        setEdgeFunctionStatus('error');
        return false;
      }
    } catch (error) {
      console.error('Error checking edge function:', error);
      setEdgeFunctionStatus('error');
      return false;
    }
  }, []);

  // Initial check on component mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    isLoading,
    setupStatus,
    modelStatus,
    edgeFunctionStatus,
    simulationMode,
    checkStatus
  };
};
