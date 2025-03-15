
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Check if model files exist in Supabase
    checkModelFilesExist();
    
    // Check if edge function exists and is working
    checkEdgeFunctionStatus();
  }, []);

  const checkModelFilesExist = async () => {
    try {
      // First check the models1 bucket which contains the user's new .h5 files
      const { data: models1Files, error: models1Error } = await supabase.storage
        .from('models1')
        .list('');
      
      if (!models1Error && models1Files && models1Files.length > 0) {
        console.log('Found model files in models1 bucket:', models1Files);
        setModelStatus('ready');
        
        if (edgeFunctionStatus === 'ready') {
          setSetupStatus('completed');
        }
        return;
      }
      
      // Fallback to checking gan-models bucket
      const { data: files, error } = await supabase.storage
        .from('gan-models')
        .list('');
      
      if (error) {
        throw error;
      }
      
      // Check for .h5 files
      const modelFiles = files.filter(file => file.name.endsWith('.h5'));
      
      if (modelFiles.length > 0) {
        console.log('Found model files in gan-models bucket:', modelFiles);
        setModelStatus('ready');
        
        if (edgeFunctionStatus === 'ready') {
          setSetupStatus('completed');
        }
      } else {
        console.warn('No .h5 model files found in either bucket');
        setModelStatus('error');
      }
    } catch (error) {
      console.error('Error checking model files:', error);
      setModelStatus('error');
    }
  };
  
  const checkEdgeFunctionStatus = async () => {
    try {
      const isActive = await checkGanFunction();
      
      if (isActive) {
        console.log('Edge function is working');
        setEdgeFunctionStatus('ready');
        
        if (modelStatus === 'ready') {
          setSetupStatus('completed');
        }
      } else {
        console.warn('Edge function check failed');
        setEdgeFunctionStatus('error');
      }
    } catch (error) {
      console.error('Error checking edge function:', error);
      setEdgeFunctionStatus('error');
    }
  };

  const checkStatus = () => {
    setIsLoading(true);
    
    // Re-check model files and edge function
    Promise.all([
      checkModelFilesExist(),
      checkEdgeFunctionStatus()
    ]).finally(() => {
      setIsLoading(false);
      
      if (modelStatus === 'ready' && edgeFunctionStatus === 'ready') {
        setSetupStatus('completed');
        toast({
          title: "Setup Complete",
          description: "The GAN model and edge function are ready to use!",
        });
      } else {
        setSetupStatus('in_progress');
        toast({
          title: "Setup Incomplete",
          description: "Some components are still not ready. Please check the status panel for details.",
        });
      }
    });
  };

  return {
    isLoading,
    setupStatus,
    modelStatus,
    edgeFunctionStatus,
    checkStatus
  };
};
