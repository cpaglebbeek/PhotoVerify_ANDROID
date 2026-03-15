import { useState, type ChangeEvent } from 'react';
import { extractVirtualDataAsync } from '../utils/virtualStorage';
import { getHistory, type HistoryEntry } from '../utils/history';

interface Props {
  onStart: () => void;
  onProgress: (p: number) => void;
  onEnd: () => void;
}

export default function CopyrightVerifier({ onStart, onProgress, onEnd }: Props) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [result, setResult] = useState<{ uid: string, confidence: number, diagnostics?: string } | null>(null);
  const [scanAttempted, setScanAttempted] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const loadFile = (file: File | Blob, name?: string) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => { 
        setImage(img); 
        setFilename(name || (file as File).name || 'recent_photo.png');
        setScanAttempted(false); 
        setResult(null); 
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const scan = async () => {
    if (!image) return;
    onStart();
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const data = await extractVirtualDataAsync(imageData, onProgress);
    if (data) {
      setResult({ uid: data.uid, confidence: data.confidence, diagnostics: data.diagnostics });
    } else {
      setResult(null);
    }
    setScanAttempted(true);
    onEnd();
  };

  return (
    <div className="component-container">
      <div className="upload-section">
        <div style={{ display: 'flex', gap: '10px' }}>
          <label className="file-dropzone" style={{ flex: 1, padding: '1rem' }}>
            <input type="file" accept="image/*" onChange={handleFileUpload} />
            <span>📁 Browse Folders</span>
          </label>
          <button className="btn btn-secondary" onClick={() => setShowRecent(!showRecent)} title="Recent Files">
            🕒 Recent
          </button>
        </div>
      </div>

      {showRecent && (
        <div className="card-glass mt-1" style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)' }}>
          <h4 style={{ fontSize: '0.8rem', margin: '0 0 10px 0' }}>RECENTLY PROTECTED</h4>
          {getHistory('image').length === 0 && <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>No recent files found.</p>}
          {getHistory('image').map((entry: HistoryEntry) => (
            <div key={entry.id} className="info-sub" style={{ padding: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }} onClick={() => { setShowRecent(false); /* In a real app we'd load the blob here */ }}>
              <span style={{ fontSize: '0.8rem' }}>🖼️ {entry.filename}</span>
              <small style={{ color: 'var(--text-dim)' }}>{new Date(entry.timestamp).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      )}
      
      {image && (
        <div className="mt-1 text-center">
          <p style={{ color: 'var(--success)', fontSize: '0.8rem' }}>✅ Loaded: {filename}</p>
          <button onClick={scan} className="btn btn-primary mt-1">Scan for Invisible Stamp</button>
        </div>
      )}

      {scanAttempted && result && (
        <div className="results success">
          <h3>Invisible Stamp Found!</h3>
          <p>Found Code: <strong style={{ fontSize: '1.5em', color: '#0f0', letterSpacing: '2px' }}>{result.uid}</strong></p>
          <p>Confidence: <strong>{(result.confidence * 100).toFixed(1)}%</strong></p>
        </div>
      )}
    </div>
  );
}
