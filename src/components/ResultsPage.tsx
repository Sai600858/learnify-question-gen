
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuiz } from '@/context/QuizContext';
import { generateResultReport } from '@/lib/quizGenerator';
import { useToast } from '@/components/ui/use-toast';

const ResultsPage: React.FC = () => {
  const { 
    name, 
    score, 
    questions, 
    answers, 
    setCurrentStep 
  } = useQuiz();
  const { toast } = useToast();

  const correctAnswers = questions.filter(q => answers[q.id] === q.correctAnswer).length;
  const totalQuestions = questions.length;
  
  // Function to determine score color
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Function to get feedback based on score
  const getFeedback = () => {
    if (score >= 90) return 'Excellent! You have a great understanding of the material.';
    if (score >= 80) return 'Great job! You know the material well.';
    if (score >= 70) return 'Good work! You have a solid grasp of most concepts.';
    if (score >= 60) return 'Not bad. You're on the right track.';
    if (score >= 50) return 'You passed, but there's room for improvement.';
    return 'You might need to review the material again.';
  };

  // Download the results as a text file
  const downloadResults = () => {
    const report = generateResultReport(name, score, questions, answers);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `quiz-results-${name.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Results downloaded",
      description: "Your quiz results have been saved as a text file",
    });
  };

  // Start a new quiz with the same user
  const startNewQuiz = () => {
    setCurrentStep(1); // Go back to file upload page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md responsive-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold responsive-header">Your Quiz Results</CardTitle>
          <CardDescription>
            Great effort, {name}!
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="relative">
              <svg viewBox="0 0 100 100" className="w-32 h-32">
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth="10" 
                />
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth="10" 
                  strokeDasharray={`${score * 2.83} 283`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor()}`}>{score}%</span>
              </div>
            </div>
            
            <p className="text-center text-lg font-medium">
              {correctAnswers} of {totalQuestions} correct
            </p>
            
            <p className="text-center text-muted-foreground">
              {getFeedback()}
            </p>
          </div>
          
          <div className="bg-secondary p-4 rounded-lg space-y-3">
            <h3 className="font-medium">Question Breakdown</h3>
            <div className="space-y-2">
              {questions.map((question, index) => {
                const isCorrect = answers[question.id] === question.correctAnswer;
                return (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <span className={`flex-none w-6 h-6 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <span className="truncate">Question {index + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            onClick={downloadResults} 
            className="w-full"
          >
            Download Results
          </Button>
          <Button 
            variant="outline" 
            onClick={startNewQuiz}
            className="w-full"
          >
            Create Another Quiz
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResultsPage;
