import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  // Speech synthesis setup
  useEffect(() => {
    // Stop speaking when component unmounts
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const readNotes = () => {
    if (!window.speechSynthesis) {
      alert('Speech synthesis is not supported in your browser');
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    if (!notes.trim()) {
      alert('Please enter some notes to read');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(notes);
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const summarizeNotes = () => {
    setSummarizing(true);
    
    // Simple summarization logic - we'll extract first sentence from each paragraph
    // and limit to a certain length
    try {
      const paragraphs = notes.split('\n').filter(p => p.trim() !== '');
      
      // Get first sentence from each paragraph or the whole paragraph if no sentence ending
      const sentences = paragraphs.map(p => {
        const sentenceMatch = p.match(/^.*?[.!?](?:\s|$)/);
        return sentenceMatch ? sentenceMatch[0].trim() : p.trim();
      });
      
      // Limit the number of sentences if there are too many
      const maxSentences = 5;
      const summaryText = sentences.slice(0, maxSentences).join(' ');
      
      // Add ellipsis if we truncated the summary
      const finalSummary = sentences.length > maxSentences ? summaryText + '...' : summaryText;
      
      setSummary(finalSummary);
    } catch (error) {
      setSummary('Error creating summary. Please try again.');
      console.error('Summarization error:', error);
    }
    
    setSummarizing(false);
  };

  const readSummary = () => {
    if (!window.speechSynthesis) {
      alert('Speech synthesis is not supported in your browser');
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    if (!summary.trim()) {
      alert('Please summarize your notes first');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="app-container">
      <h1>Note Reader & Summarizer</h1>
      
      <div className="notes-section">
        <h2>Your Notes</h2>
        <textarea
          className="notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter your notes here..."
          rows={10}
        />
        <button 
          onClick={readNotes}
          className="button"
        >
          {speaking ? 'Stop Reading' : 'Read Notes Aloud'}
        </button>
        <button 
          onClick={summarizeNotes}
          className="button"
          disabled={!notes.trim() || summarizing}
        >
          {summarizing ? 'Summarizing...' : 'Summarize Notes'}
        </button>
      </div>

      {summary && (
        <div className="summary-section">
          <h2>Summary</h2>
          <div className="summary-box">
            {summary}
          </div>
          <button 
            onClick={readSummary}
            className="button"
          >
            Read Summary Aloud
          </button>
        </div>
      )}
    </div>
  );
}

export default App;