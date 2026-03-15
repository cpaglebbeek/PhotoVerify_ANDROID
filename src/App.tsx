import { useState, useEffect, useCallback, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Filesystem } from '@capacitor/filesystem';
import CopyrightVerifier from './components/CopyrightVerifier';
import TimeAnchorVerifier from './components/TimeAnchorVerifier';
import LegacyBorderVerifier from './components/LegacyBorderVerifier';
import ProcessingOverlay from './components/ProcessingOverlay';
import { injectVirtualDataAsync } from './utils/virtualStorage';
import { sha256, generateCombinedProof } from './utils/timeAnchor';
import { generatePerceptualHashDetailed } from './utils/perceptualHash';
import { bundleEvidence } from './utils/zipper';
import { getDeviceHash, checkLicense, type LicenseStatus } from './utils/license';
import versionData from './version.json';
import './App.css';

type Mode = 'START' | 'VERIFY' | 'SHIELD_AUTO' | 'SETTINGS' | 'LICENSE_CHECK';

interface UITheme {
  [key: string]: string;
}

interface UIConfig {
  themes: {
    dark: UITheme;
    light: UITheme;
  };
  branding: {
    logoUrl?: string;
  };
  platforms: {
    Mobile: { Android: { borderRadius: string; buttonPadding: string; fontSizeBase: string } };
    Desktop: { Windows: { borderRadius: string; buttonPadding: string; fontSizeBase: string } };
  };
}

interface ContentConfig {
  ui: {
    title: string;
  };
}

interface AppRestoredResult {
  pluginId: string;
  action: string;
  data: {
    url?: string;
    uri?: string;
  };
}

