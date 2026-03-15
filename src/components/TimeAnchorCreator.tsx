import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { sha256, generateCombinedProof, type AnchorDeed } from '../utils/timeAnchor';
import { generatePerceptualHashDetailed } from '../utils/perceptualHash';

export default function TimeAnchorCreator() {
  const [imageHash, setImageHash] = useState<string | null>(null);
  const [pHashData, setPHashData] = useState<{ hash: string, bits: number[] } | null>(null);
  const [metadata, setMetadata] = useState<{ width: number, height: number, isColor: boolean, aspectRatio: string } | null>(null);
  const [anchorSource, setAnchorSource] = useState<string>('Bitcoin Block #834567');
  const [anchorHash, setAnchorHash] = useState<string>('0000000000000000000123456789abcdef');
  const [deed, setDeed] = useState<AnchorDeed | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          const hash = await sha256(imageData.data);
          const phResult = generatePerceptualHashDetailed(imageData);
          
          // Color saturation check
          let hasColor = false;
          for(let i=0; i<Math.min(imageData.data.length, 4000); i+=4) {
            const r = imageData.data[i], g = imageData.data[i+1], b = imageData.data[i+2];
            if(Math.abs(r-g) > 15 || Math.abs(g-b) > 15) { hasColor = true; break; }
          }

          const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
          const common = gcd(img.width, img.height);
          const ratio = `${img.width/common}:${img.height/common}`;

          setImageHash(hash);
          setPHashData(phResult);
          setMetadata({ width: img.width, height: img.height, isColor: hasColor, aspectRatio: ratio });
          setDeed(null);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Draw DNA Preview
  useEffect(() => {
    if (pHashData && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')!;
      const size = 16;
      ctx.clearRect(0, 0, 160, 160);
      pHashData.bits.forEach((bit, i) => {
        const x = (i % size) * 10;
        const y = Math.floor(i / size) * 10;
        ctx.fillStyle = bit === 1 ? '#61dafb' : '#1e293b';
        ctx.fillRect(x, y, 9, 9);
      });
    }
  }, [pHashData]);

  const createDeed = async () => {
    if (!imageHash || !anchorHash) return;
    const combined = await generateCombinedProof(imageHash, anchorHash);
    const newDeed: AnchorDeed = {
      imageHash,
      perceptualHash: pHashData?.hash || undefined,
      metadata: metadata || undefined,
      anchorHash,
      anchorSource,
      combinedProof: combined,
      timestamp: Date.now()
    };
    setDeed(newDeed);
  };

  return (
    <div className="dashboard-section" style={{ borderTop: '4px solid #f1c40f' }}>
      <h2>🔒 Eigendomsbewijs (Time-Anchor)</h2>
      <p>Koppel je originele foto aan een publiek event om het bestaan op dit moment te bewijzen.</p>
      
      <div className="input-group">
        <label>Stap 1: Originele Foto: <input type="file" accept="image/*" onChange={handleImageUpload} /></label>
        
        {imageHash && (
          <div className="info-box">
            <div style={{ display: 'flex', gap: '20px', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <p><strong>Digitale Vingerafdruk:</strong><br/><code>{imageHash.slice(0, 32)}...</code></p>
                <p style={{ marginTop: '10px' }}><strong>Visueel DNA:</strong><br/><code>{pHashData?.hash}</code></p>
                {metadata && (
                  <p style={{ fontSize: '0.8em', color: '#888', marginTop: '5px' }}>
                    Info: {metadata.width}x{metadata.height} ({metadata.aspectRatio}) - {metadata.isColor ? 'Kleur' : 'Zwart-wit'}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.7em', display: 'block', marginBottom: '5px' }}>DNA Preview (16x16)</span>
                <canvas ref={canvasRef} width={160} height={160} style={{ border: '1px solid #334155', borderRadius: '4px' }} />
              </div>
            </div>
            
            <label style={{ marginTop: '15px' }}>Stap 2: Publieke Bron (bijv. Nieuws/Crypto):
              <input type="text" value={anchorSource} onChange={e => setAnchorSource(e.target.value)} style={{ width: '100%' }} />
            </label>
            
            <label style={{ marginTop: '10px' }}>Stap 3: Publieke Hash (Onveranderlijke waarde):
              <input type="text" value={anchorHash} onChange={e => setAnchorHash(e.target.value)} style={{ width: '100%', fontFamily: 'monospace' }} />
            </label>
            
            <button onClick={createDeed} className="primary-button" style={{ marginTop: '15px', backgroundColor: '#f39c12' }}>
              Eigendomsbewijs Verzegelen
            </button>
          </div>
        )}
      </div>

      {deed && (
        <div className="results success">
          <h3>Eigendomsbewijs Klaar!</h3>
          <p>Dit bestand bewijst cryptografisch dat jij de foto <code>{deed.imageHash.slice(0, 8)}</code> al had toen event <code>{deed.anchorHash.slice(0, 8)}</code> gebeurde.</p>
          <button onClick={() => {
            const blob = new Blob([JSON.stringify(deed, null, 2)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
            a.download = `eigendomsbewijs_${deed.imageHash.slice(0, 8)}.json`; a.click();
          }} className="download-btn">Download .JSON Bewijs</button>
        </div>
      )}
    </div>
  );
}
