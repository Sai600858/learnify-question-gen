
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuiz } from '@/context/QuizContext';

const WelcomePage: React.FC = () => {
  const { name, setName, setCurrentStep } = useQuiz();
  const [nameError, setNameError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setNameError('Please enter your name');
      return;
    }
    
    setCurrentStep(1);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md responsive-card">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-primary responsive-header">
            Welcome to Learnify
          </CardTitle>
          <CardDescription className="text-lg">
            Create quizzes from your study materials
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                What's your name?
              </label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setNameError('');
                }}
                className="w-full"
                autoFocus
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </div>
          </form>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleSubmit} 
            className="w-full transition-all duration-300"
          >
            Let's Get Started
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WelcomePage;
