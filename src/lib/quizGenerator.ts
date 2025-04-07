import { Question, QuestionType } from '@/context/QuizContext';

// Function to read file content
export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file content'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    if (file.type === 'application/pdf') {
      // For PDF files, we would need a PDF parsing library
      // This is a simplified version that just reads the raw data
      reader.readAsText(file);
    } else {
      // For text files
      reader.readAsText(file);
    }
  });
};

// Function to generate quiz questions from content
export const generateQuestions = async (
  content: string, 
  count: number,
  type: QuestionType
): Promise<Question[]> => {
  // In a real app, this would call an AI API to generate questions
  // For now, we'll simulate with some sample questions
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const questions: Question[] = [];
  
  // Generate sample questions based on type
  for (let i = 0; i < count; i++) {
    if (type === 'mcq') {
      questions.push({
        id: i,
        question: `Sample multiple choice question ${i + 1} about the content?`,
        options: [
          `Option A for question ${i + 1}`,
          `Option B for question ${i + 1}`,
          `Option C for question ${i + 1}`,
          `Option D for question ${i + 1}`
        ],
        correctAnswer: `Option ${String.fromCharCode(65 + (i % 4))} for question ${i + 1}`,
        type: 'mcq'
      });
    } else {
      questions.push({
        id: i,
        question: `Sample true/false statement ${i + 1} about the content.`,
        options: ['True', 'False'],
        correctAnswer: i % 2 === 0 ? 'True' : 'False',
        type: 'truefalse'
      });
    }
  }
  
  return questions;
};

// Function to calculate score
export const calculateScore = (
  questions: Question[], 
  answers: Record<number, string>
): number => {
  if (questions.length === 0) return 0;
  
  let correctCount = 0;
  
  questions.forEach(question => {
    if (answers[question.id] === question.correctAnswer) {
      correctCount++;
    }
  });
  
  return Math.round((correctCount / questions.length) * 100);
};

// Function to generate a text report of quiz results
export const generateResultReport = (
  name: string,
  score: number,
  questions: Question[],
  answers: Record<number, string>
): string => {
  let report = `QUIZ RESULTS FOR: ${name}\n`;
  report += `SCORE: ${score}%\n`;
  report += `DATE: ${new Date().toLocaleDateString()}\n\n`;
  
  report += `QUESTIONS AND ANSWERS:\n`;
  questions.forEach((question, index) => {
    report += `\n${index + 1}. ${question.question}\n`;
    report += `Your answer: ${answers[question.id] || 'Not answered'}\n`;
    report += `Correct answer: ${question.correctAnswer}\n`;
    report += `Result: ${answers[question.id] === question.correctAnswer ? 'Correct' : 'Incorrect'}\n`;
  });
  
  report += `\n\nThank you for using Learnify Quiz Generator!`;
  
  return report;
};
