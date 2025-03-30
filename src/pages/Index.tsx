
import React from 'react';
import { QuizProvider } from '@/context/QuizContext';
import WelcomePage from '@/components/WelcomePage';
import FileUploadPage from '@/components/FileUploadPage';
import QuizConfigPage from '@/components/QuizConfigPage';
import QuizPage from '@/components/QuizPage';
import ResultsPage from '@/components/ResultsPage';
import { useQuiz } from '@/context/QuizContext';

// Wrapper component that decides which step to show
const QuizApp: React.FC = () => {
  const { currentStep } = useQuiz();
  
  // Render the appropriate component based on the current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomePage />;
      case 1:
        return <FileUploadPage />;
      case 2:
        return <QuizConfigPage />;
      case 3:
        return <QuizPage />;
      case 4:
        return <ResultsPage />;
      default:
        return <WelcomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-background responsive-container">
      <header className="container mx-auto py-6 flex items-center justify-center">
        <h1 className="text-2xl font-bold text-primary">Learnify Quiz Generator</h1>
      </header>
      
      <main className="container mx-auto">
        {renderStep()}
      </main>
      
      <footer className="container mx-auto py-6 text-center text-sm text-muted-foreground">
        <p>© 2025 Learnify Quiz Generator. All rights reserved.</p>
      </footer>
    </div>
  );
};

// Main index component with provider
const Index: React.FC = () => {
  return (
    <QuizProvider>
      <QuizApp />
    </QuizProvider>
  );
};

export default Index;
