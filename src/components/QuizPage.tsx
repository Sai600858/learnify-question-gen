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
import { Checkbox } from "@/components/ui/checkbox";

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
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const { toast } = useToast();
  
  const totalQuestions = questions.length;
  const question = questions[currentQuestion];

  useEffect(() => {
    if (question) {
      const currentAnswer = answers[question.id];
      if (currentAnswer) {
        if (Array.isArray(currentAnswer)) {
          setSelectedOptions(currentAnswer);
        } else {
          setSelectedOptions([currentAnswer]);
        }
      } else {
        setSelectedOptions([]);
      }
    }
  }, [currentQuestion, question, answers]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = timeRemaining;
      
      if (currentTime <= 1) {
        clearInterval(timer);
        finishQuiz();
        setTimeRemaining(0);
      } else {
        setTimeRemaining(currentTime - 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const finishQuiz = () => {
    const finalScore = calculateScore(questions, answers);
    setScore(finalScore);
    
    toast({
      title: "Quiz completed!",
      description: timeRemaining <= 0 
        ? "Time's up! Your answers have been submitted." 
        : `You've answered all ${totalQuestions} questions.`,
    });
    
    setCurrentStep(4);
  };

  const handleCheckboxChange = (option: string) => {
    let newSelectedOptions: string[];
    
    if (selectedOptions.includes(option)) {
      newSelectedOptions = selectedOptions.filter(item => item !== option);
    } else {
      newSelectedOptions = [...selectedOptions, option];
    }
    
    setSelectedOptions(newSelectedOptions);
    
    if (question.multipleAllowed) {
      setAnswers({
        ...answers,
        [question.id]: newSelectedOptions
      });
    } else {
      setAnswers({
        ...answers,
        [question.id]: option
      });
    }
  };

  const handleRadioChange = (value: string) => {
    setSelectedOptions([value]);
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
  const currentAnswer = answers[question?.id];
  const hasAnswer = Array.isArray(currentAnswer) 
    ? currentAnswer.length > 0 
    : Boolean(currentAnswer);

  const getTimeColor = () => {
    if (timeRemaining < 60) return "text-destructive";
    if (timeRemaining < 180) return "text-amber-500";
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
          
          {question.type === 'mcq' && question.multipleAllowed ? (
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`option-${index}`}
                    checked={selectedOptions.includes(option)}
                    onCheckedChange={() => handleCheckboxChange(option)}
                  />
                  <Label 
                    htmlFor={`option-${index}`} 
                    className="flex-1 py-2 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
              {question.multipleAllowed && (
                <p className="text-sm text-muted-foreground italic mt-2">
                  This question allows multiple correct answers. Select all that apply.
                </p>
              )}
            </div>
          ) : question.type === 'mcq' ? (
            <RadioGroup 
              value={Array.isArray(currentAnswer) ? currentAnswer[0] : (currentAnswer || '')}
              onValueChange={handleRadioChange}
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
              value={Array.isArray(currentAnswer) ? currentAnswer[0] : (currentAnswer || '')}
              onValueChange={handleRadioChange}
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
            disabled={!hasAnswer}
          >
            {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizPage;
