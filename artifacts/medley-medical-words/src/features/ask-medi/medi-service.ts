import { dictionaryProvider, type MedicalDictionaryEntry } from '@/data/medical-dictionary';

export type MediComparison = {
  left: MedicalDictionaryEntry;
  right: MedicalDictionaryEntry;
};

export type MediQuiz = {
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  category: string;
};

export type MediResponse = {
  text: string;
  focusTerm?: string;
  related?: MedicalDictionaryEntry[];
  comparison?: MediComparison;
  quiz?: MediQuiz;
};

export type MediConversationContext = {
  lastFocusTerm?: string;
};

export interface MediService {
  ask(input: string, context?: MediConversationContext): Promise<MediResponse>;
  evaluateQuiz(quiz: MediQuiz, answer: string): MediResponse;
}

const ROOT_BREAKDOWNS: Record<string, string> = {
  tachycardia: 'tachy = fast · cardi = heart · -ia = condition — a condition involving a fast heart rate.',
  tachypnea: 'tachy = fast · -pnea = breathing — breathing that is faster than expected.',
  bradycardia: 'brady = slow · cardi = heart · -ia = condition — a condition involving a slow heart rate.',
  paresthesia: 'para = abnormal or beside · esthesia = sensation — an unusual sensation such as tingling.',
  hypertension: 'hyper = above or high · tension = pressure — pressure that is higher than expected.',
  hypotension: 'hypo = below or low · tension = pressure — pressure that is lower than expected.',
  myocardial: 'myo = muscle · cardi = heart · -al = relating to — relating to the heart muscle.',
  appendicitis: 'appendix = the appendix · -itis = inflammation — inflammation of the appendix.',
  nephrology: 'nephr = kidney · -ology = study of — the study of the kidneys.',
  auscultation: 'auscult = listen · -ation = process — the process of listening to body sounds.',
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/[?!.:,;]/g, '');

function findMentionedEntries(input: string) {
  const normalizedInput = normalize(input);
  const candidates = dictionaryProvider.entries
    .flatMap((entry) => [entry.term, ...(entry.aliases ?? [])].map((label) => ({ entry, label: normalize(label) })))
    .filter(({ label }) => label.length > 2 && normalizedInput.includes(label))
    .sort((a, b) => b.label.length - a.label.length);
  return candidates.filter((candidate, index) => candidates.findIndex((item) => item.entry.term === candidate.entry.term) === index).map(({ entry }) => entry);
}

function findEntry(token: string, fallbackInput = '') {
  const direct = dictionaryProvider.getByTerm(token);
  if (direct) return direct;
  const matches = dictionaryProvider.search(token);
  if (matches.length === 1) return matches[0];
  return findMentionedEntries(fallbackInput || token)[0];
}

function relatedEntries(entry: MedicalDictionaryEntry) {
  return entry.related
    .map((term) => dictionaryProvider.getByTerm(term))
    .filter((related): related is MedicalDictionaryEntry => Boolean(related))
    .slice(0, 4);
}

function comparisonFromInput(input: string, mentioned: MedicalDictionaryEntry[]) {
  const normalizedInput = normalize(input);
  const comparisonMatch = normalizedInput.match(/(.+?)\s+(?:vs|versus)\s+(.+)/);
  if (comparisonMatch) {
    const left = findEntry(comparisonMatch[1], input);
    const right = findEntry(comparisonMatch[2], input);
    if (left && right && left.term !== right.term) return { left, right };
  }
  if (mentioned.length >= 2 && /\b(compare|difference|different|versus|vs)\b/.test(normalizedInput)) {
    return { left: mentioned[0], right: mentioned[1] };
  }
  return undefined;
}

function buildQuiz(input: string): MediQuiz {
  const categoryHint = input.match(/\b(anatomy|cardio(?:vascular)?|neurolog(?:y|ical)|respiratory|pharmacology|hematology|endocrinology|dermatology)\b/i)?.[1]?.toLowerCase();
  const pool = categoryHint
    ? dictionaryProvider.entries.filter((entry) => entry.category.toLowerCase().includes(categoryHint.replace('cardio', 'cardiovascular')))
    : dictionaryProvider.entries;
  const source = pool[0] ?? dictionaryProvider.entries[0];
  const distractors = dictionaryProvider.entries
    .filter((entry) => entry.term !== source.term && entry.category === source.category)
    .slice(0, 2);
  const options = [source, ...distractors].map((entry) => entry.term);
  return {
    prompt: `Which term best matches this definition: “${source.plain}”`,
    options,
    answer: source.term,
    explanation: `${source.term} means ${source.plain.toLowerCase()} ${source.clinical}`,
    category: source.category,
  };
}

