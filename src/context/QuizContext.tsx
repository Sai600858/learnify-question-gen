
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type QuestionType = 'mcq' | 'truefalse';

export interface QuizContextType {
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
  answers: Record<number, string | string[]>; // Updated to support both string and array of strings
  setAnswers: (answers: Record<number, string | string[]>) => void;
  score: number;
  setScore: (score: number) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  questionType: QuestionType;
  setQuestionType: (type: QuestionType) => void;
  timeLimit: number;
  setTimeLimit: (minutes: number) => void;
  timeRemaining: number;
  setTimeRemaining: (seconds: number) => void;
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string | string[]; // Updated to support multiple correct answers
  type: QuestionType;
  multipleAllowed?: boolean; // Added to indicate if multiple selections are allowed
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');
  const [timeLimit, setTimeLimit] = useState(5); // Default 5 minutes
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds

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
      isLoading, setIsLoading,
      questionType, setQuestionType,
      timeLimit, setTimeLimit,
      timeRemaining, setTimeRemaining
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
