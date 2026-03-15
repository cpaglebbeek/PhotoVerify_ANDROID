import { useState } from 'react';
import { injectVirtualData, extractVirtualData, generateFingerprint } from '../utils/virtualStorage';

interface Props {
  image: HTMLImageElement | null;
}

export default function CopyrightCreator({ image }: Props) {
  const [uid, setUid] = useState<string>('A1B2C3');
  const [injectedDataUrl, setInjectedDataUrl] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  // Auto-generate fingerprint when image is provided
  useState(() => {
    if (image) {
      const canvas = document.createElement('canvas');
      canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);
      generateFingerprint(ctx.getImageData(0, 0, canvas.width, canvas.height)).then(setFingerprint);
    }
  });

  const injectData = () => {
    if (!image) return;
    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    // Use sRGB to prevent browser color mangling
    const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const watermarkedData = injectVirtualData(imageData, uid);
    ctx.putImageData(watermarkedData, 0, 0);

    // Verify immediately on the same context
    const testData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const testResult = extractVirtualData(testData);
    
    if (testResult && testResult.uid === uid.toUpperCase()) {
      console.log(`Self-Test Success: UID ${testResult.uid} verified at 100% scale.`);
      setInjectedDataUrl(canvas.toDataURL('image/png'));
    } else {
      console.error("Self-Test Failed.", { expected: uid, found: testResult?.uid, diagnostics: testResult?.diagnostics });
      alert(`Self-test failed. The image structure may be incompatible with this protection level. (Found: ${testResult?.uid || 'None'})`);
    }
  };

  return (
    <div className="component-container">
      <div className="input-group">
        {!image && <p style={{ color: '#e74c3c' }}>Please upload a photo in the first step.</p>}
        
        {image && fingerprint && (
          <div className="memory-info" style={{ background: '#111', padding: '15px', borderLeft: '4px solid #646cff' }}>
            <p><strong>Original Fingerprint:</strong></p>
            <code style={{ fontSize: '0.8em', color: '#61dafb' }}>{fingerprint}</code>
            <label style={{ marginTop: '10px' }}>Stamp Code (6 Hex Chars): 
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
        <button onClick={injectData} className="primary-button">Embed Invisible Stamp</button>
      )}

      {injectedDataUrl && (
        <div className="results success">
          <h3>Stamp Embedded!</h3>
          <p>This version now contains your secret code. Download it below.</p>
          <div className="download-links">
            <a href={injectedDataUrl} download={`stamped_${uid}.png`} className="download-btn">Download Protected Photo</a>
          </div>
        </div>
      )}
    </div>
  );
}
