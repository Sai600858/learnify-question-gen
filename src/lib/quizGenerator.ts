
import { Question, QuestionType } from '../context/QuizContext';

// Enhanced question generation with advanced NLP techniques
export const generateQuestions = async (
  text: string, 
  count: number, 
  type: QuestionType = 'mcq'
): Promise<Question[]> => {
  // Clean and prepare the text
  const cleanedText = text
    .replace(/(\r\n|\n|\r)/gm, " ") // Replace line breaks with spaces
    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
    .replace(/[^\w\s.,;:?!'"()[\]{}-]/g, "") // Remove special characters except punctuation
    .trim();
  
  // Split text into meaningful paragraphs
  const paragraphs = cleanedText
    .split(/(?<=\. )(?=[A-Z])/)
    .filter(p => p.length > 50 && p.length < 1000) // Filter out very short or very long paragraphs
    .filter(p => 
      !p.includes("Figure") && 
      !p.includes("Table") && 
      !p.includes("Reference") &&
      !/^\d+\./.test(p) // Exclude numbered lists
    );
  
  // Extract key sentences with important information using more advanced patterns
  const informativeSentences = paragraphs.flatMap(paragraph => {
    // Split paragraph into sentences
    return paragraph
      .split(/(?<=\. )(?=[A-Z])/)
      .filter(sentence => 
        sentence.length > 30 && 
        sentence.length < 250 &&
        // More comprehensive patterns for identifying informative sentences
        (
          // Definitional patterns
          sentence.includes(" is ") || 
          sentence.includes(" are ") || 
          sentence.includes(" means ") ||
          sentence.includes(" defined as ") ||
          sentence.includes(" consists of ") ||
          sentence.includes(" known as ") ||
          
          // Causal relationships
          sentence.includes(" because ") ||
          sentence.includes(" therefore ") ||
          sentence.includes(" thus ") ||
          sentence.includes(" consequently ") ||
          sentence.includes(" as a result ") ||
          
          // Comparative relationships
          sentence.includes(" compared to ") ||
          sentence.includes(" in contrast ") ||
          sentence.includes(" on the other hand ") ||
          sentence.includes(" whereas ") ||
          
          // Important concept indicators
          /\b(important|key|significant|main|primary|critical|essential|fundamental|crucial|major)\b/i.test(sentence) ||
          
          // Numerical information (often important)
          /\b\d+(\.\d+)?\s*(percent|%)\b/i.test(sentence) ||
          
          // Lists (often contain key points)
          /\b(first|second|third|finally|lastly)\b/i.test(sentence) ||
          
          // Domain-specific knowledge indicators
          /\b(according to|studies show|research indicates|evidence suggests)\b/i.test(sentence) ||
          
          // Analytical or conceptual statements
          /\b(analyze|evaluate|consider|explain|understand|interpret|apply)\b/i.test(sentence)
        )
      );
  });

  // If we don't have enough informative sentences, fall back to regular sentences
  const sentences = informativeSentences.length >= count * 2 
    ? informativeSentences 
    : paragraphs.flatMap(p => p.split(/(?<=\. )(?=[A-Z])/))
        .filter(s => s.length > 30 && s.length < 250);
  
  // Shuffle sentences to get variety
  const shuffledSentences = [...sentences].sort(() => Math.random() - 0.5);
  
  const questions: Question[] = [];
  const usedSentences: Set<string> = new Set();
  
  // Generate questions based on the type
  if (type === 'mcq') {
    // Allocate questions by cognitive level for balanced distribution
    const comprehensionCount = Math.ceil(count * 0.4); // 40% comprehension questions
    const applicationCount = Math.ceil(count * 0.3); // 30% application questions
    const analysisCount = Math.floor(count * 0.3); // 30% analysis questions
    
    // Generate comprehension questions
    questions.push(...generateComprehensionMCQs(shuffledSentences, usedSentences, comprehensionCount));
    
    // Generate application questions
    questions.push(...generateApplicationMCQs(shuffledSentences, usedSentences, applicationCount));
    
    // Generate analysis questions
    questions.push(...generateAnalysisMCQs(shuffledSentences, usedSentences, analysisCount));
  } else {
    // For true/false, generate a mix of question types
    questions.push(...generateTrueFalse(shuffledSentences, usedSentences, count));
  }
  
  // If we couldn't generate enough questions, add some higher-level conceptual questions
  if (questions.length < count) {
    questions.push(...generateConceptualQuestions(text, count - questions.length, type));
  }
  
  // Assign sequential IDs to questions
  questions.forEach((question, index) => {
    question.id = index + 1;
  });
  
  // Simulate a processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return questions;
};

// Function to generate comprehension-level MCQ questions
const generateComprehensionMCQs = (
  sentences: string[], 
  usedSentences: Set<string>, 
  count: number
): Question[] => {
  const comprehensionQuestions: Question[] = [];
  
  // Generate different types of comprehension questions
  for (let i = 0; i < Math.min(count, Math.floor(sentences.length / 3)); i++) {
    // Pick a sentence that hasn't been used
    let selectedSentence = "";
    for (const sentence of sentences) {
      if (!usedSentences.has(sentence)) {
        selectedSentence = sentence;
        usedSentences.add(sentence);
        break;
      }
    }
    
    if (!selectedSentence) continue;
    
    // Create a factual recall or definition question
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
    
    // Create a variety of comprehension questions
    const questionTypes = [
      // Direct recall
      `According to the document, what is ${keyword.toLowerCase()}?`,
      // Definition
      `How does the document define or describe ${keyword.toLowerCase()}?`,
      // Fill-in-the-blank
      selectedSentence.replace(new RegExp(`\\b${keyword}\\b`, 'i'), '_____'),
      // Main idea
      `Which statement best represents the main idea about ${keyword.toLowerCase()} in the document?`,
      // Direct fact
      `What does the document state about ${keyword.toLowerCase()}?`
    ];
    
    const questionText = questionTypes[i % questionTypes.length];
    
    // Generate options
    const correctAnswer = extractCorrectAnswerFromSentence(selectedSentence, keyword);
    
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
          w.toLowerCase() !== correctAnswer.toLowerCase())
    );
    
    // Get unique distractors
    const uniqueDistractors = [...new Set(distractorWords)];
    const shuffledDistractors = uniqueDistractors.sort(() => Math.random() - 0.5).slice(0, 3);
    
    // Generate plausible distractors if needed
    while (shuffledDistractors.length < 3) {
      const fallbackOptions = ['concept', 'process', 'factor', 'element', 'system', 'method', 'theory'];
      for (const option of fallbackOptions) {
        if (shuffledDistractors.length >= 3) break;
        if (!shuffledDistractors.includes(option) && option !== correctAnswer) {
          shuffledDistractors.push(option);
        }
      }
    }
    
    // Combine and shuffle options
    const allOptions = [correctAnswer, ...shuffledDistractors];
    for (let j = allOptions.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
    }
    
    comprehensionQuestions.push({
      id: i + 1,
      question: questionText,
      options: allOptions,
      correctAnswer: correctAnswer,
      type: 'mcq'
    });
  }
  
  return comprehensionQuestions;
};

