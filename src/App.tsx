import CopyrightCreator from './components/CopyrightCreator';
import CopyrightVerifier from './components/CopyrightVerifier';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Picture Copyright v2.0 (Analogue Robust)</h1>
        <p>Protect images with hidden UIDs that survive cropping, blurring, and B/W conversion.</p>
      </header>
      <main className="dashboard">
        <section className="dashboard-section">
          <CopyrightCreator />
        </section>
        <hr />
        <section className="dashboard-section">
          <CopyrightVerifier />
        </section>
      </main>
      <footer>
        <p>&copy; 2026 Picture Copyright System</p>
      </footer>
    </div>
  );
}

export default App;
