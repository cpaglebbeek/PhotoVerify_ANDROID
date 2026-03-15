import { useState, type ChangeEvent } from 'react';
import { sha256, generateCombinedProof, type AnchorDeed } from '../utils/timeAnchor';

export default function TimeAnchorCreator() {
  const [imageHash, setImageHash] = useState<string | null>(null);
  const [anchorSource, setAnchorSource] = useState<string>('Bitcoin Block #834567');
  const [anchorHash, setAnchorHash] = useState<string>('0000000000000000000123456789abcdef');
  const [deed, setDeed] = useState<AnchorDeed | null>(null);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width; canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const hash = await sha256(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
          setImageHash(hash);
          setDeed(null);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const createDeed = async () => {
    if (!imageHash || !anchorHash) return;
    const combined = await generateCombinedProof(imageHash, anchorHash);
    const newDeed: AnchorDeed = {
      imageHash,
      anchorHash,
      anchorSource,
      combinedProof: combined,
      timestamp: Date.now()
    };
    setDeed(newDeed);
  };

  const downloadDeed = () => {
    if (!deed) return;
    const content = JSON.stringify(deed, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ownership_deed_${deed.imageHash.slice(0, 8)}.json`;
    a.click();
  };

  return (
    <div className="dashboard-section" style={{ borderTop: '4px solid #f1c40f' }}>
      <h2>3. Time-Anchor Deed (Proof of Possession)</h2>
      <p>Link your original photo to a public event to prove it existed at a specific point in time.</p>
      
      <div className="input-group">
        <label>Step 1: Original Image: <input type="file" accept="image/*" onChange={handleImageUpload} /></label>
        
        {imageHash && (
          <div className="info-box">
            <p><strong>Image Fingerprint:</strong> <code>{imageHash}</code></p>
            
            <label style={{ marginTop: '10px' }}>Step 2: Public Anchor Source (e.g. News/Crypto):
              <input type="text" value={anchorSource} onChange={e => setAnchorSource(e.target.value)} style={{ width: '100%' }} />
            </label>
            
            <label style={{ marginTop: '10px' }}>Step 3: Public Anchor Hash (Immutable Value):
              <input type="text" value={anchorHash} onChange={e => setAnchorHash(e.target.value)} style={{ width: '100%', fontFamily: 'monospace' }} />
            </label>
            
            <button onClick={createDeed} className="primary-button" style={{ marginTop: '15px', backgroundColor: '#f39c12' }}>
              Seal Ownership Deed
            </button>
          </div>
        )}
      </div>

      {deed && (
        <div className="results success">
          <h3>Deed of Ownership Generated!</h3>
          <p>This JSON file cryptographically proves you had image <code>{deed.imageHash.slice(0, 8)}</code> when event <code>{deed.anchorHash.slice(0, 8)}</code> occurred.</p>
          <button onClick={downloadDeed} className="download-btn">Download .JSON Deed</button>
        </div>
      )}
    </div>
  );
}
