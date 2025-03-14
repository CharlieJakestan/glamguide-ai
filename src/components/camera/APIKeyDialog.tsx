
import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setApiKey, getApiKey } from '@/services/speechService';
import { Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface APIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const APIKeyDialog: React.FC<APIKeyDialogProps> = ({ open, onOpenChange }) => {
  const [apiKey, setStateApiKey] = useState<string>(getApiKey() || '');
  const { toast } = useToast();
  
  // Initialize with the ElevenLabs API key if not already set
  useEffect(() => {
    const savedKey = getApiKey();
    if (!savedKey) {
      // This is the permanent API key to avoid asking repeatedly
      const defaultKey = 'sk_0dfcb07ba1e4d72443fcb5385899c03e9106d3d27ddaadc2';
      setApiKey(defaultKey);
      setStateApiKey(defaultKey);
      
      toast({
        title: "API Key Auto-configured",
        description: "Voice guidance has been automatically enabled with the ElevenLabs API key.",
        variant: "default",
      });
      
      // Close the dialog if it was opened to get an API key
      onOpenChange(false);
    }
  }, [toast, onOpenChange]);
  
  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter a valid API key to enable voice guidance.",
        variant: "destructive",
      });
      return;
    }
    
    setApiKey(apiKey.trim());
    
    toast({
      title: "API Key Saved",
      description: "Voice guidance is now available. Toggle it on in the AI Guidance panel.",
      variant: "default",
    });
    
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Guidance Settings</DialogTitle>
          <DialogDescription>
            Voice guidance is already configured and ready to use. You can adjust settings below if needed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 py-4">
          <Key className="h-5 w-5 text-gray-500" />
          <Input
            type="password"
            placeholder="ElevenLabs API key (already configured)"
            value={apiKey}
            onChange={(e) => setStateApiKey(e.target.value)}
            className="flex-1"
          />
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default APIKeyDialog;
