import { useState } from 'react';
import { getSymptomRecommendation } from '../../services/api';

const questions = [
  { id: 'symptom', text: "Hello!  I'll help you find the right doctor. What is your main symptom today?", type: 'text' },
  { id: 'duration', text: 'How long have you been experiencing this?', type: 'options', options: ['Just today', '2-3 days', 'More than a week', 'Chronic / recurring'] },
  { id: 'dental', text: 'Is it related to your teeth, gums, or mouth?', type: 'options', options: ['Yes', 'No'] },
  { id: 'traditional', text: 'Do you prefer traditional / Ayurvedic medicine?', type: 'options', options: ['Yes, I prefer Ayurvedic', 'No, allopathic is fine', 'No preference'] },
];

const getFallbackRecommendation = (newAnswers) => {
  let sector = 'GENERAL';
  let label = 'General Physician';
  let reason = 'Based on your symptoms, a general physician can diagnose and treat your condition.';

  if (newAnswers.dental === 'Yes') {
    sector = 'DENTAL';
    label = 'Dentist';
    reason = 'Since your symptoms are related to teeth/gums, a dental specialist is recommended.';
  } else if (newAnswers.traditional?.includes('Ayurvedic')) {
    sector = 'AYURVEDIC';
    label = 'Ayurvedic Doctor';
    reason = 'Based on your preference for traditional medicine, an Ayurvedic practitioner can help.';
  }

  return {
    sector,
    label,
    reason,
    response: `Based on your answers, I recommend visiting a ${label}. ${reason}`,
  };
};

const SymptomChatbot = ({ onRecommend }) => {
  const [messages, setMessages] = useState([{ from: 'bot', text: questions[0].text }]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnswer = async (answer) => {
    const q = questions[currentQ];
    const newAnswers = { ...answers, [q.id]: answer };
    setAnswers(newAnswers);

    const newMessages = [...messages, { from: 'user', text: answer }];
    const nextQ = currentQ + 1;

    if (nextQ < questions.length) {
      newMessages.push({ from: 'bot', text: questions[nextQ].text });
      setMessages(newMessages);
      setCurrentQ(nextQ);
      setInput('');
      return;
    }

    setDone(true);
    setIsAnalyzing(true);
    setMessages([...newMessages, { from: 'bot', text: 'Thinking through your symptoms with Gemini...', isLoading: true }]);

    const fallback = getFallbackRecommendation(newAnswers);

    try {
      const { data } = await getSymptomRecommendation(newAnswers);
      const finalRecommendation = {
        sector: data?.sector || fallback.sector,
        label: data?.label || fallback.label,
        reason: data?.reason || fallback.reason,
        response: data?.response || fallback.response,
      };

      setRecommendation(finalRecommendation);
      setMessages((prev) => [
        ...prev.filter((msg) => !msg.isLoading),
        { from: 'bot', text: finalRecommendation.response, isRecommendation: true },
      ]);
      if (onRecommend) onRecommend(finalRecommendation.sector);
    } catch (err) {
      setRecommendation(fallback);
      setMessages((prev) => [
        ...prev.filter((msg) => !msg.isLoading),
        { from: 'bot', text: fallback.response, isRecommendation: true },
      ]);
      if (onRecommend) onRecommend(fallback.sector);
    } finally {
      setIsAnalyzing(false);
      setInput('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isAnalyzing) return;
    handleAnswer(input.trim());
  };

  const reset = () => {
    setMessages([{ from: 'bot', text: questions[0].text }]);
    setCurrentQ(0);
    setAnswers({});
    setInput('');
    setDone(false);
    setRecommendation(null);
    setIsAnalyzing(false);
    if (onRecommend) onRecommend(null);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'white', borderRadius: 18,
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #f1f5f9',
        background: 'linear-gradient(135deg, #f0fdfa, #ecfdf5)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
           Symptom Guide
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          Not sure which doctor? Answer a few questions.
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
          }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: m.from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: m.from === 'user'
                ? 'linear-gradient(135deg, #0d9488, #0f766e)'
                : m.isRecommendation ? '#f0fdfa' : '#f8fafc',
              color: m.from === 'user' ? 'white' : '#0f172a',
              fontSize: 13.5, lineHeight: 1.6,
              border: m.isRecommendation ? '1px solid #a7f3d0' : m.from === 'bot' ? '1px solid #f1f5f9' : 'none',
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {/* Recommendation card */}
        {recommendation && (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdfa, #d1fae5)',
            border: '1px solid #a7f3d0',
            borderRadius: 14, padding: '16px 18px',
            marginTop: 4,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Recommended Specialist
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#065f46', marginBottom: 4 }}>
              {recommendation.label}
            </div>
            <div style={{ fontSize: 12.5, color: '#047857', lineHeight: 1.5 }}>
              Map is now showing nearby {recommendation.label.toLowerCase()} clinics
            </div>
            <button
              onClick={reset}
              style={{
                marginTop: 12, padding: '7px 14px',
                background: 'white', border: '1px solid #a7f3d0',
                borderRadius: 8, fontSize: 12, fontWeight: 600,
                color: '#059669', cursor: 'pointer',
              }}
            >
               Start Over
            </button>
          </div>
        )}

        {/* Options buttons */}
        {!done && !isAnalyzing && currentQ < questions.length && questions[currentQ].type === 'options' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {questions[currentQ].options.map(opt => (
              <button
                key={opt}
                onClick={() => {
                  handleAnswer(opt);
                }}
                style={{
                  padding: '8px 14px', borderRadius: 20,
                  border: '1.5px solid #e2e8f0', background: 'white',
                  fontSize: 12.5, fontWeight: 600, color: '#334155',
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                onMouseEnter={e => {
                  e.target.style.borderColor = '#0d9488';
                  e.target.style.background = '#f0fdfa';
                  e.target.style.color = '#0d9488';
                }}
                onMouseLeave={e => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = 'white';
                  e.target.style.color = '#334155';
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      {!done && !isAnalyzing && currentQ < questions.length && questions[currentQ].type === 'text' && (
        <form onSubmit={handleSubmit} style={{
          padding: '12px 16px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex', gap: 8,
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your symptom..."
            style={{
              flex: 1, padding: '10px 14px',
              border: '1.5px solid #e2e8f0', borderRadius: 10,
              fontSize: 13.5, outline: 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          />
          <button type="submit" style={{
            padding: '10px 18px',
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            color: 'white', border: 'none', borderRadius: 10,
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
            Send
          </button>
        </form>
      )}
    </div>
  );
};

export default SymptomChatbot;
