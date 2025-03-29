
import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuiz } from '@/context/QuizContext';
import { readFileContent } from '@/lib/quizGenerator';
import { useToast } from '@/components/ui/use-toast';
import { Input } from "@/components/ui/input";

const FileUploadPage: React.FC = () => {
  const { name, setFile, setFileContent, setCurrentStep } = useQuiz();
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileError, setFileError] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const { toast } = useToast();
  const [isAndroidWebView, setIsAndroidWebView] = useState(false);

  // Detect if running in Android WebView
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = userAgent.indexOf("android") > -1;
    const isWebView = userAgent.indexOf("wv") > -1 || 
                      userAgent.indexOf("webview") > -1;
    
    setIsAndroidWebView(isAndroid && isWebView);
    
    // Log platform detection info for debugging
    console.log("User Agent:", userAgent);
    console.log("Is Android WebView:", isAndroid && isWebView);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const validTypes = ['text/plain', 'application/pdf'];
    
    // Some WebViews may not properly detect file types, so let's also check extensions
    const fileName = file.name.toLowerCase();
    const hasValidExtension = fileName.endsWith('.pdf') || fileName.endsWith('.txt');
    
    if (!validTypes.includes(file.type) && !hasValidExtension) {
      setFileError('Please upload a PDF or text file');
      return false;
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setFileError('File is too large (max 10MB)');
      return false;
    }

    setFileError('');
    return true;
  };

  const processFile = async (file: File) => {
    if (!validateFile(file)) return;

    setIsProcessing(true);
    try {
      const content = await readFileContent(file);
      setFile(file);
      setFileContent(content);
      setSelectedFileName(file.name);
      toast({
        title: "File processed successfully",
        description: `"${file.name}" is ready for quiz generation`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      setFileError('Failed to process file. Please try again.');
      toast({
        variant: "destructive",
        title: "Error processing file",
        description: "Please try a different file or format",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!selectedFileName) {
      setFileError('Please upload a file to continue');
      return;
    }
    setCurrentStep(2);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md responsive-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold responsive-header">Upload Study Material</CardTitle>
          <CardDescription>
            Hi {name}! Please upload a PDF or text file to generate quiz questions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isAndroidWebView ? (
            // Simplified interface for Android WebView
            <div className="flex flex-col space-y-4">
              <p className="text-center text-muted-foreground">
                Select a PDF or text file from your device
              </p>
              <Input
                id="file-input-android"
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileChange}
                className="block w-full"
              />
              {selectedFileName && (
                <div className="p-4 bg-primary/10 rounded-md text-center">
                  <p className="font-medium text-primary">{selectedFileName}</p>
                </div>
              )}
            </div>
          ) : (
            // Standard interface for desktop and other mobile browsers
            <div
              className={`file-upload-area flex flex-col items-center justify-center cursor-pointer ${
                dragActive ? 'active' : ''
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {selectedFileName ? (
                <div className="text-center">
                  <p className="font-medium text-primary">{selectedFileName}</p>
                  <p className="text-sm text-muted-foreground mt-2">Click or drag to replace</p>
                </div>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-muted-foreground mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="font-medium">Click to upload</p>
                  <p className="text-sm text-muted-foreground mt-1">or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF or Text files (max 10MB)</p>
                </>
              )}
            </div>
          )}
          
          {fileError && <p className="text-sm text-destructive text-center">{fileError}</p>}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={isProcessing || !selectedFileName}
          >
            {isProcessing ? 'Processing...' : 'Continue'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(0)}
            className="w-full"
          >
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FileUploadPage;
