
import React from 'react';
import { QuizProvider } from '@/context/QuizContext';
import WelcomePage from '@/components/WelcomePage';
import FileUploadPage from '@/components/FileUploadPage';
import QuizConfigPage from '@/components/QuizConfigPage';
import QuizPage from '@/components/QuizPage';
import ResultsPage from '@/components/ResultsPage';
import { useQuiz } from '@/context/QuizContext';
import { Button } from '@/components/ui/button';

// Pre-built LLM Quiz Questions
const llmQuizQuestions = [
  {
    id: 1,
    question: "What does the acronym 'LLM' stand for in AI technology?",
    options: ["Large Learning Machine", "Language Learning Model", "Large Language Model", "Logical Language Machine"],
    correctAnswer: "Large Language Model",
    type: "mcq"
  },
  {
    id: 2,
    question: "Large Language Models are primarily trained to:",
    options: ["Only translate between languages", "Predict the next word in a sequence", "Only generate computer code", "Create images from text"],
    correctAnswer: "Predict the next word in a sequence",
    type: "mcq"
  },
  {
    id: 3,
    question: "Which of the following is an application of Large Language Models?",
    options: ["Autonomous vehicle navigation", "Virtual assistants and chatbots", "Protein structure prediction", "Weather forecasting"],
    correctAnswer: "Virtual assistants and chatbots",
    type: "mcq"
  },
  {
    id: 4,
    question: "The training process of LLMs typically involves:",
    options: ["Supervised learning on small datasets", "Reinforcement learning only", "Self-supervised learning on massive text corpora", "Learning only from visual data"],
    correctAnswer: "Self-supervised learning on massive text corpora",
    type: "mcq"
  },
  {
    id: 5,
    question: "What is 'prompt engineering' in the context of LLMs?",
    options: ["Building faster computer hardware", "Designing effective instructions to get desired outputs from an LLM", "Creating new programming languages", "The process of training an LLM"],
    correctAnswer: "Designing effective instructions to get desired outputs from an LLM",
    type: "mcq"
  },
  {
    id: 6,
    question: "LLMs generate text by predicting the most likely next token based on previous tokens.",
    options: ["True", "False"],
    correctAnswer: "True",
    type: "truefalse"
  },
  {
    id: 7,
    question: "Which of these is an example of a Large Language Model?",
    options: ["Microsoft Excel", "Photoshop", "GPT-4", "Linux Operating System"],
    correctAnswer: "GPT-4",
    type: "mcq"
  },
  {
    id: 8,
    question: "How might LLMs be applied in education?",
    options: ["Replacing teachers entirely", "Generating personalized learning materials", "Grading physical handwriting only", "Managing school building facilities"],
    correctAnswer: "Generating personalized learning materials",
    type: "mcq"
  },
  {
    id: 9,
    question: "LLMs can understand the meaning of text in the same way humans do.",
    options: ["True", "False"],
    correctAnswer: "False",
    type: "truefalse"
  },
  {
    id: 10,
    question: "What is a limitation of current Large Language Models?",
    options: ["They can only process text in English", "They sometimes generate incorrect or misleading information", "They cannot be used on personal computers", "They can only generate short responses"],
    correctAnswer: "They sometimes generate incorrect or misleading information",
    type: "mcq"
  }
];

// Wrapper component that decides which step to show
const QuizApp: React.FC = () => {
  const { 
    currentStep, 
    setQuestions, 
    setCurrentStep, 
    setTimeRemaining,
    timeLimit
  } = useQuiz();
  
  // Function to start the LLM quiz
  const startLLMQuiz = () => {
    setQuestions(llmQuizQuestions);
    setTimeRemaining(timeLimit * 60);
    setCurrentStep(3); // Go directly to quiz page
  };
  
  // Render the appropriate component based on the current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <WelcomePage />
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={startLLMQuiz}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Take LLM Quiz Now
              </Button>
            </div>
          </>
        );
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
