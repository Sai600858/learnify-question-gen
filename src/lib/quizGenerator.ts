
import { Question } from '../context/QuizContext';

// Simple text processing to extract potential questions
// In a real app, this would use a proper NLP/AI model
export const generateQuestions = async (text: string, count: number): Promise<Question[]> => {
  // This is a placeholder function that simulates AI-based question generation
  // In a real implementation, you would use a proper NLP model or API
  
  const sentences = text
    .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
    .split("|")
    .filter(sentence => sentence.length > 30 && sentence.length < 200)
    .filter(sentence => !sentence.includes("Figure") && !sentence.includes("Table"));
  
  const questions: Question[] = [];
  const usedSentences: Set<number> = new Set();
  
  // Generate a set number of questions or as many as possible from the text
  for (let i = 0; i < Math.min(count, Math.floor(sentences.length / 3)); i++) {
    // Choose a random sentence that hasn't been used yet
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * sentences.length);
    } while (usedSentences.has(randomIndex) || randomIndex + 2 >= sentences.length);
    
    usedSentences.add(randomIndex);
    
    const selectedSentence = sentences[randomIndex];
    
    // Create a simple question from the sentence
    const words = selectedSentence.split(' ').filter(word => word.length > 4);
    if (words.length < 3) continue;

    const keywordIndex = Math.floor(Math.random() * words.length);
    const keyword = words[keywordIndex].replace(/[^a-zA-Z0-9]/g, '');
    
    if (keyword.length < 4) continue;
    
    const question = selectedSentence.replace(new RegExp(`\\b${keyword}\\b`, 'i'), '_____');
    
    // Generate options (including the correct answer)
    const correctAnswer = keyword;
    const otherSentences = sentences.filter((_, idx) => idx !== randomIndex);
    const otherOptions: string[] = [];
    
    // Get 3 random words from other sentences to use as distractors
    for (let j = 0; j < 3; j++) {
      if (otherSentences.length === 0) break;
      
      const randomSentenceIndex = Math.floor(Math.random() * otherSentences.length);
      const randomSentence = otherSentences[randomSentenceIndex];
      otherSentences.splice(randomSentenceIndex, 1);
      
      const sentenceWords = randomSentence.split(' ')
        .filter(word => word.length > 3)
        .map(word => word.replace(/[^a-zA-Z0-9]/g, ''));
      
      if (sentenceWords.length === 0) {
        j--;
        continue;
      }
      
      const randomWord = sentenceWords[Math.floor(Math.random() * sentenceWords.length)];
      if (randomWord && randomWord !== correctAnswer && !otherOptions.includes(randomWord)) {
        otherOptions.push(randomWord);
      } else {
        j--;
      }
    }
    
    // Fill remaining options if needed
    while (otherOptions.length < 3) {
      const fillerOptions = ['term', 'concept', 'process', 'factor'];
      const option = fillerOptions[otherOptions.length];
      if (!otherOptions.includes(option) && option !== correctAnswer) {
        otherOptions.push(option);
      }
    }
    
    // Combine all options and shuffle them
    const allOptions = [correctAnswer, ...otherOptions];
    for (let j = allOptions.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
    }
    
    questions.push({
      id: i + 1,
      question: question,
      options: allOptions,
      correctAnswer: correctAnswer
    });
  }

  // If we couldn't generate enough questions, add some generic ones
  while (questions.length < count) {
    const id = questions.length + 1;
    questions.push({
      id,
      question: `What is a key concept from paragraph ${id} of the document?`,
      options: ["Concept A", "Concept B", "Concept C", "Concept D"],
      correctAnswer: "Concept A"
    });
  }
  
  // Simulate a delay to represent processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return questions;
};

// Helper function to read file content
export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type === 'application/pdf') {
      // In a real implementation, you would parse PDF content
      // For this example, we just simulate getting text from a PDF
      const reader = new FileReader();
      reader.onload = (e) => {
        // Simulate extracting text from PDF
        resolve(`This is simulated text from the PDF file "${file.name}". 
        Since we can't actually parse PDFs in this example, we're generating placeholder content.
        The PDF would normally contain several paragraphs of information that would be extracted.
        Each of these sentences could be used to generate quiz questions.
        Questions would be based on the key concepts found in this document.
        Learning assessments help reinforce knowledge from study materials.
        Students benefit from testing themselves on recently studied content.
        Spaced repetition is an effective way to improve long-term retention.
        The brain processes information more effectively when it's retrieved multiple times.
        Quiz generation tools can help educators create assessments more efficiently.
        Natural language processing can identify important concepts in text.
        Machine learning algorithms can generate questions from educational content.
        Assessment is a critical component of the learning process.`);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read PDF file'));
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Text file or other plain text format
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    }
  });
};

// Helper function to calculate score
export const calculateScore = (questions: Question[], answers: Record<number, string>): number => {
  let correctCount = 0;
  
  questions.forEach(question => {
    if (answers[question.id] === question.correctAnswer) {
      correctCount++;
    }
  });
  
  return Math.round((correctCount / questions.length) * 100);
};

// Generate a formatted result report for download
export const generateResultReport = (
  name: string, 
  score: number, 
  questions: Question[], 
  answers: Record<number, string>
): string => {
  const date = new Date().toLocaleDateString();
  
  let report = `Quiz Results for ${name}\n`;
  report += `Date: ${date}\n`;
  report += `Score: ${score}%\n\n`;
  report += `Questions and Answers:\n\n`;
  
  questions.forEach((question, index) => {
    report += `${index + 1}. ${question.question}\n`;
    report += `Your answer: ${answers[question.id] || 'Not answered'}\n`;
    report += `Correct answer: ${question.correctAnswer}\n`;
    report += `Result: ${(answers[question.id] === question.correctAnswer) ? 'Correct' : 'Incorrect'}\n\n`;
  });
  
  report += `Thank you for using Learnify Quiz Generator!`;
  
  return report;
};