// Function to generate application-level MCQ questions
const generateApplicationMCQs = (
  sentences: string[], 
  usedSentences: Set<string>, 
  count: number
): Question[] => {
  const applicationQuestions: Question[] = [];
  
  for (let i = 0; i < Math.min(count, Math.floor(sentences.length / 3)); i++) {
    // Pick a sentence that hasn't been used
    let selectedSentence = "";
    for (const sentence of sentences) {
      if (!usedSentences.has(sentence)) {
        selectedSentence = sentence;
        usedSentences.add(sentence);
        break;
      }
    }
    
    if (!selectedSentence) continue;
    
    // Extract key terms from the sentence for context
    const contentWords = selectedSentence.split(' ')
      .map(w => w.trim().replace(/[^a-zA-Z0-9]/g, ''))
      .filter(w => w.length > 5);
    
    if (contentWords.length < 3) continue;
    
    // Create application question templates
    const applicationTemplates = [
      `How would you apply the principle of ${contentWords[0]} in a real-world scenario?`,
      `Which of the following best demonstrates the application of ${contentWords[1]}?`,
      `In what situation would you implement the concept of ${contentWords[0]} described in the document?`,
      `Based on the document, how could ${contentWords[0]} be used to solve a problem?`,
      `Which example correctly applies the ${contentWords[0]} concept from the document?`
    ];
    
    const questionText = applicationTemplates[i % applicationTemplates.length];
    
    // Create plausible answers that apply the concept
    const correctAnswers = [
      `Using ${contentWords[0]} to improve ${contentWords[contentWords.length-1]} efficiency in a business setting`,
      `Applying ${contentWords[1]} techniques when designing new ${contentWords[contentWords.length-2]} systems`,
      `Implementing ${contentWords[0]} strategies to optimize ${contentWords[Math.floor(contentWords.length/2)]} processes`,
      `Utilizing ${contentWords[0]} methods to solve problems related to ${contentWords[contentWords.length-1]}`,
      `Incorporating ${contentWords[0]} principles into ${contentWords[contentWords.length-1]} development practices`
    ];
    
    const correctAnswer = correctAnswers[i % correctAnswers.length];
    
    // Create plausible wrong answers that misapply or misunderstand the concept
    const wrongAnswers = [
      `Replacing ${contentWords[0]} with unrelated approaches that don't address the core problem`,
      `Using ${contentWords[0]} in a context where it doesn't apply or solve the intended issue`,
      `Implementing ${contentWords[0]} without consideration for ${contentWords[Math.floor(contentWords.length/2)]} requirements`,
      `Applying ${contentWords[0]} in a way that contradicts its fundamental principles`,
      `Utilizing ${contentWords[0]} techniques that are inappropriate for the given scenario`
    ];
    
    // Select 3 wrong answers
    const shuffledWrongAnswers = [...wrongAnswers].sort(() => Math.random() - 0.5).slice(0, 3);
    
    // Combine and shuffle options
    const allOptions = [correctAnswer, ...shuffledWrongAnswers];
    for (let j = allOptions.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
    }
    
    applicationQuestions.push({
      id: i + 1,
      question: questionText,
      options: allOptions,
      correctAnswer: correctAnswer,
      type: 'mcq'
    });
  }
  
  return applicationQuestions;
};

