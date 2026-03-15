import { useState, type ChangeEvent } from 'react';
import { extractVirtualData, type VirtualMemory } from '../utils/virtualStorage';

export default function CopyrightVerifier() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [memory, setMemory] = useState<VirtualMemory | null>(null);
  const [scanAttempted, setScanAttempted] = useState(false);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setMemory(null);
          setScanAttempted(false);
        };
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
    const result = extractVirtualData(ctx.getImageData(0, 0, canvas.width, canvas.height));
    setMemory(result);
    setScanAttempted(true);
  };

  return (
    <div className="component-container">
      <h2>2. Ironclad Scanner (v5.0)</h2>
      <p>Recover 6-char Hex UID from image fragments using global majority voting.</p>
      
      <div className="upload-section">
        <label>Image to scan: <input type="file" accept="image/*" onChange={handleFileUpload} /></label>
      </div>
      
      {image && (
        <button onClick={scan} className="primary-button">Scan for Ironclad UID</button>
      )}

      {scanAttempted && memory && (
        <div className="verification-result success">
          <h3>UID Recovered:</h3>
          <p>Extracted UID: <strong style={{ fontSize: '2em', color: '#0f0', letterSpacing: '2px' }}>{memory.uid}</strong></p>
          <p>Detection Confidence: <strong>{(memory.confidence * 100).toFixed(1)}%</strong></p>
          <p style={{ fontSize: '0.85em', color: '#888' }}>{memory.diagnostics}</p>
        </div>
      )}

      {scanAttempted && !memory && (
        <div className="verification-result error">
          <p>No Ironclad UID detected in this image fragment.</p>
        </div>
      )}
    </div>
  );
}
