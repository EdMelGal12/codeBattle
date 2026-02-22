const fetch = require('node-fetch');
const fibQuestions = require('../questions/fillInBlank.json');

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchTrivia(amount, type) {
  try {
    const url = `https://opentdb.com/api.php?amount=${amount}&category=18&type=${type}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.response_code !== 0) return [];
    return data.results;
  } catch (err) {
    console.error('Failed to fetch trivia:', err.message);
    return [];
  }
}

async function fetchQuestions() {
  const [mcqRaw, boolRaw] = await Promise.all([
    fetchTrivia(8, 'multiple'),
    fetchTrivia(4, 'boolean'),
  ]);

  const mcqQuestions = mcqRaw.map((q) => {
    const options = shuffle([q.correct_answer, ...q.incorrect_answers]).map(decodeHtml);
    return {
      type: 'mcq',
      question: decodeHtml(q.question),
      options,
      answer: decodeHtml(q.correct_answer),
    };
  });

  const boolQuestions = boolRaw.map((q) => ({
    type: 'boolean',
    question: decodeHtml(q.question),
    options: ['True', 'False'],
    answer: q.correct_answer === 'True' ? 'True' : 'False',
  }));

  // Pick 2 random fill-in-blank questions
  const fibPicked = shuffle(fibQuestions).slice(0, 2);

  // Combine: 6 MCQ + 2 boolean + 2 FIB = 10 questions
  const mcqPicked = shuffle(mcqQuestions).slice(0, 6);
  const boolPicked = shuffle(boolQuestions).slice(0, 2);

  const all = shuffle([...mcqPicked, ...boolPicked, ...fibPicked]);
  return all;
}

module.exports = { fetchQuestions };