// Function to generate analysis-level MCQ questions
const generateAnalysisMCQs = (
  sentences: string[], 
  usedSentences: Set<string>, 
  count: number
): Question[] => {
  const analysisQuestions: Question[] = [];
  
  for (let i = 0; i < Math.min(count, Math.floor(sentences.length / 3)); i++) {
    // Pick a sentence that hasn't been used
    let selectedSentence = "";
    for (const sentence of sentences) {
      if (!usedSentences.has(sentence)) {
        selectedSentence = sentence;
        usedSentences.add(sentence);
        break;
      }
    }
    
    if (!selectedSentence) continue;
    
    // Extract key terms from the sentence for context
    const contentWords = selectedSentence.split(' ')
      .map(w => w.trim().replace(/[^a-zA-Z0-9]/g, ''))
      .filter(w => w.length > 5);
    
    if (contentWords.length < 3) continue;
    
    // Create analysis question templates
    const analysisTemplates = [
      `What conclusion can be drawn from the statement about ${contentWords[0]}?`,
      `Which of the following best analyzes the relationship between ${contentWords[0]} and ${contentWords[contentWords.length-1]}?`,
      `What is the underlying assumption in the statement about ${contentWords[0]}?`,
      `How does ${contentWords[0]} relate to ${contentWords[Math.floor(contentWords.length/2)]} in the document?`,
      `What inferences can be made about ${contentWords[0]} based on the document?`
    ];
    
    const questionText = analysisTemplates[i % analysisTemplates.length];
    
    // Create plausible correct answers for analysis questions
    const correctAnswers = [
      `${contentWords[0]} serves as a fundamental component that influences ${contentWords[contentWords.length-1]}`,
      `The relationship between ${contentWords[0]} and ${contentWords[contentWords.length-1]} demonstrates a key principle in this field`,
      `The document suggests that ${contentWords[0]} functions as a critical factor in determining ${contentWords[Math.floor(contentWords.length/2)]}`,
      `${contentWords[0]} represents an important variable that affects how ${contentWords[contentWords.length-1]} operates`,
      `The interconnection between ${contentWords[0]} and ${contentWords[contentWords.length-1]} reveals patterns not immediately obvious`
    ];
    
    const correctAnswer = correctAnswers[i % correctAnswers.length];
    
    // Create plausible wrong answers that contain logical fallacies or misanalyze the content
    const wrongAnswers = [
      `${contentWords[0]} and ${contentWords[contentWords.length-1]} have no meaningful relationship in this context`,
      `The document contradicts established theories about ${contentWords[0]} and its functions`,
      `${contentWords[0]} is presented as irrelevant to the main topic discussed in the document`,
      `The text implies that ${contentWords[0]} negatively impacts all aspects of ${contentWords[contentWords.length-1]}`,
      `${contentWords[0]} is described as less significant than other factors mentioned in the document`
    ];
    
    // Select 3 wrong answers
    const shuffledWrongAnswers = [...wrongAnswers].sort(() => Math.random() - 0.5).slice(0, 3);
    
    // Combine and shuffle options
    const allOptions = [correctAnswer, ...shuffledWrongAnswers];
    for (let j = allOptions.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
    }
    
    analysisQuestions.push({
      id: i + 1,
      question: questionText,
      options: allOptions,
      correctAnswer: correctAnswer,
      type: 'mcq'
    });
  }
  
  return analysisQuestions;
};

