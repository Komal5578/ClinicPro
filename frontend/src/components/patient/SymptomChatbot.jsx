import { useState, useEffect, useRef } from 'react';
import { getSymptomRecommendation } from '../../services/api';

// ─── QUESTION TREE (max 4 questions per path) ─────────────────────────────────
const questionMap = {
  start: {
    id: 'start',
    text: "👋 Hi! I'm your Symptom Guide. Where is your main discomfort?",
    type: 'options',
    options: [
      ' Teeth / Mouth',
      ' Fever / Cold / Flu',
      ' Stomach / Digestion',
      ' Head / Stress / Mental',
      ' Muscle / Joint / Back',
      ' Skin / Allergy',
      ' Chest / Breathing',
      ' Eyes / Ears / Nose',
    ],
    next: (ans) => {
      const v = ans.start;
      if (v.includes('Teeth')) return 'q_dental';
      if (v.includes('Fever')) return 'q_fever';
      if (v.includes('Stomach')) return 'q_stomach';
      if (v.includes('Head') || v.includes('Mental')) return 'q_mental';
      if (v.includes('Muscle') || v.includes('Joint')) return 'q_joint';
      if (v.includes('Skin')) return 'q_skin';
      if (v.includes('Chest')) return 'q_chest';
      if (v.includes('Eyes')) return 'q_eyes';
      return 'q_duration';
    },
  },

  // ── DENTAL (path: start → q_dental → q_duration → DONE = 3 questions) ──
  q_dental: {
    id: 'q_dental',
    text: 'What exactly are you experiencing?',
    type: 'options',
    options: [' Toothache / sharp pain', ' Bleeding or swollen gums', ' Sensitivity to hot/cold', ' Jaw pain or swelling', ' Cavity or broken tooth'],
    next: () => 'q_duration',
    sector: () => 'DENTAL',
  },

  // ── FEVER (path: start → q_fever → q_duration → DONE = 3 questions) ──
  q_fever: {
    id: 'q_fever',
    text: 'What are you feeling most right now?',
    type: 'options',
    options: ['🌡️ High fever (above 101°F)', ' Cold, runny nose, sneezing', ' Cough or sore throat', ' Body aches and weakness', ' Chills and shivering'],
    next: () => 'q_duration',
    sector: () => 'GENERAL',
  },

  // ── STOMACH (path: start → q_stomach → q_ayurvedic → DONE = 3 questions) ──
  q_stomach: {
    id: 'q_stomach',
    text: 'Which best describes your stomach issue?',
    type: 'options',
    options: [' Acidity / heartburn', ' Nausea or vomiting', ' Loose motions / diarrhea', ' Bloating or cramps', ' Loss of appetite'],
    next: () => 'q_ayurvedic',
    sector: () => 'GENERAL',
  },

  // ── MENTAL (path: start → q_mental → q_duration → DONE = 3 questions) ──
  q_mental: {
    id: 'q_mental',
    text: 'What are you dealing with most?',
    type: 'options',
    options: ['Anxiety or panic attacks', ' Cannot sleep (insomnia)', ' Frequent headaches', ' Low mood / feeling down', ' Dizziness or vertigo'],
    next: () => 'q_duration',
    sector: () => 'GENERAL',
  },

  // ── JOINT (path: start → q_joint → q_ayurvedic → DONE = 3 questions) ──
  q_joint: {
    id: 'q_joint',
    text: 'Which area is most affected?',
    type: 'options',
    options: [' Knee or leg pain', ' Lower back pain', ' Shoulder or neck pain', ' Wrist or finger pain', ' Whole body ache'],
    next: () => 'q_ayurvedic',
    sector: () => 'GENERAL',
  },

  // ── SKIN (path: start → q_skin → q_ayurvedic → DONE = 3 questions) ──
  q_skin: {
    id: 'q_skin',
    text: 'What is happening with your skin?',
    type: 'options',
    options: [' Rash or redness', ' Itching or allergic reaction', ' Acne or pimples', ' Dry, flaky or peeling skin', ' Wound that is not healing'],
    next: () => 'q_ayurvedic',
    sector: () => 'SKIN',
  },

  // ── CHEST (path: start → q_chest → q_duration → DONE = 3 questions) ──
  q_chest: {
    id: 'q_chest',
    text: 'What chest or breathing issue are you feeling?',
    type: 'options',
    options: [' Chest pain or tightness', ' Shortness of breath', ' Fast or irregular heartbeat', ' Persistent cough or wheezing', '🩸 Coughing up blood'],
    next: () => 'q_duration',
    sector: () => 'GENERAL',
  },

  // ── EYES (path: start → q_eyes → q_duration → DONE = 3 questions) ──
  q_eyes: {
    id: 'q_eyes',
    text: 'Which issue are you experiencing?',
    type: 'options',
    options: ['👁️ Blurry or weak vision', '🔴 Red or itchy eyes', '👂 Ear pain or hearing loss', '👃 Blocked nose or sinuses', '💧 Watery or discharge from eyes'],
    next: () => 'q_duration',
    sector: () => 'GENERAL',
  },

  // ── SHARED Q3: DURATION ──
  q_duration: {
    id: 'q_duration',
    text: 'How long have you been experiencing this?',
    type: 'options',
    options: ['Just today', '2–3 days', 'About a week', 'More than a month'],
    next: () => 'DONE',
  },

  // ── SHARED Q3: AYURVEDIC PREFERENCE ──
  q_ayurvedic: {
    id: 'q_ayurvedic',
    text: 'Do you prefer Ayurvedic / traditional treatment or modern medicine?',
    type: 'options',
    options: ['🌿 Ayurvedic / herbal', '💊 Modern (allopathic)', '🤷 No preference'],
    next: () => 'DONE',
  },
};

