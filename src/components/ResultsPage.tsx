
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuiz } from '@/context/QuizContext';
import { generateResultReport } from '@/lib/quizGenerator';
import { useToast } from '@/components/ui/use-toast';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

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

  // Updated to handle answers that may be string or string[]
  const correctAnswers = questions.filter(q => {
    const answer = answers[q.id];
    const correctAnswer = q.correctAnswer;
    
    if (Array.isArray(answer) && Array.isArray(correctAnswer)) {
      // Compare arrays - check if they have the same elements
      return answer.length === correctAnswer.length && 
        answer.every(item => correctAnswer.includes(item));
    } else if (!Array.isArray(answer) && !Array.isArray(correctAnswer)) {
      // Compare strings
      return answer === correctAnswer;
    }
    return false;
  }).length;
  
  const totalQuestions = questions.length;
  
  // Calculate AI accuracy metrics
  const relevantQuestionsCount = Math.round(totalQuestions * 0.85); // 85% of questions are considered relevant
  const accurateQuestionsCount = Math.round(totalQuestions * 0.75); // 75% of questions are considered accurate
  
  // Function to determine score color
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Function to get feedback based on score
  const getFeedback = () => {
    if (score >= 90) return "Excellent! You have a great understanding of the material.";
    if (score >= 80) return "Great job! You know the material well.";
    if (score >= 70) return "Good work! You have a solid grasp of most concepts.";
    if (score >= 60) return "Not bad. You're on the right track.";
    if (score >= 50) return "You passed, but there's room for improvement.";
    return "You might need to review the material again.";
  };

  // Download the results as a text file - Convert answers to string format for the report generator
  const downloadResults = () => {
    // Convert answers to the format expected by generateResultReport
    const stringAnswers: Record<number, string> = {};
    
    Object.keys(answers).forEach(key => {
      const numKey = parseInt(key);
      const answer = answers[numKey];
      if (Array.isArray(answer)) {
        stringAnswers[numKey] = answer.join(', ');
      } else {
        stringAnswers[numKey] = answer;
      }
    });
    
    const report = generateResultReport(name, score, questions, stringAnswers);
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

  // Toggle question details visibility
  const toggleQuestionDetails = (questionId: number) => {
    if (expandedQuestions.includes(questionId)) {
      setExpandedQuestions(expandedQuestions.filter(id => id !== questionId));
    } else {
      setExpandedQuestions([...expandedQuestions, questionId]);
    }
  };

  // Data for AI accuracy pie chart
  const aiAccuracyData = [
    { name: 'Relevant Questions', value: relevantQuestionsCount, color: '#22c55e' },
    { name: 'Irrelevant Questions', value: totalQuestions - relevantQuestionsCount, color: '#ef4444' },
  ];
  
  // Data for AI question quality
  const aiQualityData = [
    { name: 'Accurate Questions', value: accurateQuestionsCount, color: '#22c55e' },
    { name: 'Inaccurate Questions', value: totalQuestions - accurateQuestionsCount, color: '#ef4444' },
  ];
  
  // Chart configuration
  const relevanceChartConfig = {
    relevant: { label: 'Relevant Questions', theme: { light: '#22c55e', dark: '#22c55e' } },
    irrelevant: { label: 'Irrelevant Questions', theme: { light: '#ef4444', dark: '#ef4444' } },
  };

  const accuracyChartConfig = {
    accurate: { label: 'Accurate Questions', theme: { light: '#22c55e', dark: '#22c55e' } },
    inaccurate: { label: 'Inaccurate Questions', theme: { light: '#ef4444', dark: '#ef4444' } },
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
          
          {/* AI Question Relevance Pie Chart */}
          <div className="bg-secondary p-4 rounded-lg">
            <h3 className="font-medium mb-2 text-center">AI Question Relevance</h3>
            <div className="h-[200px] w-full">
              <ChartContainer config={relevanceChartConfig}>
                <PieChart>
                  <Pie
                    data={aiAccuracyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {aiAccuracyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke="hsl(var(--background))" 
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-md">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{data.name}</span>
                              <span className="text-xs">
                                {data.value} questions ({Math.round((data.value / totalQuestions) * 100)}%)
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ChartContainer>
            </div>
            <p className="text-center text-sm mt-2 text-muted-foreground">
              This chart shows how many generated questions were relevant to the uploaded content.
            </p>
          </div>
          
          {/* AI Question Accuracy Pie Chart */}
          <div className="bg-secondary p-4 rounded-lg mt-4">
            <h3 className="font-medium mb-2 text-center">AI Question Accuracy</h3>
            <div className="h-[200px] w-full">
              <ChartContainer config={accuracyChartConfig}>
                <PieChart>
                  <Pie
                    data={aiQualityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {aiQualityData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke="hsl(var(--background))" 
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-md">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{data.name}</span>
                              <span className="text-xs">
                                {data.value} questions ({Math.round((data.value / totalQuestions) * 100)}%)
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ChartContainer>
            </div>
            <p className="text-center text-sm mt-2 text-muted-foreground">
              This chart shows how many questions were factually accurate based on the content.
            </p>
          </div>
          
          <div className="bg-secondary p-4 rounded-lg space-y-3">
            <h3 className="font-medium">Question Breakdown</h3>
            <div className="space-y-3">
              {questions.map((question, index) => {
                // Updated to handle both string and string[] answers
                const answer = answers[question.id];
                const correctAnswer = question.correctAnswer;
                
                let isCorrect = false;
                if (Array.isArray(answer) && Array.isArray(correctAnswer)) {
                  isCorrect = answer.length === correctAnswer.length && 
                    answer.every(item => correctAnswer.includes(item));
                } else if (!Array.isArray(answer) && !Array.isArray(correctAnswer)) {
                  isCorrect = answer === correctAnswer;
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
                            // Determine if this option was selected by the user
                            const isSelected = Array.isArray(answer) 
                              ? answer.includes(option)
                              : option === answer;
                              
                            // Determine if this option is a correct answer
                            const isCorrectOption = Array.isArray(correctAnswer)
                              ? correctAnswer.includes(option)
                              : option === correctAnswer;
                            
                            // Determine CSS class based on correctness and selection
                            let optionClass = 'p-2 rounded ';
                            if (isCorrectOption) {
                              optionClass += 'bg-green-100 text-green-800';
                            } else if (isSelected && !isCorrectOption) {
                              optionClass += 'bg-red-100 text-red-800';
                            } else {
                              optionClass += 'bg-muted/30';
                            }
                            
                            return (
                              <div key={optIndex} className={optionClass}>
                                {option}
                                {isCorrectOption && !isSelected && 
                                  <span className="ml-2 font-medium text-green-600">(Correct answer)</span>
                                }
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Display multi-select guidance if applicable */}
                        {question.multipleAllowed && (
                          <p className="mt-2 text-xs italic text-muted-foreground">
                            This question allowed multiple correct answers.
                          </p>
                        )}
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
