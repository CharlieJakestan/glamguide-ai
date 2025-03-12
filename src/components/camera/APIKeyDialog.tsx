
import React, { useState } from 'react';
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
          <DialogTitle>Enter Eleven Labs API Key</DialogTitle>
          <DialogDescription>
            To enable AI voice guidance, please enter your Eleven Labs API key.
            You can get a key by signing up at{' '}
            <a 
              href="https://elevenlabs.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              elevenlabs.io
            </a>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 py-4">
          <Key className="h-5 w-5 text-gray-500" />
          <Input
            type="password"
            placeholder="Enter your API key"
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
            Save API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default APIKeyDialog;
