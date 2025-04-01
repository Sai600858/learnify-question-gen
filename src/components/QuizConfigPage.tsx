
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useQuiz } from '@/context/QuizContext';
import { generateQuestions } from '@/lib/quizGenerator';
import { useToast } from '@/components/ui/use-toast';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const QuizConfigPage: React.FC = () => {
  const { 
    name, 
    questionCount, 
    setQuestionCount, 
    fileContent, 
    file, 
    setCurrentStep, 
    setQuestions,
    setIsLoading,
    isLoading,
    questionType,
    setQuestionType,
    timeLimit,
    setTimeLimit,
    setTimeRemaining
  } = useQuiz();
  const { toast } = useToast();

  const handleGenerateQuiz = async () => {
    setIsLoading(true);
    
    try {
      toast({
        title: "Generating questions",
        description: "Our AI is analyzing your document...",
      });
      
      // Generate questions based on file content
      const generatedQuestions = await generateQuestions(fileContent, questionCount, questionType);
      setQuestions(generatedQuestions);
      
      // Set time remaining in seconds
      setTimeRemaining(timeLimit * 60);
      
      // Move to quiz screen
      setCurrentStep(3);
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        variant: "destructive",
        title: "Failed to generate quiz",
        description: "Please try again or use a different document",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md responsive-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold responsive-header">
            Configure Your Quiz
          </CardTitle>
          <CardDescription>
            Customize your quiz settings
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="question-count" className="text-sm font-medium">
                  Number of Questions
                </label>
                <span className="text-xl font-medium text-primary">
                  {questionCount}
                </span>
              </div>
              
              <Slider
                id="question-count"
                min={3}
                max={20}
                step={1}
                value={[questionCount]}
                onValueChange={(value) => setQuestionCount(value[0])}
                className="py-4"
              />
              
              <p className="text-sm text-muted-foreground">
                We'll generate {questionCount} questions from 
                <span className="font-medium text-foreground"> {file?.name}</span>
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Question Type</Label>
              <RadioGroup 
                value={questionType} 
                onValueChange={(value) => setQuestionType(value as 'mcq' | 'truefalse' | 'multiselect')}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mcq" id="mcq" />
                  <Label htmlFor="mcq">Multiple Choice Questions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multiselect" id="multiselect" />
                  <Label htmlFor="multiselect">Multi-Select Questions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="truefalse" id="truefalse" />
                  <Label htmlFor="truefalse">True/False Questions</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="time-limit" className="text-sm font-medium">
                  Time Limit (minutes)
                </label>
                <span className="text-xl font-medium text-primary">
                  {timeLimit}
                </span>
              </div>
              
              <Slider
                id="time-limit"
                min={1}
                max={30}
                step={1}
                value={[timeLimit]}
                onValueChange={(value) => setTimeLimit(value[0])}
                className="py-4"
              />
              
              <p className="text-sm text-muted-foreground">
                You'll have {timeLimit} minute{timeLimit !== 1 ? 's' : ''} to complete the quiz
              </p>
            </div>
          </div>
          
          <div className="bg-secondary rounded-lg p-4">
            <h3 className="font-medium mb-2">Ready to start your quiz?</h3>
            <p className="text-sm text-muted-foreground">
              Once generated, you'll be able to answer questions and see your score.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            onClick={handleGenerateQuiz} 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Quiz'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(1)}
            className="w-full"
            disabled={isLoading}
          >
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizConfigPage;
