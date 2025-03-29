
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface QuizContextType {
  name: string;
  setName: (name: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  fileContent: string;
  setFileContent: (content: string) => void;
  questionCount: number;
  setQuestionCount: (count: number) => void;
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  answers: Record<number, string>;
  setAnswers: (answers: Record<number, string>) => void;
  score: number;
  setScore: (score: number) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <QuizContext.Provider value={{
      name, setName,
      file, setFile,
      fileContent, setFileContent,
      questionCount, setQuestionCount,
      questions, setQuestions,
      currentStep, setCurrentStep,
      answers, setAnswers,
      score, setScore,
      isLoading, setIsLoading
    }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
