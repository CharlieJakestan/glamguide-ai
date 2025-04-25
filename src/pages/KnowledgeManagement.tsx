
import React from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PdfUploader } from '@/components/pdf/PdfUploader';
import { BookOpen, Database, Settings } from 'lucide-react';

const KnowledgeManagement = () => {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Knowledge Management</h1>
            <p className="text-gray-500 mt-1">
              Upload and manage knowledge sources for your makeup AI assistant
            </p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configure AI
          </Button>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Upload Knowledge
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Manage Sources
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload PDF Knowledge</h2>
                <p className="text-gray-600 mb-4">
                  Upload PDF documents like "Essence of Makeup Level" to enhance your AI makeup assistant's knowledge.
                  The system will extract valuable information and make it available to your AI.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <p className="text-blue-700 text-sm">
                    <strong>Tip:</strong> For best results, upload PDFs with clear, structured content about makeup techniques,
                    color theory, face shapes, or product application guides.
                  </p>
                </div>
              </div>
              <PdfUploader />
            </div>
          </TabsContent>
          
          <TabsContent value="manage">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Knowledge Management</h3>
              <p className="text-gray-500 mb-4">
                This feature will allow you to view and manage uploaded knowledge sources.
                Coming soon in the next update.
              </p>
              <Button variant="outline" disabled>Manage Knowledge (Coming Soon)</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default KnowledgeManagement;