// ─── SECTOR LOGIC ─────────────────────────────────────────────────────────────
const getSector = (answers) => {
  const area = answers.start || '';
  if (area.includes('Teeth')) return { sector: 'DENTAL', label: 'Dentist' };
  if (answers.q_ayurvedic?.includes('Ayurvedic')) return { sector: 'AYURVEDIC', label: 'Ayurvedic Doctor' };
  if (area.includes('Skin')) return { sector: 'SKIN', label: 'Skin Specialist' };
  if (area.includes('Muscle') || area.includes('Joint') || area.includes('Stomach')) {
    if (answers.q_ayurvedic?.includes('Ayurvedic')) return { sector: 'AYURVEDIC', label: 'Ayurvedic Doctor' };
  }
  return { sector: 'GENERAL', label: 'General Physician' };
};


const getReason = (answers, label) => {
  const area = answers.start || '';
  if (area.includes('Teeth')) return 'Your symptoms point to a dental issue. A dentist can diagnose and treat it effectively.';
  if (answers.q_ayurvedic?.includes('Ayurvedic')) return 'Since you prefer traditional/herbal medicine, an Ayurvedic practitioner is the right fit.';
  if (area.includes('Stomach')) return 'For digestive issues, a general physician will evaluate you and prescribe the right treatment.';
  if (area.includes('Skin')) return 'Skin issues are best assessed by a physician who can identify the cause — infection, allergy, or other.';
  if (area.includes('Chest')) return 'Chest symptoms need to be evaluated by a doctor right away to rule out serious conditions.';
  return `For ${area.replace(/[^\w\s]/g, '').trim() || 'your'} symptoms, a ${label} is the best starting point.`;
};

// ─── CLINIC CARD (shown inside chat) ─────────────────────────────────────────
const sectorColors = {
  GENERAL: '#0d9488',
  AYURVEDIC: '#d97706',
  DENTAL: '#7c3aed',
  SKIN: '#db2777',
};

