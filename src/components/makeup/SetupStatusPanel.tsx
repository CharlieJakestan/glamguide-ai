
import React from 'react';
import { Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SetupStatusPanelProps {
  modelStatus: 'checking' | 'ready' | 'error';
  edgeFunctionStatus: 'checking' | 'ready' | 'error';
  setupStatus: 'not_started' | 'in_progress' | 'completed';
  isLoading: boolean;
  onCheckStatus: () => void;
}

const SetupStatusPanel: React.FC<SetupStatusPanelProps> = ({
  modelStatus,
  edgeFunctionStatus,
  setupStatus,
  isLoading,
  onCheckStatus
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
      <Collapsible>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium mb-2 text-gray-700">System Status</h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {setupStatus === 'completed' ? 'All Systems Ready' : 'View Details'}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <div className="space-y-3 mt-2">
            {/* Model Status */}
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                {modelStatus === 'checking' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                ) : modelStatus === 'ready' ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  GAN Model: {' '}
                  {modelStatus === 'checking' ? 'Checking...' : 
                   modelStatus === 'ready' ? 'Ready' : 'Error'}
                </p>
                
                <p className="text-sm text-gray-500 mt-1">
                  {modelStatus === 'checking' 
                    ? 'Checking if model files exist in Supabase storage...'
                    : modelStatus === 'ready' 
                    ? 'Model files found in Supabase storage buckets.'
                    : 'Model files not found or error accessing storage.'}
                </p>
              </div>
            </div>
            
            {/* Edge Function Status */}
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                {edgeFunctionStatus === 'checking' ? (
                  <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                ) : edgeFunctionStatus === 'ready' ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  Edge Function: {' '}
                  {edgeFunctionStatus === 'checking' ? 'Checking...' : 
                   edgeFunctionStatus === 'ready' ? 'Ready' : 'Error'}
                </p>
                
                <p className="text-sm text-gray-500 mt-1">
                  {edgeFunctionStatus === 'checking' 
                    ? 'Checking if edge function is deployed and accessible...'
                    : edgeFunctionStatus === 'ready' 
                    ? 'Edge function is deployed and responding correctly.'
                    : 'Edge function not deployed or error calling the function.'}
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <div className="mt-4 flex justify-center">
        <Button 
          onClick={onCheckStatus}
          variant="outline"
          size="sm"
          className="border-pink-400 text-pink-500 hover:bg-pink-50"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Status
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SetupStatusPanel;