// Function to generate True/False Questions with balanced cognitive levels
const generateTrueFalse = (
  sentences: string[], 
  usedSentences: Set<string>, 
  count: number
): Question[] => {
  const trueFalseQuestions: Question[] = [];
  
  // Divide questions among cognitive levels
  const comprehensionCount = Math.ceil(count * 0.4); // 40% comprehension
  const applicationCount = Math.ceil(count * 0.3); // 30% application
  const analysisCount = Math.floor(count * 0.3); // 30% analysis
  
  // Generate comprehension true/false questions
  for (let i = 0; i < Math.min(comprehensionCount, sentences.length); i++) {
    // Pick a sentence that hasn't been used
    let selectedSentence = "";
    for (const sentence of sentences) {
      if (!usedSentences.has(sentence)) {
        selectedSentence = sentence;
        usedSentences.add(sentence);
        break;
      }
    }
    
    if (!selectedSentence) continue;
    
    // Randomly decide if this will be a true or false statement
    const isTrue = Math.random() > 0.4; // Slightly bias toward true statements
    
    let question: string;
    
    if (isTrue) {
      // Use the original sentence as a true statement
      question = selectedSentence;
    } else {
      // Modify the sentence to make it false
      question = createFalseStatement(selectedSentence);
    }
    
    trueFalseQuestions.push({
      id: i + 1,
      question: question,
      options: ["True", "False"],
      correctAnswer: isTrue ? "True" : "False",
      type: 'truefalse'
    });
  }
  
  // Generate application true/false questions
  for (let i = 0; i < Math.min(applicationCount, sentences.length); i++) {
    // Pick a sentence that hasn't been used
    let selectedSentence = "";
    for (const sentence of sentences) {
      if (!usedSentences.has(sentence)) {
        selectedSentence = sentence;
        usedSentences.add(sentence);
        break;
      }
    }
    
    if (!selectedSentence) continue;
    
    // Extract key terms
    const contentWords = selectedSentence.split(' ')
      .map(w => w.trim().replace(/[^a-zA-Z0-9]/g, ''))
      .filter(w => w.length > 5);
    
    if (contentWords.length < 2) continue;
    
    const isTrue = Math.random() > 0.5;
    let question: string;
    
    if (isTrue) {
      const trueTemplates = [
        `You could apply the concept of ${contentWords[0]} to solve problems in related fields.`,
        `The principles of ${contentWords[0]} described in the document could be implemented in practical scenarios.`,
        `The document suggests that ${contentWords[0]} can be effectively used in ${contentWords[contentWords.length-1]} situations.`,
        `Based on the document, ${contentWords[0]} would be useful for improving ${contentWords[Math.floor(contentWords.length/2)]} processes.`
      ];
      
      question = trueTemplates[i % trueTemplates.length];
    } else {
      const falseTemplates = [
        `${contentWords[0]} would be ineffective when applied to any real-world scenarios.`,
        `The document indicates that ${contentWords[0]} has no practical applications.`,
        `According to the document, ${contentWords[0]} cannot be implemented in ${contentWords[contentWords.length-1]} contexts.`,
        `The concepts of ${contentWords[0]} described in the document are purely theoretical with no practical use cases.`
      ];
      
      question = falseTemplates[i % falseTemplates.length];
    }
    
    trueFalseQuestions.push({
      id: comprehensionCount + i + 1,
      question: question,
      options: ["True", "False"],
      correctAnswer: isTrue ? "True" : "False",
      type: 'truefalse'
    });
  }
  
  // Generate analysis true/false questions
  for (let i = 0; i < Math.min(analysisCount, sentences.length); i++) {
    // Pick a sentence that hasn't been used
    let selectedSentence = "";
    for (const sentence of sentences) {
      if (!usedSentences.has(sentence)) {
        selectedSentence = sentence;
        usedSentences.add(sentence);
        break;
      }
    }
    
    if (!selectedSentence) continue;
    
    // Extract key terms
    const contentWords = selectedSentence.split(' ')
      .map(w => w.trim().replace(/[^a-zA-Z0-9]/g, ''))
      .filter(w => w.length > 5);
    
    if (contentWords.length < 2) continue;
    
    const isTrue = Math.random() > 0.5;
    let question: string;
    
    if (isTrue) {
      const trueTemplates = [
        `The document implies that ${contentWords[0]} and ${contentWords[contentWords.length-1]} are interconnected concepts.`,
        `A critical analysis of the document would reveal that ${contentWords[0]} significantly impacts ${contentWords[Math.floor(contentWords.length/2)]}.`,
        `One can infer from the document that ${contentWords[0]} represents a fundamental principle in this field.`,
        `The relationship between ${contentWords[0]} and ${contentWords[contentWords.length-1]} suggests an underlying pattern in this domain.`
      ];
      
      question = trueTemplates[i % trueTemplates.length];
    } else {
      const falseTemplates = [
        `The document presents ${contentWords[0]} as contradicting established theories in this field.`,
        `An analysis of the document reveals that ${contentWords[0]} invalidates the concept of ${contentWords[contentWords.length-1]}.`,
        `The document implies that ${contentWords[0]} and ${contentWords[contentWords.length-1]} are completely unrelated concepts.`,
        `A critical examination of the document would show that ${contentWords[0]} is irrelevant to the main subject matter.`
      ];
      
      question = falseTemplates[i % falseTemplates.length];
    }
    
    trueFalseQuestions.push({
      id: comprehensionCount + applicationCount + i + 1,
      question: question,
      options: ["True", "False"],
      correctAnswer: isTrue ? "True" : "False",
      type: 'truefalse'
    });
  }
  
  return trueFalseQuestions;
};

