import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuiz } from '@/context/QuizContext';
import { generateResultReport } from '@/lib/quizGenerator';
import { useToast } from '@/components/ui/use-toast';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from 'recharts';

const ResultsPage: React.FC = () => {
  const { 
    name, 
    score, 
    questions, 
    answers, 
    setCurrentStep 
  } = useQuiz();
  const { toast } = useToast();
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);

  const correctAnswers = questions.filter(q => {
    const userAnswer = answers[q.id];
    const correctAnswer = q.correctAnswer;
    
    if (q.type === 'multiselect') {
      const userArray = userAnswer as string[] || [];
      const correctArray = correctAnswer as string[];
      
      if (userArray.length !== correctArray.length) return false;
      
      return correctArray.every(opt => userArray.includes(opt)) && 
             userArray.every(opt => correctArray.includes(opt));
    }
    
    return userAnswer === correctAnswer;
  }).length;
  
  const totalQuestions = questions.length;
  const incorrectAnswers = totalQuestions - correctAnswers;
  
  const calculateBLEUScore = () => {
    let matchCount = 0;
    let totalCount = 0;
    
    questions.forEach(q => {
      const userAnswer = answers[q.id];
      
      if (q.type === 'multiselect') {
        const userArray = userAnswer as string[] || [];
        const correctArray = q.correctAnswer as string[];
        
        correctArray.forEach(opt => {
          totalCount++;
          if (userArray.includes(opt)) matchCount++;
        });
        
        userArray.forEach(opt => {
          if (!correctArray.includes(opt)) matchCount--;
        });
      } else {
        totalCount++;
        if (userAnswer === q.correctAnswer) matchCount++;
      }
    });
    
    return Math.max(0, Math.round((matchCount / totalCount) * 100));
  };
  
  const bleuScore = calculateBLEUScore();
  
  const chartData = [
    { name: 'Correct', value: correctAnswers, color: '#10b981' },
    { name: 'Incorrect', value: incorrectAnswers, color: '#ef4444' }
  ];
  
  const calculateReferenceScore = () => {
    let totalPoints = 0;
    let earnedPoints = 0;
    
    questions.forEach(q => {
      const userAnswer = answers[q.id];
      
      if (q.type === 'multiselect') {
        const userArray = userAnswer as string[] || [];
        const correctArray = q.correctAnswer as string[];
        
        const pointPerOption = 1 / correctArray.length;
        
        correctArray.forEach(opt => {
          totalPoints += pointPerOption;
          if (userArray.includes(opt)) earnedPoints += pointPerOption;
        });
        
        let questionPoints = 0;
        userArray.forEach(opt => {
          if (!correctArray.includes(opt)) questionPoints -= pointPerOption;
        });
        
        earnedPoints += Math.max(0, questionPoints);
      } else {
        totalPoints += 1;
        if (userAnswer === q.correctAnswer) earnedPoints += 1;
      }
    });
    
    return Math.round((earnedPoints / totalPoints) * 100);
  };
  
  const referenceScore = calculateReferenceScore();

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getFeedback = () => {
    if (score >= 90) return "Excellent! You have a great understanding of the material.";
    if (score >= 80) return "Great job! You know the material well.";
    if (score >= 70) return "Good work! You have a solid grasp of most concepts.";
    if (score >= 60) return "Not bad. You're on the right track.";
    if (score >= 50) return "You passed, but there's room for improvement.";
    return "You might need to review the material again.";
  };

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

  const startNewQuiz = () => {
    setCurrentStep(1); // Go back to file upload page
  };

  const toggleQuestionDetails = (questionId: number) => {
    if (expandedQuestions.includes(questionId)) {
      setExpandedQuestions(expandedQuestions.filter(id => id !== questionId));
    } else {
      setExpandedQuestions([...expandedQuestions, questionId]);
    }
  };

  const isAnswerCorrect = (question: any, index: number) => {
    const userAnswer = answers[question.id];
    const correctAnswer = question.correctAnswer;
    
    if (question.type === 'multiselect') {
      const userAnswers = userAnswer as string[] || [];
      const correctAnswers = correctAnswer as string[];
      
      const option = question.options[index];
      const isCorrectOption = correctAnswers.includes(option);
      const isSelected = userAnswers.includes(option);
      
      return (isSelected && isCorrectOption) || (!isSelected && !isCorrectOption);
    }
    
    return userAnswer === correctAnswer;
  };

  const wasOptionSelected = (question: any, option: string) => {
    const userAnswer = answers[question.id];
    
    if (question.type === 'multiselect') {
      return Array.isArray(userAnswer) && userAnswer.includes(option);
    }
    
    return userAnswer === option;
  };

  const isCorrectOption = (question: any, option: string) => {
    if (question.type === 'multiselect') {
      return Array.isArray(question.correctAnswer) && question.correctAnswer.includes(option);
    }
    
    return question.correctAnswer === option;
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

          <div className="space-y-4">
            <h3 className="font-medium text-center">Performance Analysis</h3>
            <div className="h-72">
              <ChartContainer 
                config={{
                  correct: { color: '#10b981', label: 'Correct' },
                  incorrect: { color: '#ef4444', label: 'Incorrect' },
                }}
                className="h-full"
              >
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent />} 
                  />
                </PieChart>
                <ChartLegend content={<ChartLegendContent />} />
              </ChartContainer>
            </div>

            <div className="bg-secondary p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Bilingual Evaluation Score:</span>
                <span className={`font-bold ${bleuScore >= 70 ? 'text-green-500' : bleuScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {bleuScore}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Reference Score:</span>
                <span className={`font-bold ${referenceScore >= 70 ? 'text-green-500' : referenceScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {referenceScore}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Bilingual Evaluation Score measures the precision of your answers compared to the reference answers.
                Reference Score provides additional context by accounting for partial correctness.
              </p>
            </div>
          </div>
          
          <div className="bg-secondary p-4 rounded-lg space-y-3">
            <h3 className="font-medium">Question Breakdown</h3>
            <div className="space-y-3">
              {questions.map((question, index) => {
                const userAnswer = answers[question.id];
                let isCorrect = false;
                
                if (question.type === 'multiselect') {
                  const userArray = userAnswer as string[] || [];
                  const correctArray = question.correctAnswer as string[];
                  
                  isCorrect = correctArray.every(opt => userArray.includes(opt)) && 
                             userArray.every(opt => correctArray.includes(opt));
                } else {
                  isCorrect = userAnswer === question.correctAnswer;
                }
                
                const isExpanded = expandedQuestions.includes(question.id);
                
                return (
                  <div key={index} className="border border-muted rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleQuestionDetails(question.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`flex-none w-6 h-6 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {isCorrect ? '✓' : '✗'}
                        </span>
                        <span className="font-medium">Question {index + 1}</span>
                      </div>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                    
                    {isExpanded && (
                      <div className="p-3 border-t border-muted bg-background/50 text-sm">
                        <p className="font-medium mb-2">{question.question}</p>
                        <div className="space-y-1">
                          {question.options.map((option, optIndex) => {
                            const isSelected = wasOptionSelected(question, option);
                            const isCorrectOpt = isCorrectOption(question, option);
                            
                            let bgClass = 'bg-muted/30';
                            
                            if (question.type === 'multiselect') {
                              if (isSelected && isCorrectOpt) {
                                bgClass = 'bg-green-100 text-green-800';
                              } else if (isSelected && !isCorrectOpt) {
                                bgClass = 'bg-red-100 text-red-800';
                              } else if (!isSelected && isCorrectOpt) {
                                bgClass = 'bg-yellow-100 text-yellow-800';
                              }
                            } else {
                              if (option === question.correctAnswer) {
                                bgClass = 'bg-green-100 text-green-800';
                              } else if (option === userAnswer && option !== question.correctAnswer) {
                                bgClass = 'bg-red-100 text-red-800';
                              }
                            }
                            
                            return (
                              <div 
                                key={optIndex} 
                                className={`p-2 rounded ${bgClass}`}
                              >
                                {option}
                                {question.type === 'multiselect' && isCorrectOpt && !isSelected && 
                                  <span className="ml-2 font-medium text-green-600">(Correct option)</span>
                                }
                                {!question.type.includes('multi') && option === question.correctAnswer && option !== userAnswer && 
                                  <span className="ml-2 font-medium text-green-600">(Correct answer)</span>
                                }
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
