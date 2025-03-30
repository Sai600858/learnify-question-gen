
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useQuiz } from '@/context/QuizContext';
import { calculateScore } from '@/lib/quizGenerator';
import { useToast } from '@/components/ui/use-toast';
import { Timer, Clock } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

const QuizPage: React.FC = () => {
  const { 
    name, 
    questions, 
    setCurrentStep, 
    answers, 
    setAnswers,
    setScore,
    timeRemaining,
    setTimeRemaining
  } = useQuiz();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const { toast } = useToast();
  
  const totalQuestions = questions.length;
  const question = questions[currentQuestion];

  // Format time remaining as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        // If time's up, clear interval and move to results
        if (prev <= 1) {
          clearInterval(timer);
          // Time's up - calculate score and move to results
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const finishQuiz = () => {
    // Calculate final score
    const finalScore = calculateScore(questions, answers);
    setScore(finalScore);
    
    toast({
      title: "Quiz completed!",
      description: timeRemaining <= 0 
        ? "Time's up! Your answers have been submitted." 
        : `You've answered all ${totalQuestions} questions.`,
    });
    
    // Go to results page
    setCurrentStep(4);
  };

  const handleAnswer = (value: string) => {
    setAnswers({
      ...answers,
      [question.id]: value
    });
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const currentAnswer = answers[question?.id] || '';

  // Time warning colors
  const getTimeColor = () => {
    if (timeRemaining < 60) return "text-destructive"; // Less than 1 minute
    if (timeRemaining < 180) return "text-amber-500"; // Less than 3 minutes
    return "text-primary";
  };

  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p>No questions available. Please go back and configure your quiz.</p>
            <Button 
              onClick={() => setCurrentStep(2)} 
              className="mt-4"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md responsive-card">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Question {currentQuestion + 1} of {totalQuestions}</p>
            <div className={`flex items-center gap-1 ${getTimeColor()}`}>
              <Clock size={16} className="mr-1" />
              <span className="font-medium">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full mt-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
            />
          </div>
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">{name}'s Quiz</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <CardTitle className="text-xl font-medium responsive-header">
            {question.question}
          </CardTitle>
          
          {question.type === 'mcq' ? (
            <RadioGroup 
              value={currentAnswer} 
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label 
                    htmlFor={`option-${index}`} 
                    className="flex-1 py-2 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <RadioGroup 
              value={currentAnswer} 
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="True" id="true" />
                <Label htmlFor="true" className="flex-1 py-2 cursor-pointer">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="False" id="false" />
                <Label htmlFor="false" className="flex-1 py-2 cursor-pointer">False</Label>
              </div>
            </RadioGroup>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={!currentAnswer}
          >
            {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizPage;
