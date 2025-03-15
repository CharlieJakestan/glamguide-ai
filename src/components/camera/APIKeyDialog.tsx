
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
  const [apiKey, setStateApiKey] = useState<string>('');
  const { toast } = useToast();
  
  // Initialize with the default ElevenLabs API key
  useEffect(() => {
    // This is the permanent API key
    const defaultKey = 'sk_0dfcb07ba1e4d72443fcb5385899c03e9106d3d27ddaadc2';
    setApiKey(defaultKey);
    setStateApiKey(defaultKey);
    
    // Close the dialog immediately - never show it
    onOpenChange(false);
  }, [onOpenChange]);
  
  const handleSave = () => {
    setApiKey(apiKey.trim());
    onOpenChange(false);
  };
  
  // This component should never be shown
  return (
    <Dialog open={false} onOpenChange={() => onOpenChange(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Guidance Settings</DialogTitle>
          <DialogDescription>
            Voice guidance is already configured and ready to use.
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
