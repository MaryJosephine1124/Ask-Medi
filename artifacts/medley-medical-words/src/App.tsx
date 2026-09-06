import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { dictionaryProvider, type MedicalDictionaryEntry } from '@/data/medical-dictionary';
import NotFound from '@/pages/not-found';
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  CircleHelp,
  HeartPulse,
  Lightbulb,
  Search,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';
import {
  Link,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type WordEntry = MedicalDictionaryEntry;
const WORDS = dictionaryProvider.entries;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const AVAILABLE_LETTERS = new Set(WORDS.map((word) => word.term.charAt(0).toUpperCase()));

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDailyWord(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
  return WORDS[((dayNumber % WORDS.length) + WORDS.length) % WORDS.length];
}

function formatDailyDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric' }).format(new Date(year, month - 1, day));
}

function useLocalDateKey() {
  const [dateKey, setDateKey] = useState(() => getLocalDateKey());

  useEffect(() => {
    const refreshDate = () => {
      const nextDateKey = getLocalDateKey();
      setDateKey((currentDateKey) => currentDateKey === nextDateKey ? currentDateKey : nextDateKey);
    };

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const midnightTimer = window.setTimeout(refreshDate, nextMidnight.getTime() - now.getTime() + 50);
    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') refreshDate();
    };

    document.addEventListener('visibilitychange', visibilityHandler);
    return () => {
      window.clearTimeout(midnightTimer);
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, [dateKey]);

  return dateKey;
}

function MedicalMark({ size = 21 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 20.2S4.2 15.4 4.2 9.8A4.1 4.1 0 0 1 12 7.55 4.1 4.1 0 0 1 19.8 9.8c0 5.6-7.8 10.4-7.8 10.4Z" stroke="currentColor" strokeWidth="1.55" />
      <path d="M12 5.4v5.4M9.3 8.1h5.4" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
    </svg>
  );
}

function Header({ currentPath }: { currentPath: string }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <Link href="/" className="brand-link" data-testid="link-brand-home">
          <span className="brand-mark"><MedicalMark size={20} /></span>
          <span className="brand-copy">
            <span className="brand-name">MediMind<em>.</em></span>
            <span className="brand-tagline">Find the words behind the work.</span>
          </span>
        </Link>
        <nav className="header-nav" aria-label="Main navigation">
          <Link href="/" className={`nav-link ${currentPath === '/' ? 'nav-link-active' : ''}`} data-testid="link-daily-word">
            <Sparkles size={15} /> Daily word
          </Link>
          <Link href="/dictionary" className={`nav-link ${currentPath === '/dictionary' ? 'nav-link-active' : ''}`} data-testid="link-dictionary">
            <BookOpen size={15} /> Dictionary
          </Link>
        </nav>
        <div className="header-note">a small study ritual</div>
      </div>
    </header>
  );
}

function ProgressCard({ studied }: { studied: boolean }) {
  return (
    <div className="progress-card stagger-2" data-testid="status-study-progress">
      <div className="progress-label">YOUR STUDY STREAK</div>
      <h2 className="progress-title">{studied ? 'One thoughtful word.' : 'A little goes far.'}</h2>
      <p className="progress-sub">{studied ? 'You showed up for today.' : 'One word is waiting for you today.'}</p>
      <div className="progress-dots" aria-label={`${studied ? 1 : 0} of 3 study steps complete`}>
        {[0, 1, 2].map((dot) => <span key={dot} className={`progress-dot ${studied && dot === 0 ? 'is-done' : ''}`} />)}
      </div>
    </div>
  );
}