function educationalBoundary(input: string): MediResponse | undefined {
  if (!/\b(my symptoms|my pain|do i have|am i sick|what should i take|what dose|should i stop|diagnose me|is this cancer|is this serious)\b/i.test(input)) {
    return undefined;
  }
  return {
    text: 'I can explain medical terms and general concepts, but I cannot diagnose you or recommend personalized treatment. If this is about an urgent or severe symptom, contact a licensed healthcare professional or local emergency services.',
  };
}

function explainEntry(entry: MedicalDictionaryEntry, input: string): MediResponse {
  const normalizedInput = normalize(input);
  if (/\b(mnemonic|remember|memory|memory trick)\b/.test(normalizedInput)) {
    return {
      text: `Here’s a useful hook for ${entry.term}: ${entry.mnemonic}`,
      focusTerm: entry.term,
      related: relatedEntries(entry),
    };
  }
  if (/\b(break down|breakdown|roots?|parts?|greek|latin)\b/.test(normalizedInput)) {
    return {
      text: ROOT_BREAKDOWNS[entry.term] ?? `A helpful way to study ${entry.term} is to connect its sound and meaning to the body system it describes. The dictionary entry gives the full clinical context.`,
      focusTerm: entry.term,
      related: relatedEntries(entry),
    };
  }
  if (/\b(when|clinical|doctor|clinician|use the word|used)\b/.test(normalizedInput)) {
    return {
      text: `${entry.term} is used when clinicians are describing ${entry.plain.toLowerCase()} ${entry.clinical}`,
      focusTerm: entry.term,
      related: relatedEntries(entry),
    };
  }
  if (/\b(related|similar|connect|next)\b/.test(normalizedInput)) {
    return {
      text: `Good next words after ${entry.term} are ${entry.related.length ? entry.related.join(', ') : 'the neighboring terms in this same category'}.`,
      focusTerm: entry.term,
      related: relatedEntries(entry),
    };
  }
  if (/\b(12|simple|simply|simpler|easy|beginner)\b/.test(normalizedInput)) {
    return {
      text: `In simple words: ${entry.plain} It’s the kind of language you may hear when ${entry.clinical.replace(/[“”]/g, '').replace(/^.*?said |^.*?noted |^.*?showed /i, '').toLowerCase()}`,
      focusTerm: entry.term,
      related: relatedEntries(entry),
    };
  }
  return {
    text: `${entry.term} means ${entry.plain} In clinical terms, ${entry.proper}`,
    focusTerm: entry.term,
    related: relatedEntries(entry),
  };
}

export const localMediService: MediService = {
  async ask(input, context) {
    const normalizedInput = normalize(input);
    const safetyResponse = educationalBoundary(input);
    if (safetyResponse) return safetyResponse;

    if (/\b(quiz|test me|question me)\b/.test(normalizedInput)) {
      const quiz = buildQuiz(input);
      return { text: `Let’s make it a quick study round in ${quiz.category}. Take your best guess before checking the answer.`, quiz };
    }

    const mentioned = findMentionedEntries(input);
    const comparison = comparisonFromInput(input, mentioned);
    if (comparison) {
      return {
        text: `Great comparison. These terms are related, but they describe different things:`,
        comparison,
        related: [...relatedEntries(comparison.left), ...relatedEntries(comparison.right)]
          .filter((entry, index, list) => list.findIndex((item) => item.term === entry.term) === index)
          .slice(0, 4),
      };
    }

    if (mentioned.length === 0 && context?.lastFocusTerm && /\b(slow version|fast version|opposite|other one)\b/.test(normalizedInput)) {
      const contextualEntry = context.lastFocusTerm === 'tachycardia'
        ? dictionaryProvider.getByTerm('bradycardia')
        : context.lastFocusTerm === 'bradycardia'
          ? dictionaryProvider.getByTerm('tachycardia')
          : undefined;
      if (contextualEntry) return explainEntry(contextualEntry, input);
    }

    if (mentioned[0]) return explainEntry(mentioned[0], input);

    return {
      text: 'I’m in educational mode right now, so I’m best at medical vocabulary, anatomy, clinical concepts, comparisons, mnemonics, and quizzes. Try asking “What is paresthesia?”, “Compare tachycardia and tachypnea,” or “Break down the word hypertension.”',
    };
  },
  evaluateQuiz(quiz, answer) {
    const normalizedAnswer = normalize(answer);
    const correct = normalizedAnswer === normalize(quiz.answer) || normalizedAnswer.includes(normalize(quiz.answer));
    return {
      text: correct
        ? `That’s right. ${quiz.explanation}`
        : `Not quite — the best answer is ${quiz.answer}. ${quiz.explanation}`,
      focusTerm: quiz.answer,
      related: dictionaryProvider.getByTerm(quiz.answer) ? relatedEntries(dictionaryProvider.getByTerm(quiz.answer)!) : [],
    };
  },
};