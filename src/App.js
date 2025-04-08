import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [darkMode, setDarkMode] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Speech synthesis setup
  useEffect(() => {
    // Apply dark mode to body
    document.body.className = darkMode ? 'dark-mode' : '';
    
    // Stop speaking when component unmounts
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [darkMode]);

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
    utterance.rate = speechRate;
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
    utterance.rate = speechRate;
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };
  
  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }
    
    setPdfLoading(true);
    
    try {
      // We need to use a PDF parsing library
      // For this example, we'll use pdf.js which needs to be imported via CDN
      if (!window.pdfjsLib) {
        // Load pdf.js dynamically if not already loaded
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
        script.onload = () => processPdf(file);
        document.head.appendChild(script);
      } else {
        processPdf(file);
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Failed to process PDF. Please try again.');
      setPdfLoading(false);
    }
  };
  
  const processPdf = async (file) => {
    try {
      const pdfjsLib = window.pdfjsLib;
      
      // Set workerSrc property
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      
      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let extractedText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        extractedText += pageText + '\n\n';
      }
      
      // Set the extracted text as notes
      setNotes(extractedText);
      setPdfLoading(false);
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      alert('Failed to extract text from PDF. Please try again.');
      setPdfLoading(false);
    }
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <header className="app-header">
        <h1>Note Reader & Summarizer</h1>
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="theme-toggle"
          aria-label="Toggle dark mode"
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </header>
      
      <div className="control-panel">
        <div className="speed-control">
          <label htmlFor="speed-selector">Reading Speed:</label>
          <select 
            id="speed-selector" 
            value={speechRate} 
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="select-control"
          >
            <option value="0.5">0.5x (Slow)</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x (Normal)</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x (Fast)</option>
          </select>
        </div>
        
        <div className="file-upload">
          <label htmlFor="pdf-upload" className={`upload-label ${pdfLoading ? 'pulsing' : ''}`}>
            {pdfLoading ? 'Processing PDF...' : 'Upload PDF'}
          </label>
          <input 
            type="file" 
            id="pdf-upload" 
            accept=".pdf" 
            onChange={handlePdfUpload} 
            disabled={pdfLoading}
            className="file-input"
          />
        </div>
      </div>
      
      <div className="notes-section">
        <h2>Your Notes</h2>
        <textarea
          className="notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter your notes here or upload a PDF..."
          rows={10}
        />
        <div className="button-group">
          <button 
            onClick={readNotes}
            className="button"
            disabled={pdfLoading || !notes.trim()}
          >
            {speaking ? '🔊 Stop Reading' : '🔊 Read Notes Aloud'}
          </button>
          <button 
            onClick={summarizeNotes}
            className="button"
            disabled={!notes.trim() || summarizing || pdfLoading}
          >
            {summarizing ? '⏳ Summarizing...' : '📝 Summarize Notes'}
          </button>
        </div>
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
            disabled={!summary.trim() || speaking}
          >
            🔊 Read Summary Aloud
          </button>
        </div>
      )}
    </div>
  );
}

export default App;