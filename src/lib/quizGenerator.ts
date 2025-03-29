
import { Question } from '../context/QuizContext';

// Enhanced question generation with NLP techniques
export const generateQuestions = async (text: string, count: number): Promise<Question[]> => {
  // Clean and prepare the text
  const cleanedText = text
    .replace(/(\r\n|\n|\r)/gm, " ") // Replace line breaks with spaces
    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
    .trim();
  
  // Split text into meaningful paragraphs
  const paragraphs = cleanedText
    .split(/(?<=\. )(?=[A-Z])/)
    .filter(p => p.length > 50 && p.length < 500) // Filter out very short or very long paragraphs
    .filter(p => 
      !p.includes("Figure") && 
      !p.includes("Table") && 
      !p.includes("Reference") &&
      !/^\d+\./.test(p) // Exclude numbered lists
    );
  
  // Extract key sentences that contain important information
  const informativeSentences = paragraphs.flatMap(paragraph => {
    // Split paragraph into sentences
    return paragraph
      .split(/(?<=\. )(?=[A-Z])/)
      .filter(sentence => 
        sentence.length > 30 && 
        sentence.length < 200 &&
        // Prioritize sentences with informative patterns
        (
          sentence.includes(" is ") || 
          sentence.includes(" are ") || 
          sentence.includes(" means ") ||
          sentence.includes(" defined as ") ||
          sentence.includes(" consists of ") ||
          sentence.includes(" known as ") ||
          /\b(important|key|significant|main|primary|critical)\b/i.test(sentence)
        )
      );
  });

  // If we don't have enough informative sentences, fall back to regular sentences
  const sentences = informativeSentences.length >= count * 2 
    ? informativeSentences 
    : paragraphs.flatMap(p => p.split(/(?<=\. )(?=[A-Z])/))
        .filter(s => s.length > 30 && s.length < 200);
  
  // Shuffle sentences to get variety
  const shuffledSentences = [...sentences].sort(() => Math.random() - 0.5);
  
  const questions: Question[] = [];
  const usedSentences: Set<string> = new Set();
  
  // Generate multiple question types
  for (let i = 0; i < Math.min(count, Math.floor(shuffledSentences.length / 2)); i++) {
    // Pick a sentence that hasn't been used
    let selectedSentence = "";
    for (const sentence of shuffledSentences) {
      if (!usedSentences.has(sentence)) {
        selectedSentence = sentence;
        usedSentences.add(sentence);
        break;
      }
    }
    
    if (!selectedSentence) continue;
    
    // Extract meaningful words (nouns, verbs, adjectives) as potential keywords
    const words = selectedSentence.split(' ')
      .map(w => w.trim().replace(/[^a-zA-Z0-9]/g, ''))
      .filter(w => w.length > 4) // Focus on longer words which tend to be more meaningful
      .filter(w => !/^(these|those|there|their|about|would|should|could|which|where|when|what|this|that)$/i.test(w)); // Filter common words
    
    if (words.length < 3) continue;

    // Choose words that are likely to be domain-specific terms
    const potentialKeywords = words.filter(word => 
      // Words with capital letters are often proper nouns or important terms
      (word.charAt(0) === word.charAt(0).toUpperCase() && word.length > 5) || 
      // Longer words are often domain-specific
      word.length > 7
    );
    
    // If we can't find specialized terms, fall back to any sufficiently long words
    const keywordCandidates = potentialKeywords.length > 0 ? potentialKeywords : words.filter(w => w.length > 5);
    
    if (keywordCandidates.length === 0) continue;
    
    // Select a keyword
    const keywordIndex = Math.floor(Math.random() * keywordCandidates.length);
    const keyword = keywordCandidates[keywordIndex];
    
    // Create a fill-in-the-blank question
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    const question = selectedSentence.replace(regex, '_____');
    
    // If we couldn't create a question, skip
    if (question === selectedSentence) continue;
    
    // Generate options
    const correctAnswer = keyword;
    
    // Find other sentences to extract distractor options from
    const otherSentences = sentences.filter(s => s !== selectedSentence)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    
    // Extract potential distractor words from other sentences
    const distractorWords = otherSentences.flatMap(s => 
      s.split(' ')
        .map(w => w.trim().replace(/[^a-zA-Z0-9]/g, ''))
        .filter(w => 
          w.length > 4 && 
          w !== correctAnswer && 
          w.toLowerCase() !== correctAnswer.toLowerCase() &&
          // Try to match the part of speech (rough heuristic)
          (
            (correctAnswer.endsWith('ing') && w.endsWith('ing')) ||
            (correctAnswer.endsWith('ed') && w.endsWith('ed')) ||
            (correctAnswer.endsWith('s') && w.endsWith('s')) ||
            (correctAnswer.endsWith('ly') && w.endsWith('ly')) ||
            (correctAnswer.charAt(0) === correctAnswer.charAt(0).toUpperCase() && 
             w.charAt(0) === w.charAt(0).toUpperCase()) ||
            true // Fall back to any word if we can't match part of speech
          )
        )
    );
    
    // Get unique distractors
    const uniqueDistractors = [...new Set(distractorWords)];
    const shuffledDistractors = uniqueDistractors.sort(() => Math.random() - 0.5).slice(0, 3);
    
    // If we don't have enough distractors, generate some plausible ones
    while (shuffledDistractors.length < 3) {
      // Get words that are similar in length to the correct answer
      const similarLengthWords = words.filter(w => 
        Math.abs(w.length - correctAnswer.length) <= 2 && 
        w !== correctAnswer &&
        !shuffledDistractors.includes(w)
      );
      
      if (similarLengthWords.length > 0) {
        const randomWord = similarLengthWords[Math.floor(Math.random() * similarLengthWords.length)];
        if (!shuffledDistractors.includes(randomWord)) {
          shuffledDistractors.push(randomWord);
        }
      } else {
        // Fall back to generic options if necessary
        const fallbackOptions = ['concept', 'process', 'factor', 'element', 'system', 'method', 'theory'];
        for (const option of fallbackOptions) {
          if (shuffledDistractors.length >= 3) break;
          if (!shuffledDistractors.includes(option) && option !== correctAnswer) {
            shuffledDistractors.push(option);
          }
        }
      }
    }
    
    // Combine and shuffle options
    const allOptions = [correctAnswer, ...shuffledDistractors];
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

  // If we couldn't generate enough questions, add some more general ones
  if (questions.length < count) {
    // Extract the most frequent words as key concepts
    const wordFrequency: Record<string, number> = {};
    sentences.forEach(sentence => {
      sentence.split(' ')
        .map(w => w.trim().replace(/[^a-zA-Z0-9]/g, ''))
        .filter(w => w.length > 5)
        .forEach(word => {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        });
    });
    
    // Sort words by frequency
    const sortedWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(entry => entry[0]);
    
    // Generate concept questions
    for (let i = questions.length; i < count; i++) {
      const conceptIndex = i % sortedWords.length;
      const concept = sortedWords[conceptIndex];
      
      // Create options - other frequent words make good distractors
      const otherConcepts = sortedWords.filter(w => w !== concept).slice(0, 3);
      
      // All options
      const allOptions = [concept, ...otherConcepts];
      // Shuffle options
      for (let j = allOptions.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
      }
      
      questions.push({
        id: i + 1,
        question: `Which of the following concepts appears frequently in the document?`,
        options: allOptions,
        correctAnswer: concept
      });
    }
  }
  
  // Simulate a processing delay
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