// Helper function to create false statements
const createFalseStatement = (sentence: string): string => {
  const words = sentence.split(' ');
  
  // Strategies to make a false statement:
  const strategy = Math.floor(Math.random() * 4);
  
  switch (strategy) {
    case 0:
      // Replace a key word with an opposite or unrelated term
      const keywordIndex = Math.floor(Math.random() * words.length);
      const originalWord = words[keywordIndex];
      
      // Skip short words or common words
      if (originalWord.length <= 4 || /^(the|and|or|but|if|is|are|a|an|to|in|on|by)$/i.test(originalWord)) {
        // Try again with another word
        for (let j = 0; j < words.length; j++) {
          const idx = (keywordIndex + j) % words.length;
          if (words[idx].length > 4 && !/^(the|and|or|but|if|is|are|a|an|to|in|on|by)$/i.test(words[idx])) {
            words[idx] = getOppositeOrUnrelated(words[idx]);
            break;
          }
        }
      } else {
        words[keywordIndex] = getOppositeOrUnrelated(originalWord);
      }
      return words.join(' ');
      
    case 1:
      // Negate the statement
      if (/\bis\b|\bare\b|\bwas\b|\bwere\b/i.test(sentence)) {
        return sentence.replace(/\b(is|are|was|were)\b/i, (match) => {
          return match + " not";
        });
      } else {
        // If no "is/are/was/were" to negate, try another approach
        return "It is not true that " + sentence.charAt(0).toLowerCase() + sentence.slice(1);
      }
      
    case 2:
      // Exaggerate or diminish a statement
      if (/\b\d+\b/.test(sentence)) {
        // If there's a number, change it dramatically
        return sentence.replace(/\b(\d+)\b/, (match) => {
          const num = parseInt(match);
          return (num * 10).toString(); // Multiply by 10 for exaggeration
        });
      } else {
        // Add an extreme qualifier
        const qualifiers = ["always", "never", "all", "none", "exclusively", "absolutely"];
        const qualifier = qualifiers[Math.floor(Math.random() * qualifiers.length)];
        const insertPosition = Math.min(3, words.length - 1);
        words.splice(insertPosition, 0, qualifier);
        return words.join(' ');
      }
      
    case 3:
      // Replace a key subject or object with an unrelated term
      for (let j = 0; j < words.length; j++) {
        if (words[j].length > 1 && words[j][0] === words[j][0].toUpperCase() && 
            !/^(The|A|An|I|But|And|Or|If|When|While|After|Before)$/i.test(words[j])) {
          words[j] = getRandomProperNoun();
          return words.join(' ');
        }
      }
      
      // If no proper noun was found, replace a longer word
      for (let j = 0; j < words.length; j++) {
        if (words[j].length > 5 && !/^(because|therefore|however|although)$/i.test(words[j])) {
          words[j] = getRandomSubjectOrObject();
          return words.join(' ');
        }
      }
      
      // Fallback - add a contradictory statement
      return sentence + ", which is completely untrue";
  }
  
  return sentence; // Shouldn't reach here but TypeScript expects a return
};

