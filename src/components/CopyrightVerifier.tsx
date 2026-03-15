import { useState, type ChangeEvent } from 'react';
import { extractVirtualData } from '../utils/virtualStorage';

export default function CopyrightVerifier() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [result, setResult] = useState<{ uid: string, confidence: number, diagnostics?: string } | null>(null);
  const [scanAttempted, setScanAttempted] = useState(false);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => { setImage(img); setScanAttempted(false); setResult(null); };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const scan = () => {
    if (!image) return;
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = extractVirtualData(imageData);
    if (data) {
      setResult({ uid: data.uid, confidence: data.confidence, diagnostics: data.diagnostics });
    } else {
      setResult(null);
    }
    setScanAttempted(true);
  };

  return (
    <div className="component-container">
      <div className="upload-section">
        <label>Photo to scan: <input type="file" accept="image/*" onChange={handleFileUpload} /></label>
      </div>
      
      {image && <button onClick={scan} className="primary-button">Scan for Invisible Stamp</button>}

      {scanAttempted && result && (
        <div className="verification-result success">
          <h3>Invisible Stamp Found!</h3>
          <p>Found Code: <strong style={{ fontSize: '1.5em', color: '#0f0', letterSpacing: '2px' }}>{result.uid}</strong></p>
          <p>Confidence: <strong>{(result.confidence * 100).toFixed(1)}%</strong></p>
          <p style={{ fontSize: '0.8em', color: '#888' }}>{result.diagnostics}</p>
        </div>
      )}

      {scanAttempted && !result && (
        <div className="verification-result error">
          <p>No invisible stamp detected in this photo.</p>
        </div>
      )}
    </div>
  );
}
