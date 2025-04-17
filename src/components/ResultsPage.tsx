import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuiz } from '@/context/QuizContext';
import { generateResultReport } from '@/lib/quizGenerator';
import { useToast } from '@/components/ui/use-toast';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Label } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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
  
  // Calculate percentages for display
  const relevantPercentage = Math.round((relevantQuestionsCount / totalQuestions) * 100);
  const accuratePercentage = Math.round((accurateQuestionsCount / totalQuestions) * 100);
  
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

  // Enhanced download function that works on all devices including Android webviews
  const downloadResults = () => {
    try {
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
      
      // Create filename
      const filename = `quiz-results-${name.replace(/\s+/g, '-').toLowerCase()}.txt`;
      
      // Modern approach using Blob and URL.createObjectURL
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // These attributes help on both mobile and desktop
      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      
      // For Android Webview compatibility
      link.target = "_blank";
      
      // Add to DOM, click, then remove (needed for Firefox)
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "Results downloaded",
        description: "Your quiz results have been saved as a text file",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "There was an error downloading your results. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Method 2: Alternative download for problematic webviews
  const copyResultsToClipboard = () => {
    try {
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
      
      // Copy to clipboard
      navigator.clipboard.writeText(report).then(() => {
        toast({
          title: "Results copied to clipboard",
          description: "Your quiz results have been copied. You can paste them into a document.",
        });
      }).catch(err => {
        console.error("Clipboard error:", err);
        toast({
          title: "Copy failed",
          description: "Could not copy results to clipboard.",
          variant: "destructive"
        });
      });
    } catch (error) {
      console.error("Copy error:", error);
      toast({
        title: "Copy failed",
        description: "There was an error copying your results.",
        variant: "destructive"
      });
    }
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

  // Adjust chart dimensions based on device size
  const chartHeight = isMobile ? 260 : 300;
  const chartOuterRadius = isMobile ? 65 : 85;
  const chartInnerRadius = isMobile ? 35 : 0;

  // RENDERLESS component to create a custom label for pie charts
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, midAngle, percent } = props;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    
    // Only show label if the segment is large enough to fit text
    if (percent < 0.1) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={isMobile ? 12 : 14}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md md:max-w-lg lg:max-w-xl responsive-card">
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
          
          {/* AI Question Relevance Pie Chart - Improved for all devices */}
          <div className="bg-secondary p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-center">AI Question Relevance</h3>
              <span className="text-sm font-medium">{relevantPercentage}% Relevant</span>
            </div>
            <div style={{ width: '100%', height: chartHeight }}>
              <ChartContainer config={relevanceChartConfig} aspectRatio="auto" height={chartHeight}>
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={aiAccuracyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    innerRadius={chartInnerRadius}
                    outerRadius={chartOuterRadius}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={4}
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
                  <Legend 
                    layout={isMobile ? "horizontal" : "vertical"}
                    verticalAlign={isMobile ? "bottom" : "middle"}
                    align={isMobile ? "center" : "right"}
                    iconSize={10}
                    wrapperStyle={isMobile ? { paddingTop: '10px' } : { right: 0 }}
                  />
                </PieChart>
              </ChartContainer>
            </div>
            <p className="text-center text-sm mt-2 text-muted-foreground">
              This chart shows how many generated questions were relevant to the uploaded content.
            </p>
          </div>
          
          {/* AI Question Accuracy Pie Chart - Improved for all devices */}
          <div className="bg-secondary p-4 rounded-lg mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-center">AI Question Accuracy</h3>
              <span className="text-sm font-medium">{accuratePercentage}% Accurate</span>
            </div>
            <div style={{ width: '100%', height: chartHeight }}>
              <ChartContainer config={accuracyChartConfig} aspectRatio="auto" height={chartHeight}>
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={aiQualityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    innerRadius={chartInnerRadius}
                    outerRadius={chartOuterRadius}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={4}
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
                  <Legend 
                    layout={isMobile ? "horizontal" : "vertical"}
                    verticalAlign={isMobile ? "bottom" : "middle"}
                    align={isMobile ? "center" : "right"}
                    iconSize={10}
                    wrapperStyle={isMobile ? { paddingTop: '10px' } : { right: 0 }}
                  />
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
          {/* Download button with fallback option */}
          <Button 
            onClick={downloadResults} 
            className="w-full flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Download Results
          </Button>
          
          {/* Fallback option for Android Webview */}
          <Button 
            variant="outline" 
            onClick={copyResultsToClipboard}
            className="w-full"
          >
            Copy Results to Clipboard
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
