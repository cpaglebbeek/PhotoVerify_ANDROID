import { useState } from 'react';
import CopyrightCreator from './components/CopyrightCreator';
import CopyrightVerifier from './components/CopyrightVerifier';
import TimeAnchorCreator from './components/TimeAnchorCreator';
import TimeAnchorVerifier from './components/TimeAnchorVerifier';
import './App.css';

type Mode = 'START' | 'PROTECT' | 'VERIFY';

function App() {
  const [mode, setMode] = useState<Mode>('START');

  return (
    <div className="App">
      <header className="App-header">
        <h1>📸 De Foto-Kluis <small>v7.0</small></h1>
        <p className="subtitle">Jouw foto's, voor altijd van jou.</p>
      </header>

      <main className="wizard-container">
        {mode === 'START' && (
          <div className="welcome-screen">
            <div className="concept-box">
              <h3>Wat doet deze app? (Uitleg voor kinderen)</h3>
              <p>
                Stel je voor dat je een prachtige tekening hebt gemaakt. Je wilt hem aan de hele wereld laten zien, 
                maar je bent bang dat iemand zegt: "Ik heb deze getekend!". 
              </p>
              <p>
                <strong>De Foto-Kluis doet twee dingen:</strong>
              </p>
              <ol>
                <li><strong>Onzichtbare Stempel:</strong> We zetten een geheime code in de pixels van je foto. Niemand ziet het, maar een computer kan het altijd terugvinden.</li>
                <li><strong>Tijd-Bewijs:</strong> We maken een digitaal briefje dat bewijst dat jij de foto al had op de dag van vandaag. Zo kan niemand later liegen dat zij de eerste waren!</li>
              </ol>
            </div>

            <div className="action-cards">
              <button className="card protect" onClick={() => setMode('PROTECT')}>
                <span className="icon">🛡️</span>
                <h2>Ik heb een nieuwe foto</h2>
                <p>Ik wil mijn eigen werk beschermen.</p>
              </button>

              <button className="card verify" onClick={() => setMode('VERIFY')}>
                <span className="icon">🔍</span>
                <h2>Ik wil iets controleren</h2>
                <p>Kijken of een foto van mij is.</p>
              </button>
            </div>
          </div>
        )}

        {mode === 'PROTECT' && (
          <div className="wizard-flow">
            <button className="back-btn" onClick={() => setMode('START')}>← Terug naar begin</button>
            <div className="step-box">
              <div className="step-header">🖼️ Stap 1: Onzichtbare Stempel zetten</div>
              <CopyrightCreator />
            </div>
            <div className="step-divider">En dan nu...</div>
            <div className="step-box">
              <div className="step-header">🔒 Stap 2: Jouw Eigendomsbewijs maken</div>
              <TimeAnchorCreator />
            </div>
            <div className="manual-footer">
              <h4>Wat moet ik nu doen?</h4>
              <p>1. Download de <strong>Beveiligde Foto</strong> (deze kun je delen op internet).</p>
              <p>2. Download het <strong>.JSON bestand</strong> (dit is je kluis-sleutel).</p>
              <p>3. Bewaar de originele foto op een veilige plek!</p>
            </div>
          </div>
        )}

        {mode === 'VERIFY' && (
          <div className="wizard-flow">
            <button className="back-btn" onClick={() => setMode('START')}>← Terug naar begin</button>
            <div className="step-box">
              <div className="step-header">🔎 Zoeken naar de onzichtbare stempel</div>
              <CopyrightVerifier />
            </div>
            <div className="step-divider">Of...</div>
            <div className="step-box">
              <div className="step-header">📜 Het officiële bewijs controleren</div>
              <TimeAnchorVerifier />
            </div>
            <div className="manual-footer">
              <h4>Hoe werkt het controleren?</h4>
              <p>Heb je een foto gevonden waarvan je denkt dat hij van jou is? Upload hem hier.</p>
              <p>Als je ook het <strong>.JSON bewijsbestand</strong> hebt, kunnen we 100% zekerheid geven.</p>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>&copy; 2026 De Foto-Kluis - Gebouwd voor echte makers</p>
      </footer>
    </div>
  );
}

export default App;
