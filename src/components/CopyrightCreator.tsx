import { useState, type ChangeEvent } from 'react';
import { injectVirtualData, generateFingerprint } from '../utils/virtualStorage';

export default function CopyrightCreator() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [uid, setUid] = useState<string>('A1B2C3');
  const [injectedDataUrl, setInjectedDataUrl] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          setImage(img);
          setInjectedDataUrl(null);
          const canvas = document.createElement('canvas');
          canvas.width = img.width; canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const f = await generateFingerprint(ctx.getImageData(0, 0, canvas.width, canvas.height));
          setFingerprint(f);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const injectData = () => {
    if (!image) return;
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const watermarkedData = injectVirtualData(imageData, uid);
    ctx.putImageData(watermarkedData, 0, 0);
    setInjectedDataUrl(canvas.toDataURL('image/png'));
  };

  return (
    <div className="component-container">
      <h2>1. Ironclad UID Injector (v5.0)</h2>
      <p>Optimized for extreme redundancy using a fixed 6-char Hex UID.</p>
      
      <div className="input-group">
        <label>Base Image: <input type="file" accept="image/*" onChange={handleImageUpload} /></label>
        
        {image && fingerprint && (
          <div className="memory-info" style={{ background: '#111', padding: '15px', borderLeft: '4px solid #646cff' }}>
            <p><strong>Original Fingerprint:</strong></p>
            <code style={{ fontSize: '0.8em', color: '#61dafb' }}>{fingerprint}</code>
            <label style={{ marginTop: '10px' }}>UID (6 Hex Chars): 
              <input 
                type="text" 
                value={uid} 
                onChange={e => setUid(e.target.value.toUpperCase().replace(/[^0-9A-F]/g, ''))} 
                maxLength={6}
                style={{ width: '100%', background: '#333', color: 'white', fontFamily: 'monospace' }}
              />
            </label>
          </div>
        )}
      </div>
      
      {image && uid.length === 6 && (
        <button onClick={injectData} className="primary-button">Generate Ironclad Protected Image</button>
      )}

      {injectedDataUrl && (
        <div className="results">
          <h3>Ironclad UID Embedded:</h3>
          <p>Tiled redundancy across entire image. Survives heavy cropping & rotation.</p>
          <div className="download-links">
            <a href={injectedDataUrl} download={`ironclad_${uid}.png`} className="download-btn">Download Protected Image</a>
          </div>
        </div>
      )}
    </div>
  );
}
