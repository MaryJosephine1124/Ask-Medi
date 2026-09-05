import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
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

type WordEntry = {
  term: string;
  pronunciation: string;
  category: string;
  level: string;
  proper: string;
  plain: string;
  clinical: string;
  mnemonic: string;
  related: string[];
};

const WORDS: WordEntry[] = [
  {
    term: 'tachycardia',
    pronunciation: '/tak-ee-KAR-dee-uh/',
    category: 'Cardiology',
    level: 'Foundations',
    proper: 'A heart rate that is faster than expected for a person’s age and activity level, typically over 100 beats per minute in an adult at rest.',
    plain: 'The heart is beating unusually fast.',
    clinical: '“The patient developed tachycardia after two minutes of exertion.”',
    mnemonic: 'Tachy = quick. Think of a taxi speeding through the city.',
    related: ['bradycardia', 'homeostasis'],
  },
  {
    term: 'bradycardia',
    pronunciation: '/brad-ee-KAR-dee-uh/',
    category: 'Cardiology',
    level: 'Foundations',
    proper: 'A heart rate below 60 beats per minute in an adult, which may be normal in athletes or a sign of an underlying condition.',
    plain: 'The heart is beating more slowly than usual.',
    clinical: '“Sinus bradycardia was noted on the patient’s ECG.”',
    mnemonic: 'Brady = slow. Picture a calm, unhurried heartbeat.',
    related: ['tachycardia', 'homeostasis'],
  },
  {
    term: 'cyanosis',
    pronunciation: '/sye-uh-NOH-sis/',
    category: 'Physical examination',
    level: 'Core skill',
    proper: 'A bluish discoloration of the skin or mucous membranes caused by increased deoxygenated hemoglobin in the blood.',
    plain: 'A blue or slate tint that can signal the body is not getting enough oxygen.',
    clinical: '“Central cyanosis was visible around the lips and tongue.”',
    mnemonic: 'Cyan is the blue in cyanosis — check oxygenation.',
    related: ['auscultation', 'edema'],
  },
  {
    term: 'auscultation',
    pronunciation: '/aws-kul-TAY-shun/',
    category: 'Physical examination',
    level: 'Core skill',
    proper: 'The act of listening to internal body sounds, usually with a stethoscope, to assess the heart, lungs, or bowel.',
    plain: 'Listening to what is happening inside the body.',
    clinical: '“Auscultation revealed clear breath sounds bilaterally.”',
    mnemonic: 'Auscultation sounds like “audio” — use your ears to examine.',
    related: ['cyanosis', 'hemostasis'],
  },
  {
    term: 'edema',
    pronunciation: '/ih-DEE-muh/',
    category: 'Pathophysiology',
    level: 'Foundations',
    proper: 'An abnormal accumulation of fluid in the interstitial spaces of tissues, often causing visible swelling.',
    plain: 'Swelling caused by extra fluid collecting in the tissues.',
    clinical: '“Pitting edema was present to the patient’s mid-shin.”',
    mnemonic: 'Edema = extra fluid makes tissue expand.',
    related: ['cyanosis', 'homeostasis'],
  },
  {
    term: 'homeostasis',
    pronunciation: '/hoh-mee-oh-STAY-sis/',
    category: 'Physiology',
    level: 'Foundations',
    proper: 'The self-regulating process by which a biological system maintains internal stability despite changes in its external environment.',
    plain: 'The body keeping its inner conditions steady.',
    clinical: '“The kidneys play a central role in maintaining homeostasis.”',
    mnemonic: 'Homeo = same, stasis = standing still: keeping the internal world steady.',
    related: ['tachycardia', 'edema'],
  },
  {
    term: 'idiopathic',
    pronunciation: '/id-ee-oh-PATH-ik/',
    category: 'Clinical language',
    level: 'Foundations',
    proper: 'Describing a disease or condition that arises spontaneously or for which the underlying cause is unknown.',
    plain: 'It happened, but we do not yet know why.',
    clinical: '“The patient has idiopathic urticaria despite an extensive workup.”',
    mnemonic: 'Idio = one’s own, pathic = disease: a disease on its own path.',
    related: ['homeostasis', 'hemostasis'],
  },
  {
    term: 'hemostasis',
    pronunciation: '/hee-moh-STAY-sis/',
    category: 'Physiology',
    level: 'Core skill',
    proper: 'The process by which the body stops bleeding through vascular constriction, platelet activity, and coagulation.',
    plain: 'The body’s built-in way of stopping a bleed.',
    clinical: '“Direct pressure is the first step in achieving hemostasis.”',
    mnemonic: 'Hemo = blood, stasis = stopping: stopping blood loss.',
    related: ['auscultation', 'idiopathic'],
  },
  {
    term: 'dyspnea',
    pronunciation: '/disp-NEE-uh/',
    category: 'Clinical language',
    level: 'Foundations',
    proper: 'A subjective experience of breathing discomfort or difficulty that may be described as shortness of breath.',
    plain: 'Feeling like it is hard to breathe or get enough air.',
    clinical: '“The patient reports dyspnea when walking up one flight of stairs.”',
    mnemonic: 'Dys = difficult, pnea = breathing: difficult breathing.',
    related: ['cyanosis', 'auscultation'],
  },
  {
    term: 'hypotension',
    pronunciation: '/hy-poh-TEN-shun/',
    category: 'Cardiology',
    level: 'Foundations',
    proper: 'Blood pressure that is lower than expected for adequate organ perfusion, often defined clinically in context rather than by one universal number.',
    plain: 'Blood pressure is too low for the body to feel well supplied.',
    clinical: '“The patient became hypotensive after the fluid loss.”',
    mnemonic: 'Hypo = low, tension = pressure: low pressure.',
    related: ['hypertension', 'homeostasis'],
  },
  {
    term: 'hypertension',
    pronunciation: '/hy-per-TEN-shun/',
    category: 'Cardiology',
    level: 'Foundations',
    proper: 'Persistently elevated arterial blood pressure that increases the long-term risk of cardiovascular, renal, and cerebrovascular disease.',
    plain: 'Blood pressure stays higher than it should over time.',
    clinical: '“Lifestyle changes were discussed as part of hypertension management.”',
    mnemonic: 'Hyper = high, tension = pressure: high pressure.',
    related: ['hypotension', 'homeostasis'],
  },
  {
    term: 'arrhythmia',
    pronunciation: '/uh-RITH-mee-uh/',
    category: 'Cardiology',
    level: 'Core skill',
    proper: 'An abnormality in the rate, rhythm, or sequence of cardiac electrical activity.',
    plain: 'The heartbeat is too fast, too slow, or irregular.',
    clinical: '“The monitor detected a brief atrial arrhythmia.”',
    mnemonic: 'A rhythm with an extra “a” — the rhythm is altered.',
    related: ['tachycardia', 'bradycardia'],
  },
  {
    term: 'ischemia',
    pronunciation: '/iss-KEE-mee-uh/',
    category: 'Pathophysiology',
    level: 'Core concept',
    proper: 'Inadequate blood flow to a tissue, resulting in insufficient delivery of oxygen and nutrients for its metabolic needs.',
    plain: 'A tissue is not getting enough blood and oxygen.',
    clinical: '“The ECG changes raised concern for myocardial ischemia.”',
    mnemonic: 'Ischemia is “issue” with circulation: blood cannot get through.',
    related: ['infarction', 'thrombus'],
  },
  {
    term: 'infarction',
    pronunciation: '/in-FARK-shun/',
    category: 'Pathophysiology',
    level: 'Core concept',
    proper: 'Tissue death caused by prolonged interruption of its blood supply, usually because of arterial blockage.',
    plain: 'Part of an organ dies because it has been cut off from blood.',
    clinical: '“Imaging confirmed an acute cerebral infarction.”',
    mnemonic: 'An infarct is an area that has been “inflicted” by lost blood flow.',
    related: ['ischemia', 'necrosis'],
  },
  {
    term: 'thrombus',
    pronunciation: '/THROM-bus/',
    category: 'Hematology',
    level: 'Core concept',
    proper: 'A blood clot that forms within a blood vessel or the heart and remains attached at its site of formation.',
    plain: 'A clot that forms and stays where it started.',
    clinical: '“Ultrasound showed a thrombus in the deep veins of the leg.”',
    mnemonic: 'Thrombus has a “home”; it stays put until it grows or breaks away.',
    related: ['embolus', 'hemostasis'],
  },
  {
    term: 'embolus',
    pronunciation: '/EM-buh-lus/',
    category: 'Hematology',
    level: 'Core concept',
    proper: 'Material traveling through the bloodstream that can lodge in a vessel and obstruct circulation; it may be a clot, air, fat, or other substance.',
    plain: 'Something travels through the blood and gets stuck somewhere else.',
    clinical: '“A pulmonary embolus was considered after the sudden onset of dyspnea.”',
    mnemonic: 'An embolus embarks on a journey; a thrombus stays at home.',
    related: ['thrombus', 'dyspnea'],
  },
  {
    term: 'inflammation',
    pronunciation: '/in-fluh-MAY-shun/',
    category: 'Pathophysiology',
    level: 'Foundations',
    proper: 'A protective biological response to injury, infection, or irritation involving immune cells, blood vessels, and molecular mediators.',
    plain: 'The body’s alert response to damage or unwanted visitors.',
    clinical: '“The joint showed warmth and swelling consistent with inflammation.”',
    mnemonic: 'Inflammation brings the “fire” of redness, heat, swelling, and pain.',
    related: ['edema', 'necrosis'],
  },
  {
    term: 'necrosis',
    pronunciation: '/neh-KROH-sis/',
    category: 'Pathology',
    level: 'Core concept',
    proper: 'The uncontrolled death of cells or tissue caused by injury, infection, ischemia, or other harmful processes.',
    plain: 'Cells or tissue die because something has damaged them.',
    clinical: '“The wound was evaluated for signs of tissue necrosis.”',
    mnemonic: 'Necrosis sounds like “no growth”: the tissue is no longer alive.',
    related: ['infarction', 'inflammation'],
  },
  {
    term: 'prophylaxis',
    pronunciation: '/proh-fuh-LAK-sis/',
    category: 'Clinical practice',
    level: 'Foundations',
    proper: 'An intervention used to prevent disease, infection, or another unwanted outcome before it occurs.',
    plain: 'Doing something ahead of time to stop a problem from happening.',
    clinical: '“Antibiotic prophylaxis was given before the procedure.”',
    mnemonic: 'Pro = before, phylaxis = guarding: guarding before the threat arrives.',
    related: ['contraindication', 'hemostasis'],
  },
  {
    term: 'prognosis',
    pronunciation: '/prog-NOH-sis/',
    category: 'Clinical language',
    level: 'Foundations',
    proper: 'The likely course and outcome of a disease or condition based on clinical findings, evidence, and patient-specific factors.',
    plain: 'What clinicians expect may happen next with an illness.',
    clinical: '“The team discussed prognosis and treatment goals with the family.”',
    mnemonic: 'Prognosis is a professional guess about what comes next.',
    related: ['idiopathic', 'differential diagnosis'],
  },
  {
    term: 'differential diagnosis',
    pronunciation: '/dif-uh-REN-shul dye-ug-NOH-sis/',
    category: 'Clinical reasoning',
    level: 'Core skill',
    proper: 'A ranked list of possible conditions that could explain a patient’s signs, symptoms, and test results.',
    plain: 'The short list of what might be causing the problem.',
    clinical: '“Pneumonia and pulmonary embolism were included in the differential diagnosis.”',
    mnemonic: 'Differential means differences: compare the clues that separate each possibility.',
    related: ['prognosis', 'idiopathic'],
  },
  {
    term: 'palpation',
    pronunciation: '/pal-PAY-shun/',
    category: 'Physical examination',
    level: 'Core skill',
    proper: 'An examination technique that uses the hands and fingers to assess characteristics such as tenderness, texture, temperature, size, and movement.',
    plain: 'Using your hands to learn what the body feels like.',
    clinical: '“Palpation revealed focal tenderness in the right lower quadrant.”',
    mnemonic: 'Palpation starts with palm: examine by touch.',
    related: ['auscultation', 'percussion'],
  },
  {
    term: 'percussion',
    pronunciation: '/per-KUSH-un/',
    category: 'Physical examination',
    level: 'Core skill',
    proper: 'A technique of tapping the body surface to produce sounds that help estimate the underlying tissue, organ, or fluid.',
    plain: 'Tapping the body and listening to the sound it makes.',
    clinical: '“Chest percussion was resonant over both lung fields.”',
    mnemonic: 'Percussion is a tiny body drum that gives clues about what lies beneath.',
    related: ['palpation', 'auscultation'],
  },
  {
    term: 'intubation',
    pronunciation: '/in-too-BAY-shun/',
    category: 'Procedures',
    level: 'Core skill',
    proper: 'Placement of a tube into the trachea to maintain an open airway and support ventilation or protect the airway.',
    plain: 'Putting a breathing tube into the windpipe to help someone breathe safely.',
    clinical: '“The patient required endotracheal intubation for airway protection.”',
    mnemonic: 'Intubation puts a tube in; the tube gives the airway a path.',
    related: ['auscultation', 'prophylaxis'],
  },
  {
    term: 'biopsy',
    pronunciation: '/BY-op-see/',
    category: 'Diagnostics',
    level: 'Core skill',
    proper: 'Removal of a sample of cells or tissue for microscopic, molecular, or other laboratory examination.',
    plain: 'Taking a small piece to find out what the larger area is made of.',
    clinical: '“The lesion was sent for biopsy to clarify the diagnosis.”',
    mnemonic: 'Bio = life, -opsy = viewing: viewing living tissue up close.',
    related: ['necrosis', 'prognosis'],
  },
  {
    term: 'endoscopy',
    pronunciation: '/en-DOS-kuh-pee/',
    category: 'Diagnostics',
    level: 'Core skill',
    proper: 'A procedure that uses a flexible or rigid instrument with a camera or optical system to visualize the inside of a body cavity or organ.',
    plain: 'Looking inside the body with a small camera.',
    clinical: '“Upper endoscopy was scheduled to evaluate the persistent dysphagia.”',
    mnemonic: 'Endo = inside, -scopy = look: look inside.',
    related: ['biopsy', 'palpation'],
  },
  {
    term: 'anaphylaxis',
    pronunciation: '/an-uh-fuh-LAK-sis/',
    category: 'Emergency medicine',
    level: 'Core skill',
    proper: 'A rapid, severe, systemic hypersensitivity reaction that can compromise the airway, breathing, or circulation.',
    plain: 'A sudden, dangerous allergic reaction that can affect the whole body.',
    clinical: '“Epinephrine was administered immediately for suspected anaphylaxis.”',
    mnemonic: 'Ana = against, phylaxis = protection: the defense system overreacts.',
    related: ['dyspnea', 'hypotension'],
  },
  {
    term: 'sepsis',
    pronunciation: '/SEP-sis/',
    category: 'Emergency medicine',
    level: 'Core concept',
    proper: 'Life-threatening organ dysfunction caused by a dysregulated host response to infection.',
    plain: 'An infection triggers a dangerous whole-body response that starts harming organs.',
    clinical: '“The patient was treated promptly for suspected sepsis.”',
    mnemonic: 'Sepsis can spread the alarm system too far; watch the whole patient, not just the infection.',
    related: ['inflammation', 'hypotension'],
  },
  {
    term: 'contraindication',
    pronunciation: '/kon-truh-in-di-KAY-shun/',
    category: 'Clinical practice',
    level: 'Core skill',
    proper: 'A specific condition or factor that makes a particular treatment, medication, or procedure inadvisable because of potential harm.',
    plain: 'A reason not to use a treatment in a certain situation.',
    clinical: '“A history of severe allergy was documented as a contraindication.”',
    mnemonic: 'Contra = against, indication = reason to use: a reason against using it.',
    related: ['prophylaxis', 'idiopathic'],
  },
];

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
          <span className="brand-name">medley<em>.</em></span>
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
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('medley-saved') ?? '[]') as string[]; } catch { return []; }
  });
  const [studied, setStudied] = useState(() => localStorage.getItem('medley-studied') === new Date().toISOString().slice(0, 10));
  const word = WORDS[0];
  const toggleSave = () => {
    const next = saved.includes(word.term) ? saved.filter((term) => term !== word.term) : [...saved, word.term];
    setSaved(next);
    localStorage.setItem('medley-saved', JSON.stringify(next));
  };
  const markStudied = () => {
    setStudied(true);
    localStorage.setItem('medley-studied', new Date().toISOString().slice(0, 10));
  };
  return (
    <div className="page-enter">
      <main className="page-wrap">
        <section className="hero-grid">
          <div className="stagger-1">
            <div className="eyebrow"><span className="eyebrow-line" /> Daily word · Tuesday, 14 May</div>
            <h1 className="hero-title">Make medicine<br />feel <span className="accent-word">knowable.</span></h1>
            <p className="hero-copy">A small, steady vocabulary ritual for the people learning how to care for others. One useful word, with the context to make it stick.</p>
          </div>
          <ProgressCard studied={studied} />
        </section>
        <WordDetail word={word} saved={saved.includes(word.term)} onSave={toggleSave} onStudied={markStudied} studied={studied} />
        <section>
          <div className="section-heading stagger-4">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> How to use Medley</div>
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
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('medley-saved') ?? '[]') as string[]; } catch { return []; }
  });
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => WORDS.filter((word) => `${word.term} ${word.category} ${word.plain}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery]);
  const selected = results.find((word) => word.term === selectedTerm) ?? results[0];
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
            <input value={query} onChange={(event) => { setQuery(event.target.value); }} className="search-input" type="search" placeholder="Search a term, concept, or plain-English idea" aria-label="Search medical dictionary" data-testid="input-dictionary-search" />
            {query && <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search" data-testid="button-clear-search"><X size={16} /></button>}
          </div>
        </section>
        <section className="dictionary-layout">
          <aside className="results-panel stagger-2">
            <div className="results-top"><span>{normalizedQuery ? 'MATCHES' : 'ALL WORDS'}</span><span>{results.length.toString().padStart(2, '0')}</span></div>
            {results.length > 0 ? results.map((word) => (
              <button key={word.term} className={`result-button ${selected?.term === word.term ? 'selected' : ''}`} onClick={() => setSelectedTerm(word.term)} data-testid={`button-select-${word.term}`}>
                <span><span className="result-term">{word.term}</span><br /><span className="result-kind">{word.category}</span></span>
                {selected?.term === word.term && <ArrowRight size={15} />}
              </button>
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
        <span className="footer-brand">medley.</span>
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
