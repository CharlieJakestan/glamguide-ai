
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Upload, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const PdfUploader: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [processMessage, setProcessMessage] = useState('');
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.type !== 'application/pdf') {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please upload a PDF file.',
        });
        return;
      }

      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload a PDF file smaller than 10MB.',
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadToStorage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `makeup-knowledge/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('makeup-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      return filePath;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const processPdf = async (filePath: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('process-pdf', {
        body: { filePath }
      });

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      return {
        success: false,
        error
      };
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setIsUploading(true);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      const filePath = await uploadToStorage(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!filePath) {
        throw new Error('Failed to upload file');
      }
      
      setIsUploading(false);
      setIsProcessing(true);
      
      const result = await processPdf(filePath);
      
      if (result.success) {
        setProcessStatus('success');
        setProcessMessage(`Successfully processed ${selectedFile.name}. The makeup knowledge has been extracted and is ready to use.`);
        
        toast({
          title: 'PDF Processed Successfully',
          description: 'The makeup knowledge has been extracted and is now available to the AI.',
        });
      } else {
        setProcessStatus('error');
        setProcessMessage('Failed to process the PDF. Please try again later.');
        
        toast({
          variant: 'destructive',
          title: 'Processing Failed',
          description: 'Could not extract knowledge from the PDF.',
        });
      }
    } catch (error) {
      console.error('Error in upload process:', error);
      setProcessStatus('error');
      setProcessMessage('An error occurred during upload or processing. Please try again.');
      
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-500" />
          Makeup Knowledge Upload
        </CardTitle>
        <CardDescription>
          Upload PDF documents containing makeup knowledge to enhance AI capabilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="pdf-upload"
              disabled={isUploading || isProcessing}
            />
            <label 
              htmlFor="pdf-upload" 
              className="cursor-pointer flex flex-col items-center justify-center py-4"
            >
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 font-medium">Click to select a PDF file</p>
              <p className="text-xs text-gray-400 mt-1">Max size: 10MB</p>
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-700 truncate flex-1">
                {selectedFile.name}
              </span>
              <span className="text-xs text-gray-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)}MB
              </span>
            </div>
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          {isProcessing && (
            <div className="flex items-center justify-center py-2">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-purple-700">Processing PDF content...</span>
            </div>
          )}
          
          {processStatus === 'success' && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 text-sm">
                {processMessage}
              </AlertDescription>
            </Alert>
          )}
          
          {processStatus === 'error' && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 text-sm">
                {processMessage}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleUpload} 
          className="w-full"
          disabled={!selectedFile || isUploading || isProcessing}
        >
          {isUploading ? 'Uploading...' : isProcessing ? 'Processing...' : 'Upload and Process PDF'}
        </Button>
      </CardFooter>
    </Card>
  );
};