function App() {
  const [mode, setMode] = useState<Mode>('LICENSE_CHECK');
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [sharedImage, setSharedImage] = useState<HTMLImageElement | null>(null);
  const [sharedFilename, setSharedFilename] = useState<string>('photo.png');
  const [sharedUid, setSharedUid] = useState<string>('A1B2C3');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingMsg, setProcessingMsg] = useState('Processing...');
  const [content, setContent] = useState<ContentConfig | null>(null);
  const [uiConfig, setUiConfig] = useState<UIConfig | null>(null);

  const [licenseServer, setLicenseServer] = useState(localStorage.getItem('license_server_url') || 'https://fotolerant.nl');
  const [uiUrl, setUiUrl] = useState(localStorage.getItem('ui_config_url') || 'ui-config.json');
  const [contentUrl, setContentUrl] = useState(localStorage.getItem('content_config_url') || 'content-config.json');

  const [isSyncing, setIsSyncing] = useState(false);
  const isInitialized = useRef(false);

  const applyUIConfig = useCallback((config: UIConfig, activeTheme: 'dark' | 'light') => {
    const root = document.documentElement;
    const colors = config.themes[activeTheme];
    Object.keys(colors).forEach(key => {
      const cssKey = key.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
      root.style.setProperty(`--${cssKey}`, colors[key]);
    });
    const isMobile = window.innerWidth <= 768;
    const p = isMobile ? config.platforms.Mobile.Android : config.platforms.Desktop.Windows;
    root.style.setProperty('--radius', p.borderRadius);
    root.style.setProperty('--btn-padding', p.buttonPadding);
    root.style.setProperty('--font-size', p.fontSizeBase);
  }, []);

  const startup = useCallback(async (forceSync = false) => {
    setIsSyncing(true);
    const hash = await getDeviceHash();
    const lic = await checkLicense(hash, licenseServer, forceSync);
    setLicense(lic);
    setIsSyncing(false);

    if (lic.active) {
      try {
        const [uRes, cRes] = await Promise.all([fetch(uiUrl), fetch(contentUrl)]);
        const uData: UIConfig = await uRes.json();
        const cData: ContentConfig = await cRes.json();
        setUiConfig(uData);
        setContent(cData);
        applyUIConfig(uData, 'dark');
        setMode('START');
      } catch (e) {
        console.error("Error loading remote config, falling back to local:", e);
        const [lUi, lContent] = await Promise.all([fetch('ui-config.json'), fetch('content-config.json')]);
        const uData: UIConfig = await lUi.json();
        setUiConfig(uData);
        setContent(await lContent.json());
        applyUIConfig(uData, 'dark');
        setMode('START');
      }
    }
  }, [licenseServer, uiUrl, contentUrl, applyUIConfig]);

  const manualSync = () => startup(true);

  useEffect(() => {
    if (!isInitialized.current) {
      setTimeout(() => startup(), 0);
      isInitialized.current = true;
    }
  }, [startup]);

  useEffect(() => {
    (CapApp as any).addListener('appRestoredResult', async (data: AppRestoredResult) => {
      if (data.pluginId === 'Share' || data.action === 'send') {
        const intentData = data.data;
        const uri = intentData?.url || intentData?.uri;
        if (uri) {
          try {
            const file = await Filesystem.readFile({ path: uri });
            const img = new Image();
            img.onload = () => {
              setSharedImage(img);
              setSharedFilename(uri.split('/').pop() || 'shared_photo.png');
              setMode('SHIELD_AUTO');
            };
            img.src = `data:image/png;base64,${file.data}`;
          } catch (e) {
            console.error("Error reading shared file:", e);
          }
        }
      }
    });
  }, []);

  const copyHash = () => {
    if (license?.deviceHash) {
      navigator.clipboard.writeText(license.deviceHash);
      alert("Device ID copied to clipboard!");
    }
  };

  const startProc = (msg: string) => { setProcessingMsg(msg); setIsProcessing(true); setProgress(0); };
  const endProc = () => { setProgress(100); setTimeout(() => setIsProcessing(false), 500); };

  const runOneClickShield = async () => {
    if (!sharedImage) return;
    const code = prompt("Confirm Stamp Code:", sharedUid);
    if (!code || code.length !== 6) return;
    const finalCode = code.toUpperCase();
    setSharedUid(finalCode);
    startProc("Shielding Image...");

    const canvas = document.createElement('canvas');
    canvas.width = sharedImage.width; canvas.height = sharedImage.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!;
    ctx.drawImage(sharedImage, 0, 0);

    const borderCanvas = document.createElement('canvas');
    borderCanvas.width = canvas.width; borderCanvas.height = canvas.height;
    const bCtx = borderCanvas.getContext('2d')!;
    bCtx.drawImage(sharedImage, 0, 0, canvas.width, 1, 0, 0, canvas.width, 1);
    bCtx.drawImage(sharedImage, 0, canvas.height - 1, canvas.width, 1, 0, canvas.height - 1, canvas.width, 1);
    bCtx.drawImage(sharedImage, 0, 1, 1, canvas.height - 2, 0, 1, 1, canvas.height - 2);
    bCtx.drawImage(sharedImage, canvas.width - 1, 1, 1, canvas.height - 2, canvas.width - 1, 1, 1, canvas.height - 2);

    const interiorCanvas = document.createElement('canvas');
    interiorCanvas.width = canvas.width; interiorCanvas.height = canvas.height;
    const iCtx = interiorCanvas.getContext('2d')!;
    iCtx.drawImage(sharedImage, 0, 0);
    iCtx.clearRect(0, 0, canvas.width, 1); iCtx.clearRect(0, canvas.height - 1, canvas.width, 1);
    iCtx.clearRect(0, 1, 1, canvas.height - 2); iCtx.clearRect(canvas.width - 1, 1, 1, canvas.height - 2);
    const stamped = await injectVirtualDataAsync(iCtx.getImageData(0, 0, canvas.width, canvas.height), finalCode, (p) => setProgress(60 + p * 0.3));
    iCtx.putImageData(stamped, 0, 0);

    const hash = await sha256(stamped.data);
    const dna = generatePerceptualHashDetailed(stamped);
    const now = Date.now();
    const deed = { imageHash: hash, perceptualHash: dna.hash, timestamp: now, combinedProof: await generateCombinedProof(hash, "AUTO") };
    await bundleEvidence(canvas.toDataURL('image/png'), borderCanvas.toDataURL('image/png'), interiorCanvas.toDataURL('image/png'), deed, `${finalCode}_${sharedFilename}`);
    endProc();
    alert("ZIP Bundle Saved!");
    setMode('START');
  };

  if (mode === 'LICENSE_CHECK') {
    return (
      <div className="App" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a' }}>
        <div className="card-glass text-center" style={{ maxWidth: '400px' }}>
          <span style={{ fontSize: '4rem' }}>🛡️</span>
          <h2>Activation Required</h2>
          <div style={{ background: '#000', padding: '15px', borderRadius: '10px', margin: '20px 0', border: '1px solid #334155' }}>
            <code style={{ fontSize: '1.2rem', color: '#60a5fa', letterSpacing: '2px' }}>{license?.deviceHash || '...'}</code>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button className="btn btn-primary" onClick={copyHash} style={{ width: '100%' }}>📋 Copy ID</button>
            <button className="btn btn-nav btn-success" onClick={manualSync} disabled={isSyncing} style={{ width: '100%', padding: '12px' }}>
              {isSyncing ? '⌛ Syncing...' : '🔄 Sync with Server'}
            </button>
          </div>
          {license?.message && <p style={{ marginTop: '15px', color: license.active ? '#2ecc71' : '#ef4444' }}>{license.message}</p>}
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '20px' }}>
            Once you activate your ID, click Sync to unlock.
          </p>
        </div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="App" style={{ fontSize: 'var(--font-size)' }}>
      {isProcessing && <ProcessingOverlay progress={progress} message={processingMsg} />}
      <header className="App-header">
        <div className="header-top">
          <div className="app-branding" onClick={() => setMode('START')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px' }}>
            {uiConfig?.branding?.logoUrl ? <img src={uiConfig.branding.logoUrl} alt="Logo" style={{ height: '50px' }} /> : <span style={{ fontSize: '2.5rem' }}>📸</span>}
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ fontSize: '1.8rem', lineHeight: '1' }}>{content.ui.title}</h1>
              <small style={{ color: 'var(--text-dim)' }}>v{versionData.current}</small>
            </div>
          </div>
          <div className="nav-cluster">
            <button className="btn btn-nav" onClick={() => setMode('SETTINGS')}>⚙️</button>
            <button className="btn btn-nav" onClick={() => setMode('START')}>🏠 Home</button>
            <button className="btn btn-nav btn-success" onClick={() => setMode('SHIELD_AUTO')}>🛡️ Shield</button>
          </div>
        </div>
      </header>

      <main className="wizard-container">
        {mode === 'SETTINGS' && (
          <div className="card-glass">
            <h2>⚙️ Config</h2>
            <label>License Server:
              <input type="text" value={licenseServer} onChange={e => setLicenseServer(e.target.value)} style={{ width: '100%', marginBottom: '10px', background: '#000' }} />
            </label>
            <label>UI URL:
              <input type="text" value={uiUrl} onChange={e => setUiUrl(e.target.value)} style={{ width: '100%', marginBottom: '10px', background: '#000' }} />
            </label>
            <label>Content URL:
              <input type="text" value={contentUrl} onChange={e => setContentUrl(e.target.value)} style={{ width: '100%', background: '#000' }} />
            </label>
            <button className="btn btn-primary mt-1" onClick={() => { localStorage.setItem('license_server_url', licenseServer); localStorage.setItem('ui_config_url', uiUrl); localStorage.setItem('content_config_url', contentUrl); window.location.reload(); }}>Save & Reload</button>
          </div>
        )}

        {mode === 'SHIELD_AUTO' && (
          <div className="card-glass text-center">
            <h2>🛡️ One-Click Shield</h2>
            <label className="file-dropzone mt-1">
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setSharedFilename(file.name); const img = new Image(); img.onload = () => setSharedImage(img); img.src = URL.createObjectURL(file); }
              }} />
              {sharedImage ? <img src={sharedImage.src} style={{ maxWidth: '100%', maxHeight: '200px' }} /> : <span>Click to load photo</span>}
            </label>
            {sharedImage && <button className="btn btn-primary mt-1" onClick={runOneClickShield}>⚡ ACTIVATE SHIELD (ZIP)</button>}
          </div>
        )}

        {mode === 'START' && (
          <div className="action-cards">
            <button className="card-action protect" onClick={() => setMode('SHIELD_AUTO')}>
              <span className="icon">🛡️</span>
              <h2>Auto-Shield</h2>
              <p>ZIP Evidence Bundle</p>
            </button>
            <button className="card-action verify" onClick={() => setMode('VERIFY')}>
              <span className="icon">🔍</span>
              <h2>Manual Audit</h2>
              <p>Step-by-step verification</p>
            </button>
          </div>
        )}

        {mode === 'VERIFY' && (
          <div className="wizard-flow">
            <button className="btn btn-secondary mb-1" onClick={() => setMode('START')}>← Back</button>
            <div className="card-glass"><CopyrightVerifier onStart={() => startProc('Scanning...')} onProgress={setProgress} onEnd={endProc} /></div>
            <div className="card-glass"><TimeAnchorVerifier onStart={() => startProc('Auditing...')} onProgress={setProgress} onEnd={endProc} /></div>
            <div className="card-glass"><LegacyBorderVerifier onStart={() => startProc('Verifying...')} onProgress={setProgress} onEnd={endProc} /></div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