function WordDetail({
  word,
  saved,
  onSave,
  onStudied,
  studied,
  label = 'WORD OF THE DAY',
}: {
  word: WordEntry;
  saved: boolean;
  onSave: () => void;
  onStudied?: () => void;
  studied?: boolean;
  label?: string;
}) {
  return (
    <div className="daily-layout">
      <article className="word-card stagger-2" data-testid={`card-word-${word.term}`}>
        <div className="word-meta">
          <span className="word-label">{label}</span>
          <button className={`save-button ${saved ? 'saved' : ''}`} onClick={onSave} aria-label={saved ? `Remove ${word.term} from saved words` : `Save ${word.term}`} data-testid={`button-save-${word.term}`}>
            <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div>
          <h2 className="word-term" data-testid={`text-term-${word.term}`}>{word.term}</h2>
          <div className="word-pronunciation" data-testid={`text-pronunciation-${word.term}`}>{word.pronunciation}</div>
        </div>
        <div className="word-bottom">
          <div className="word-category">
            category
            <strong>{word.category} · {word.level}</strong>
          </div>
          <div className="mark-stamp"><MedicalMark size={43} /></div>
        </div>
      </article>
      <div className="detail-stack stagger-3">
        <section className="detail-panel" data-testid={`text-proper-meaning-${word.term}`}>
          <div className="detail-kicker">In proper terms</div>
          <p>{word.proper}</p>
        </section>
        <section className="detail-panel mint" data-testid={`text-plain-meaning-${word.term}`}>
          <div className="detail-kicker">In plain English</div>
          <p><strong>{word.plain}</strong></p>
          <p className="clinical-example">{word.clinical}</p>
        </section>
        <section className="mnemonic" data-testid={`text-mnemonic-${word.term}`}>
          <div className="mnemonic-icon"><Lightbulb size={18} /></div>
          <p><strong>Make it stick</strong>{word.mnemonic}</p>
        </section>
        {onStudied && (
          <div className="action-row">
            <button className="primary-button" onClick={onStudied} disabled={studied} data-testid="button-mark-studied">
              {studied ? <Check size={15} /> : <HeartPulse size={15} />}
              {studied ? 'Studied today' : 'Mark as studied'}
            </button>
            <span className="section-note">{studied ? 'Nice work. See you tomorrow.' : 'Takes about 60 seconds.'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Home() {
  const dateKey = useLocalDateKey();
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('medley-saved') ?? '[]') as string[]; } catch { return []; }
  });
  const [studied, setStudied] = useState(() => localStorage.getItem('medley-studied') === getLocalDateKey());
  const word = getDailyWord(dateKey);
  const toggleSave = () => {
    const next = saved.includes(word.term) ? saved.filter((term) => term !== word.term) : [...saved, word.term];
    setSaved(next);
    localStorage.setItem('medley-saved', JSON.stringify(next));
  };
  const markStudied = () => {
    setStudied(true);
    localStorage.setItem('medley-studied', dateKey);
  };
  return (
    <div className="page-enter">
      <main className="page-wrap">
        <section className="hero-grid">
          <div className="stagger-1">
            <div className="eyebrow"><span className="eyebrow-line" /> Daily word · {formatDailyDate(dateKey)}</div>
            <h1 className="hero-title">Make medicine<br />feel <span className="accent-word">knowable.</span></h1>
            <p className="hero-slogan">Find the words behind the work.</p>
            <p className="hero-copy">A small, steady vocabulary ritual for the people learning how to care for others. One useful word, with the context to make it stick.</p>
          </div>
          <ProgressCard studied={studied} />
        </section>
        <WordDetail word={word} saved={saved.includes(word.term)} onSave={toggleSave} onStudied={markStudied} studied={studied} />
        <section>
          <div className="section-heading stagger-4">
            <div>
            <div className="eyebrow"><span className="eyebrow-line" /> How to use MediMind</div>
              <h2 className="section-title">Tiny lessons. Real language.</h2>
            </div>
            <span className="section-note">Keep it close, come back often.</span>
          </div>
          <div className="support-grid">
            <article className="support-card stagger-1"><BookOpen className="support-icon" size={19} /><h3>Read it right</h3><p>Start with the clinical definition, then let the plain-English version land.</p></article>
            <article className="support-card stagger-2"><Stethoscope className="support-icon" size={19} /><h3>See it in practice</h3><p>Every entry includes a sentence that sounds like it belongs on the ward.</p></article>
            <article className="support-card stagger-3"><Lightbulb className="support-icon" size={19} /><h3>Give it a hook</h3><p>A small mnemonic turns a new term into something you can reach for later.</p></article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Dictionary() {
  const [query, setQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(WORDS[0].term);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('medley-saved') ?? '[]') as string[]; } catch { return []; }
  });
  const normalizedQuery = query.trim().toLowerCase();
  const searchedResults = useMemo(() => dictionaryProvider.search(normalizedQuery), [normalizedQuery]);
  const results = useMemo(
    () => selectedLetter ? searchedResults.filter((word) => word.term.charAt(0).toUpperCase() === selectedLetter) : searchedResults,
    [searchedResults, selectedLetter],
  );
  const suggestions = normalizedQuery ? searchedResults.slice(0, 6) : [];
  const selected = results.find((word) => word.term === selectedTerm) ?? results[0];
  const selectSuggestion = (term: string) => {
    setSelectedTerm(term);
    setQuery(term);
    setSelectedLetter(null);
  };
  const toggleSave = () => {
    if (!selected) return;
    const next = saved.includes(selected.term) ? saved.filter((term) => term !== selected.term) : [...saved, selected.term];
    setSaved(next);
    localStorage.setItem('medley-saved', JSON.stringify(next));
  };
  return (
    <div className="page-enter">
      <main className="page-wrap">
        <section className="dictionary-header">
          <div className="eyebrow stagger-1"><span className="eyebrow-line" /> The reference shelf</div>
          <h1 className="dictionary-title stagger-2">Find the words<br /><span className="accent-word">behind the work.</span></h1>
          <p className="dictionary-copy stagger-3">A growing shelf of precise medical language, translated into something you can carry into your next lecture, lab, or patient conversation.</p>
          <div className="search-wrap stagger-4">
            <Search className="search-icon" size={18} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setSelectedLetter(null); }} className="search-input" type="search" placeholder="Search a term, concept, or plain-English idea" aria-label="Search medical dictionary" data-testid="input-dictionary-search" />
            {query && <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search" data-testid="button-clear-search"><X size={16} /></button>}
            {suggestions.length > 0 && (
              <div className="search-suggestions" role="listbox" aria-label="Search suggestions">
                {suggestions.map((word) => (
                  <button key={word.term} className="suggestion-button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectSuggestion(word.term)} role="option">
                    <span className="suggestion-term">{word.term}</span>
                    <span className="suggestion-category">{word.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="alphabet-nav" aria-label="Browse dictionary alphabetically">
            <button className={`alphabet-button alphabet-all ${selectedLetter === null ? 'active' : ''}`} onClick={() => { setSelectedLetter(null); setQuery(''); }} aria-label="Show all dictionary terms">All</button>
            {ALPHABET.map((letter) => (
              <button
                key={letter}
                className={`alphabet-button ${selectedLetter === letter ? 'active' : ''} ${!AVAILABLE_LETTERS.has(letter) ? 'unavailable' : ''}`}
                onClick={() => { setSelectedLetter((current) => current === letter ? null : letter); setQuery(''); }}
                disabled={!AVAILABLE_LETTERS.has(letter)}
                aria-label={`Browse terms starting with ${letter}`}
                aria-pressed={selectedLetter === letter}
              >
                {letter}
              </button>
            ))}
          </div>
        </section>
        <section className="dictionary-layout">
          <aside className="results-panel stagger-2">
            <div className="results-top"><span>{normalizedQuery ? 'MATCHES' : selectedLetter ? `${selectedLetter} TERMS` : 'ALL WORDS'}</span><span>{results.length.toString().padStart(2, '0')}</span></div>
            {results.length > 0 ? results.map((word, index) => (
              <div className="result-group" key={word.term}>
                {(index === 0 || word.term.charAt(0).toUpperCase() !== results[index - 1].term.charAt(0).toUpperCase()) && (
                  <div className="letter-heading">{word.term.charAt(0).toUpperCase()}</div>
                )}
                <button className={`result-button ${selected?.term === word.term ? 'selected' : ''}`} onClick={() => setSelectedTerm(word.term)} data-testid={`button-select-${word.term}`}>
                  <span><span className="result-term">{word.term}</span><br /><span className="result-kind">{word.category}</span></span>
                  {selected?.term === word.term && <ArrowRight size={15} />}
                </button>
              </div>
            )) : (
              <div className="empty-state" data-testid="status-no-results">
                <CircleHelp size={21} />
                <p><strong>No match just yet.</strong>Try a broader term, or browse the full shelf.</p>
              </div>
            )}
          </aside>
          <div className="dictionary-detail stagger-3">
            {selected ? (
              <WordDetail word={selected} saved={saved.includes(selected.term)} onSave={toggleSave} label="DICTIONARY ENTRY" />
            ) : (
              <div className="empty-state detail-panel" data-testid="status-empty-detail"><CircleHelp size={25} /><p><strong>Select a word to begin.</strong>Your next useful term is in the list.</p></div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-brand">MediMind<em>.</em></span>
        <span>Built for curious future doctors · educational reference, not medical advice</span>
      </div>
    </footer>
  );
}

function Router() {
  const [location] = useLocation();
  return (
    <div className="app-shell">
      <Header currentPath={location} />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dictionary" component={Dictionary} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