const ClinicCard = ({ clinic, onRoute, onBook }) => {
  const color = sectorColors[(clinic.sector || 'GENERAL').toUpperCase()] || '#0d9488';
  return (
    <div style={{
      background: 'white', border: `1.5px solid ${color}30`,
      borderRadius: 12, padding: '12px 14px', marginBottom: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{clinic.clinic_name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
            Dr. {clinic.doctor_name || 'Doctor'}
            {clinic.specialization ? ` · ${clinic.specialization}` : ''}
          </div>
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, color, background: `${color}15`,
          padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap',
        }}>
          {(clinic.sector || 'GENERAL').toUpperCase()}
        </div>
      </div>

      {/* Address */}
      {clinic.address && (
        <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 6 }}>
          📍 {clinic.address}
        </div>
      )}

      {/* Timings */}
      <div style={{
        fontSize: 11, color: '#475569',
        background: '#f8fafc', borderRadius: 8, padding: '6px 10px',
        marginBottom: 10, lineHeight: 1.8,
      }}>
         {clinic.morning_start?.slice(0, 5) || '09:00'} – {clinic.morning_end?.slice(0, 5) || '13:00'}
        &nbsp;&nbsp;|&nbsp;&nbsp;
         {clinic.evening_start?.slice(0, 5) || '17:00'} – {clinic.evening_end?.slice(0, 5) || '21:00'}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onRoute(clinic)}
          style={{
            flex: 1, padding: '7px 0',
            background: 'white', border: `1.5px solid ${color}`,
            borderRadius: 8, fontSize: 12, fontWeight: 600,
            color, cursor: 'pointer',
          }}
        >
           Get Route
        </button>
        <button
          onClick={() => onBook(clinic)}
          style={{
            flex: 1, padding: '7px 0',
            background: color, border: 'none',
            borderRadius: 8, fontSize: 12, fontWeight: 600,
            color: 'white', cursor: 'pointer',
          }}
        >
          Book Appointment →
        </button>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const SymptomChatbot = ({ onRecommend, clinics = [], onRouteRequest, onClinicSelect }) => {
  const [messages, setMessages] = useState([{ from: 'bot', text: questionMap.start.text }]);
  const [currentQId, setCurrentQId] = useState('start');
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nearbyClinics, setNearbyClinics] = useState([]);
  const bottomRef = useRef(null);

  const currentQ = questionMap[currentQId];

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, nearbyClinics]);

  const handleAnswer = async (answer) => {
    const newAnswers = { ...answers, [currentQ.id]: answer };
    setAnswers(newAnswers);

    const newMessages = [...messages, { from: 'user', text: answer }];
    const nextId = currentQ.next(newAnswers);

    if (nextId !== 'DONE' && questionMap[nextId]) {
      newMessages.push({ from: 'bot', text: questionMap[nextId].text });
      setMessages(newMessages);
      setCurrentQId(nextId);
      return;
    }
    

    // Done — analyse
    setDone(true);
    setIsAnalyzing(true);
    setMessages([...newMessages, { from: 'bot', text: '🔍 Analysing your symptoms...', isLoading: true }]);

    const { sector, label } = getSector(newAnswers);
    const reason = getReason(newAnswers, label);
    const fallback = { sector, label, reason };

    let finalRec = fallback;
    try {
      const { data } = await getSymptomRecommendation(newAnswers);
      if (data?.sector) finalRec = { sector: data.sector, label: data.label, reason: data.reason };
    } catch (_) {}

    // Filter clinics for this sector

const sectorKeywords = {
  GENERAL: ['general', 'physician', 'gp', 'medicine', 'family'],
  DENTAL: ['dental', 'dentist', 'teeth', 'tooth', 'oral'],
  AYURVEDIC: ['ayurvedic', 'ayurveda', 'herbal', 'naturo'],
  SKIN: ['skin', 'derma', 'cosmet'],
};

const matched = clinics.filter((c) => {
  const s = (c.sector || '').toLowerCase();
  if (!s) return finalRec.sector === 'GENERAL'; // no sector = treat as general
  // Exact match first
  if (s.toUpperCase() === finalRec.sector) return true;
  // Keyword match
  return (sectorKeywords[finalRec.sector] || []).some((kw) => s.includes(kw));
});

    setRecommendation(finalRec);
    setNearbyClinics(matched.slice(0, 3)); // show top 3 in chat

    setMessages((prev) => [
      ...prev.filter((m) => !m.isLoading),
      {
        from: 'bot',
        text: `Based on your symptoms, I recommend a **${finalRec.label}**. ${finalRec.reason}`,
        isRecommendation: true,
      },
    ]);

    if (onRecommend) onRecommend(finalRec.sector);
    setIsAnalyzing(false);
  };

  const reset = () => {
    setMessages([{ from: 'bot', text: questionMap.start.text }]);
    setCurrentQId('start');
    setAnswers({});
    setDone(false);
    setRecommendation(null);
    setIsAnalyzing(false);
    setNearbyClinics([]);
    if (onRecommend) onRecommend(null);
  };

  const renderText = (text) =>
    text.split(/\*\*(.*?)\*\*/g).map((p, i) =>
      i % 2 === 1 ? <strong key={i}>{p}</strong> : p
    );

  const sectorColor = recommendation ? (sectorColors[recommendation.sector] || '#0d9488') : '#0d9488';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'white', borderRadius: 18,
      border: '1px solid #e2e8f0', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
        background: 'linear-gradient(135deg, #f0fdfa, #ecfdf5)',
        flexShrink: 0,
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>🩺 Symptom Guide</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          Answer a few questions — I'll find the right doctor for you.
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 16px 8px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: m.from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: m.from === 'user'
                ? 'linear-gradient(135deg, #0d9488, #0f766e)'
                : m.isRecommendation ? '#f0fdfa' : '#f8fafc',
              color: m.from === 'user' ? 'white' : '#0f172a',
              fontSize: 13.5, lineHeight: 1.6,
              border: m.isRecommendation ? '1px solid #a7f3d0' : m.from === 'bot' ? '1px solid #f1f5f9' : 'none',
              fontStyle: m.isLoading ? 'italic' : 'normal',
            }}>
              {renderText(m.text)}
            </div>
          </div>
        ))}

        {/* Recommendation summary card */}
        {recommendation && (
          <div style={{
            background: `linear-gradient(135deg, ${sectorColor}12, ${sectorColor}06)`,
            border: `1.5px solid ${sectorColor}40`,
            borderRadius: 14, padding: '14px 16px', marginTop: 4,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: sectorColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
               Recommended Specialist
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
              {recommendation.label}
            </div>

            {/* Clinic count */}
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
              {nearbyClinics.length > 0
                ? `Showing ${nearbyClinics.length} nearby ${recommendation.label.toLowerCase()} clinic${nearbyClinics.length > 1 ? 's' : ''} — map is also filtered.`
                : `No registered ${recommendation.label.toLowerCase()} clinics found in the app yet.`}
            </div>

            {/* Clinic cards inside chat */}
            {nearbyClinics.map((clinic) => (
              <ClinicCard
                key={clinic.clinic_id}
                clinic={clinic}
                onRoute={(c) => onRouteRequest && onRouteRequest(c)}
                onBook={(c) => onClinicSelect && onClinicSelect(c)}
              />
            ))}

            <button
              onClick={reset}
              style={{
                marginTop: 4, padding: '7px 14px',
                background: 'white', border: `1px solid ${sectorColor}60`,
                borderRadius: 8, fontSize: 12, fontWeight: 600,
                color: sectorColor, cursor: 'pointer',
              }}
            >
              🔄 Start Over
            </button>
          </div>
        )}

        {/* Option buttons */}
        {!done && !isAnalyzing && currentQ?.type === 'options' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {currentQ.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                style={{
                  padding: '8px 14px', borderRadius: 20,
                  border: '1.5px solid #e2e8f0', background: 'white',
                  fontSize: 12.5, fontWeight: 600, color: '#334155',
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0d9488';
                  e.currentTarget.style.background = '#f0fdfa';
                  e.currentTarget.style.color = '#0d9488';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default SymptomChatbot;