// Helper function to extract a correct answer from a sentence based on a keyword
const extractCorrectAnswerFromSentence = (sentence: string, keyword: string): string => {
  // Simple implementation - use the keyword as the answer
  // In a more sophisticated system, this would extract the relevant phrase or definition
  return keyword;
};

// Function to generate higher-level conceptual questions when we need more questions
const generateConceptualQuestions = (text: string, count: number, type: QuestionType): Question[] => {
  const questions: Question[] = [];
  
  // Extract key concepts using NLP-inspired techniques
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 
    'from', 'with', 'in', 'of', 'this', 'that', 'these', 'those', 'is', 'are', 
    'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 
    'did', 'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might',
    'must', 'about', 'above', 'after', 'before', 'between', 'under', 'over'
  ]);
  
  // Tokenize text into words
  const allWords = text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map(word => word.toLowerCase())
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  // Count word frequencies
  const wordFrequency: Record<string, number> = {};
  allWords.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  
  // Get most frequent words as key concepts
  const keyConcepts = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(entry => entry[0]);
  
  // Identify potential pairs of related concepts
  const conceptPairs: [string, string][] = [];
  for (let i = 0; i < keyConcepts.length; i++) {
    for (let j = i + 1; j < keyConcepts.length; j++) {
      // Check if these concepts appear near each other in the text
      const pattern = new RegExp(`\\b${keyConcepts[i]}\\b.{0,100}\\b${keyConcepts[j]}\\b|\\b${keyConcepts[j]}\\b.{0,100}\\b${keyConcepts[i]}\\b`, 'i');
      if (pattern.test(text)) {
        conceptPairs.push([keyConcepts[i], keyConcepts[j]]);
      }
      
      if (conceptPairs.length >= 10) break;
    }
    if (conceptPairs.length >= 10) break;
  }
  
  if (type === 'mcq') {
    // Generate MCQ conceptual questions
    for (let i = 0; i < Math.min(count, keyConcepts.length); i++) {
      const concept = keyConcepts[i];
      
      // Question templates focusing on different cognitive levels
      const questionTemplates = [
        // Comprehension
        `What is the main role of "${concept}" according to the document?`,
        // Application
        `How would "${concept}" be applied in a practical context?`,
        // Analysis
        `What is the relationship between "${concept}" and other key elements in the document?`,
        // Synthesis (higher level)
        `How does "${concept}" contribute to the overall framework presented in the document?`,
        // Evaluation (higher level)
        `What is the significance of "${concept}" in the context of the document?`
      ];
      
      const questionText = questionTemplates[i % questionTemplates.length];
      
      // Create plausible options
      const correctAnswer = `${concept} is a central component that influences the main topics discussed`;
      
      // Create wrong answers using other key concepts
      const wrongOptions = keyConcepts
        .filter(c => c !== concept)
        .slice(0, 3)
        .map((otherConcept, idx) => {
          const templates = [
            `${concept} is unrelated to the main topic and is only mentioned in passing`,
            `${concept} contradicts the principles outlined in relation to ${otherConcept}`,
            `${concept} is less important than ${otherConcept} according to the document`
          ];
          return templates[idx % templates.length];
        });
      
      // Combine and shuffle options
      const allOptions = [correctAnswer, ...wrongOptions];
      for (let j = allOptions.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
      }
      
      questions.push({
        id: i + 1,
        question: questionText,
        options: allOptions,
        correctAnswer: correctAnswer,
        type: 'mcq'
      });
    }
  } else {
    // Generate true/false conceptual questions
    for (let i = 0; i < Math.min(count, conceptPairs.length); i++) {
      const [concept1, concept2] = conceptPairs[i % conceptPairs.length];
      const isTrue = Math.random() > 0.5;
      
      let questionText: string;
      
      if (isTrue) {
        const trueTemplates = [
          `The document establishes a connection between "${concept1}" and "${concept2}".`,
          `According to the document, "${concept1}" and "${concept2}" are related concepts.`,
          `The principles of "${concept1}" influence how "${concept2}" is understood in the document.`,
          `Understanding "${concept1}" helps in comprehending the role of "${concept2}" in this context.`
        ];
        
        questionText = trueTemplates[i % trueTemplates.length];
      } else {
        const falseTemplates = [
          `The document explicitly states that "${concept1}" and "${concept2}" are opposing concepts.`,
          `According to the document, "${concept1}" completely contradicts the principles of "${concept2}".`,
          `The document presents "${concept1}" as a replacement for "${concept2}" in all contexts.`,
          `"${concept1}" and "${concept2}" are presented as mutually exclusive approaches in the document.`
        ];
        
        questionText = falseTemplates[i % falseTemplates.length];
      }
      
      questions.push({
        id: i + 1,
        question: questionText,
        options: ["True", "False"],
        correctAnswer: isTrue ? "True" : "False",
        type: 'truefalse'
      });
    }
  }
  
  return questions;
};

