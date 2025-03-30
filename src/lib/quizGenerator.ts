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
    questions.push(...generateMCQs(shuffledSentences, usedSentences, count));
  } else {
    questions.push(...generateTrueFalse(shuffledSentences, usedSentences, count));
  }
  
  // If we couldn't generate enough questions, add some higher-level conceptual questions
  if (questions.length < count) {
    // Extract key concepts using NLP-inspired techniques
    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 
      'from', 'with', 'in', 'of', 'this', 'that', 'these', 'those', 'is', 'are', 
      'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 
      'did', 'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might',
      'must', 'about', 'above', 'after', 'before', 'between', 'under', 'over'
    ]);
    
    // Extract noun phrases and important terms (simple approximation)
    const phrases: string[] = [];
    
    // Look for capitalized phrases and technical terms
    sentences.forEach(sentence => {
      // Find potential noun phrases (simple heuristic: 2-3 words with at least one non-stopword)
      const words = sentence.split(' ');
      
      for (let i = 0; i < words.length - 1; i++) {
        // Look for capitalized sequences (potential proper nouns and important concepts)
        if (
          words[i].length > 1 && 
          words[i][0] === words[i][0].toUpperCase() && 
          !words[i].match(/^[.,;:?!'"()[\]{}-]/) && 
          !stopWords.has(words[i].toLowerCase())
        ) {
          let phrase = words[i];
          
          // Check if next word is also capitalized
          if (
            i + 1 < words.length && 
            words[i+1].length > 1 &&
            words[i+1][0] === words[i+1][0].toUpperCase() &&
            !words[i+1].match(/^[.,;:?!'"()[\]{}-]/)
          ) {
            phrase += ' ' + words[i+1];
            
            // Check for three-word phrases
            if (
              i + 2 < words.length &&
              words[i+2].length > 1 &&
              words[i+2][0] === words[i+2][0].toUpperCase() &&
              !words[i+2].match(/^[.,;:?!'"()[\]{}-]/)
            ) {
              phrase += ' ' + words[i+2];
            }
          }
          
          if (phrase.length > 5) {
            phrases.push(phrase);
          }
        }
        
        // Look for technical terms (longer words, often not capitalized)
        if (
          words[i].length > 6 && 
          !stopWords.has(words[i].toLowerCase()) &&
          !words[i].match(/^[.,;:?!'"()[\]{}-]/)
        ) {
          phrases.push(words[i]);
        }
      }
    });
    
    // Count phrase frequencies
    const phraseFrequency: Record<string, number> = {};
    phrases.forEach(phrase => {
      phraseFrequency[phrase] = (phraseFrequency[phrase] || 0) + 1;
    });
    
    // Sort phrases by frequency
    const sortedPhrases = Object.entries(phraseFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(entry => entry[0]);
    
    // Generate concept questions based on question type
    for (let i = questions.length; i < count; i++) {
      if (type === 'mcq') {
        const conceptIndex = i % sortedPhrases.length;
        const concept = sortedPhrases[conceptIndex];
        
        // Create options - other frequent phrases make good distractors
        const otherConcepts = sortedPhrases.filter(w => w !== concept).slice(0, 3);
        
        // All options
        const allOptions = [concept, ...otherConcepts];
        // Shuffle options
        for (let j = allOptions.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
        }
        
        // Generate different types of questions for variety
        const questionTypes = [
          `Which of the following concepts is most central to the document?`,
          `Which term represents a key concept discussed in the document?`,
          `According to the document, which of these is an important concept?`,
          `Which of the following terms is defined or explained in the document?`,
          `Which concept below is emphasized in the document?`
        ];
        
        const questionTemplate = questionTypes[i % questionTypes.length];
        
        questions.push({
          id: i + 1,
          question: questionTemplate,
          options: allOptions,
          correctAnswer: concept,
          type: 'mcq'
        });
      } else {
        // Create true/false question with conceptual understanding
        const conceptIndex = i % sortedPhrases.length;
        const concept = sortedPhrases[conceptIndex];
        const isTrue = Math.random() > 0.5;
        
        // Generate different types of T/F questions
        if (isTrue) {
          const trueTemplates = [
            `The concept of "${concept}" is a key topic discussed in the document.`,
            `"${concept}" is an important term covered in the document.`,
            `The document provides information about "${concept}".`,
            `"${concept}" is directly mentioned or referenced in the document.`,
            `Understanding "${concept}" is relevant to comprehending the document's content.`
          ];
          
          questions.push({
            id: i + 1,
            question: trueTemplates[i % trueTemplates.length],
            options: ["True", "False"],
            correctAnswer: "True",
            type: 'truefalse'
          });
        } else {
          // For false questions, combine with a concept not in the top frequencies
          const otherPhrases = Object.keys(phraseFrequency)
            .filter(phrase => !sortedPhrases.includes(phrase))
            .slice(0, 10);
          
          const falseConcept = otherPhrases.length > 0 
            ? otherPhrases[i % otherPhrases.length]
            : sortedPhrases[(conceptIndex + 3) % sortedPhrases.length]; // Fallback
          
          const falseTemplates = [
            `"${falseConcept}" is more central to the document than "${concept}".`,
            `The document primarily focuses on "${falseConcept}" rather than "${concept}".`,
            `"${falseConcept}" is mentioned more frequently than "${concept}" in the document.`,
            `The document defines "${falseConcept}" as a subset of "${concept}".`,
            `"${falseConcept}" is presented as the main alternative to "${concept}" in the document.`
          ];
          
          questions.push({
            id: i + 1,
            question: falseTemplates[i % falseTemplates.length],
            options: ["True", "False"],
            correctAnswer: "False",
            type: 'truefalse'
          });
        }
      }
    }
  }
  
  // Simulate a processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return questions;
};

// Function to generate Multiple Choice Questions
const generateMCQs = (
  sentences: string[], 
  usedSentences: Set<string>, 
  count: number
): Question[] => {
  const mcqs: Question[] = [];
  const questionTypes = ['factual', 'conceptual', 'analytical', 'application'];
  
  // Generate different types of MCQs based on sentence content
  for (let i = 0; i < Math.min(count, Math.floor(sentences.length / 2)); i++) {
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
    
    // Determine question type for this iteration to get a variety of question types
    const questionType = questionTypes[i % questionTypes.length];
    
    if (questionType === 'factual') {
      // Create a fill-in-the-blank or factual recall question
      
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
      const questionText = selectedSentence.replace(regex, '_____');
      
      // If we couldn't create a question, skip
      if (questionText === selectedSentence) continue;
      
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
      
      // Generate plausible distractors if needed
      while (shuffledDistractors.length < 3) {
        // Get words that are similar to the correct answer
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
      
      mcqs.push({
        id: i + 1,
        question: questionText,
        options: allOptions,
        correctAnswer: correctAnswer,
        type: 'mcq'
      });
    } 
    else if (questionType === 'conceptual') {
      // Create a conceptual question based on the sentence content
      // Extract the main concepts from the sentence
      
      const conceptQuestion = `Which concept is most directly related to this statement: "${selectedSentence}"`;
      
      // Extract key terms from the sentence
      const words = selectedSentence.split(' ')
        .map(w => w.trim().replace(/[^a-zA-Z0-9]/g, ''))
        .filter(w => w.length > 5) // Focus on longer words
        .filter(w => !/^(these|those|there|their|about|would|should|could|which|where|when|what|this|that)$/i.test(w));
      
      if (words.length < 2) continue;
      
      // Find a core concept (likely the subject of the sentence)
      const correctAnswer = words[Math.floor(Math.random() * Math.min(3, words.length))];
      
      // Get other concepts from different sentences
      const otherConcepts = sentences
        .filter(s => s !== selectedSentence)
        .flatMap(s => 
          s.split(' ')
            .map(w => w.trim().replace(/[^a-zA-Z0-9]/g, ''))
            .filter(w => 
              w.length > 5 && 
              w !== correctAnswer &&
              w.toLowerCase() !== correctAnswer.toLowerCase() &&
              !/^(these|those|there|their|about|would|should|could|which|where|when|what|this|that)$/i.test(w)
            )
        );
      
      const uniqueOtherConcepts = [...new Set(otherConcepts)];
      const shuffledOtherConcepts = uniqueOtherConcepts.sort(() => Math.random() - 0.5).slice(0, 3);
      
      // Ensure we have enough distractors
      while (shuffledOtherConcepts.length < 3) {
        const fallbackConcepts = ['methodology', 'framework', 'paradigm', 'principle', 'analysis', 'structure'];
        
        for (const concept of fallbackConcepts) {
          if (shuffledOtherConcepts.length >= 3) break;
          if (!shuffledOtherConcepts.includes(concept) && concept !== correctAnswer) {
            shuffledOtherConcepts.push(concept);
          }
        }
      }
      
      // Combine and shuffle options
      const allOptions = [correctAnswer, ...shuffledOtherConcepts];
      for (let j = allOptions.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
      }
      
      mcqs.push({
        id: i + 1,
        question: conceptQuestion,
        options: allOptions,
        correctAnswer: correctAnswer,
        type: 'mcq'
      });
    }
    else if (questionType === 'analytical' || questionType === 'application') {
      // Create an analytical or application question
      
      let questionText = '';
      if (questionType === 'analytical') {
        questionText = `Which conclusion can be drawn from this statement: "${selectedSentence}"`;
      } else {
        questionText = `How would you apply the principle described in: "${selectedSentence}"`;
      }
      
      // Extract key terms from the sentence for context
      const contentWords = selectedSentence.split(' ')
        .map(w => w.trim().replace(/[^a-zA-Z0-9]/g, ''))
        .filter(w => w.length > 5);
      
      if (contentWords.length < 3) continue;
      
      // Create a plausible correct answer (this is where AI/LLM would be ideal)
      // For this simulator, we'll create generic answers
      
      const correctAnswers = [
        `It demonstrates the importance of ${contentWords[0]} in understanding ${contentWords[contentWords.length-1]}`,
        `It shows how ${contentWords[1]} relates to ${contentWords[contentWords.length-2]}`,
        `It highlights the connection between ${contentWords[0]} and ${contentWords[Math.floor(contentWords.length/2)]}`,
        `It suggests that ${contentWords[1]} is a key factor in ${contentWords[contentWords.length-1]}`,
        `It indicates that ${contentWords[0]} can lead to better ${contentWords[contentWords.length-1]}`,
      ];
      
      const correctAnswer = correctAnswers[i % correctAnswers.length];
      
      // Create plausible wrong answers that sound reasonable but are incorrect
      const wrongAnswers = [
        `It contradicts established theories about ${contentWords[0]}`,
        `It disproves the relationship between ${contentWords[0]} and ${contentWords[contentWords.length-1]}`,
        `It shows that ${contentWords[1]} is unrelated to ${contentWords[Math.floor(contentWords.length/2)]}`,
        `It demonstrates that ${contentWords[0]} is less important than previously thought`,
        `It indicates that alternative approaches to ${contentWords[contentWords.length-1]} are more effective`,
      ];
      
      // Select 3 wrong answers
      const shuffledWrongAnswers = [...wrongAnswers].sort(() => Math.random() - 0.5).slice(0, 3);
      
      // Combine and shuffle options
      const allOptions = [correctAnswer, ...shuffledWrongAnswers];
      for (let j = allOptions.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
      }
      
      mcqs.push({
        id: i + 1,
        question: questionText,
        options: allOptions,
        correctAnswer: correctAnswer,
        type: 'mcq'
      });
    }
  }
  
  return mcqs;
};

// Function to generate True/False Questions
const generateTrueFalse = (
  sentences: string[], 
  usedSentences: Set<string>, 
  count: number
): Question[] => {
  const trueFalseQuestions: Question[] = [];
  
  for (let i = 0; i < Math.min(count, sentences.length); i++) {
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
      const words = selectedSentence.split(' ');
      
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
          question = words.join(' ');
          break;
          
        case 1:
          // Negate the statement
          if (/\bis\b|\bare\b|\bwas\b|\bwere\b/i.test(selectedSentence)) {
            question = selectedSentence.replace(/\b(is|are|was|were)\b/i, (match) => {
              return match + " not";
            });
          } else {
            // If no "is/are/was/were" to negate, try another approach
            question = "It is not true that " + selectedSentence.charAt(0).toLowerCase() + selectedSentence.slice(1);
          }
          break;
          
        case 2:
          // Exaggerate or diminish a statement
          if (/\b\d+\b/.test(selectedSentence)) {
            // If there's a number, change it dramatically
            question = selectedSentence.replace(/\b(\d+)\b/, (match) => {
              const num = parseInt(match);
              return (num * 10).toString(); // Multiply by 10 for exaggeration
            });
          } else {
            // Add an extreme qualifier
            const qualifiers = ["always", "never", "all", "none", "exclusively", "absolutely"];
            const qualifier = qualifiers[Math.floor(Math.random() * qualifiers.length)];
            const insertPosition = Math.min(3, words.length - 1);
            words.splice(insertPosition, 0, qualifier);
            question = words.join(' ');
          }
          break;
          
        case 3:
          // Replace a key subject or object
          // Find a proper noun or important term (often capitalized)
          let replaced = false;
          for (let j = 0; j < words.length; j++) {
            if (words[j].length > 1 && words[j][0] === words[j][0].toUpperCase() && 
                !/^(The|A|An|I|But|And|Or|If|When|While|After|Before)$/i.test(words[j])) {
              // Found a potential proper noun
              words[j] = getRandomProperNoun();
              replaced = true;
              break;
            }
          }
          
          // If no proper noun was found, replace a subject or object
          if (!replaced) {
            // Simple heuristic: choose a noun-like word in the middle of the sentence
            const midpoint = Math.floor(words.length / 2);
            for (let offset = 0; offset < words.length / 2; offset++) {
              const idx = (midpoint + offset) % words.length;
              if (words[idx].length > 4 && !/^(the|and|or|but|if|because|since|when|while)$/i.test(words[idx])) {
                words[idx] = getRandomSubjectOrObject();
                break;
              }
            }
          }
          
          question = words.join(' ');
          break;
      }
    }
    
    trueFalseQuestions.push({
      id: i + 1,
      question: question,
      options: ["True", "False"],
      correctAnswer: isTrue ? "True" : "False",
      type: 'truefalse'
    });
  }
  
  return trueFalseQuestions;
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