// Helper function to get opposites or unrelated terms for false statements
const getOppositeOrUnrelated = (word: string): string => {
  // List of common opposites
  const opposites: Record<string, string> = {
    'increase': 'decrease',
    'decreased': 'increased',
    'increasing': 'decreasing',
    'decreasing': 'increasing',
    'high': 'low',
    'low': 'high',
    'large': 'small',
    'small': 'large',
    'many': 'few',
    'few': 'many',
    'important': 'trivial',
    'significant': 'insignificant',
    'positive': 'negative',
    'negative': 'positive',
    'before': 'after',
    'after': 'before',
    'major': 'minor',
    'minor': 'major',
    'complex': 'simple',
    'simple': 'complex',
    'difficult': 'easy',
    'easy': 'difficult',
    'fast': 'slow',
    'slow': 'fast',
    'first': 'last',
    'last': 'first',
    'early': 'late',
    'late': 'early',
    'good': 'bad',
    'bad': 'good',
    'right': 'wrong',
    'wrong': 'right',
    'true': 'false',
    'false': 'true',
    'hot': 'cold',
    'cold': 'hot',
    'new': 'old',
    'old': 'new'
  };
  
  // Check for common opposites
  const lowerWord = word.toLowerCase();
  if (opposites[lowerWord]) {
    // Preserve the original capitalization
    if (word[0] === word[0].toUpperCase()) {
      return opposites[lowerWord].charAt(0).toUpperCase() + opposites[lowerWord].slice(1);
    }
    return opposites[lowerWord];
  }
  
  // For other words, generate unrelated terms
  const unrelatedTerms = [
    'dinosaur', 'spaceship', 'waterfall', 'orchestra', 'bicycle',
    'mountain', 'penguin', 'lightning', 'rainbow', 'elephant',
    'chocolate', 'tornado', 'festival', 'diamond', 'caterpillar',
    'hamburger', 'telephone', 'backpack', 'orchestra', 'telescope'
  ];
  
  return unrelatedTerms[Math.floor(Math.random() * unrelatedTerms.length)];
};

// Helper function to get random proper nouns for false statements
const getRandomProperNoun = (): string => {
  const properNouns = [
    'Einstein', 'Shakespeare', 'Napoleon', 'Darwin', 'Columbus',
    'Jupiter', 'Amazon', 'Sahara', 'Antarctica', 'Everest',
    'Microsoft', 'Google', 'Toyota', 'Harvard', 'NASA',
    'Rome', 'Tokyo', 'Cairo', 'Sydney', 'Toronto'
  ];
  
  return properNouns[Math.floor(Math.random() * properNouns.length)];
};

// Helper function to get random subjects or objects for false statements
const getRandomSubjectOrObject = (): string => {
  const subjects = [
    'scientists', 'researchers', 'teachers', 'students', 'politicians',
    'animals', 'machines', 'computers', 'books', 'languages',
    'planets', 'elements', 'molecules', 'theories', 'concepts',
    'countries', 'governments', 'organizations', 'industries', 'societies'
  ];
  
  return subjects[Math.floor(Math.random() * subjects.length)];
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
