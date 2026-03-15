import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { sha256, generateCombinedProof, type AnchorDeed } from '../utils/timeAnchor';
import { generatePerceptualHashDetailed, hashToBits, compareHashesElastic } from '../utils/perceptualHash';

export default function TimeAnchorVerifier() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [deed, setDeed] = useState<AnchorDeed | null>(null);
  const [auditResult, setAuditResult] = useState<{ 
    success: boolean, 
    message: string, 
    detail?: string, 
    matchScore?: number,
    analysis?: {
      resize: string,
      ratio: string,
      color: string,
      crop: string
    }
  } | null>(null);
  const [comparisonData, setComparisonData] = useState<{ sourceBits: number[], currentBits: number[] } | null>(null);
  
  const canvasSourceRef = useRef<HTMLCanvasElement>(null);
  const canvasCurrentRef = useRef<HTMLCanvasElement>(null);
  const canvasDiffRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => { 
          setImage(img); 
          setImageSrc(event.target?.result as string);
          setAuditResult(null); 
          setComparisonData(null); 
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeedUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          setDeed(parsed);
          setAuditResult(null);
          setComparisonData(null);
        } catch (err) {
          alert("Ongeldig bewijsbestand.");
        }
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    if (comparisonData && auditResult) {
      drawGrid(canvasSourceRef.current, comparisonData.sourceBits);
      drawGrid(canvasCurrentRef.current, comparisonData.currentBits);
      drawDiffGrid(canvasDiffRef.current, comparisonData.sourceBits, comparisonData.currentBits);
    }
  }, [comparisonData, auditResult]);

  const auditOwnership = async () => {
    if (!image || !deed) return;

    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const currentHash = await sha256(imageData.data);
    const exactMatch = (currentHash === deed.imageHash);

    const currentPHashResult = generatePerceptualHashDetailed(imageData);
    const sourceBits = hashToBits(deed.perceptualHash || "");
    const { score: visualMatch, offsetBits: alignedCurrentBits } = compareHashesElastic(sourceBits, currentPHashResult.bits);

    setComparisonData({ sourceBits, currentBits: alignedCurrentBits });

    let analysis = { resize: "Onbekend", ratio: "Onbekend", color: "Onbekend", crop: "Geen" };
    if (deed.metadata) {
      const sizeDiff = Math.abs(1 - (image.width * image.height) / (deed.metadata.width * deed.metadata.height));
      analysis.resize = sizeDiff < 0.01 ? "Origineel formaat" : (sizeDiff > 0 ? `Verkleind/Veranderd (${image.width}x${image.height})` : "Groter gemaakt");
      
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const common = gcd(image.width, image.height);
      const currentRatio = `${image.width/common}:${image.height/common}`;
      analysis.ratio = currentRatio === deed.metadata.aspectRatio ? "Gelijk gebleven" : `Gewijzigd (was ${deed.metadata.aspectRatio}, nu ${currentRatio})`;

      let currentHasColor = false;
      for(let i=0; i<Math.min(imageData.data.length, 4000); i+=4) {
        if(Math.abs(imageData.data[i]-imageData.data[i+1]) > 15) { currentHasColor = true; break; }
      }
      analysis.color = currentHasColor === deed.metadata.isColor ? "Gelijk gebleven" : (currentHasColor ? "Kleur toegevoegd" : "Omgezet naar zwart-wit");
      analysis.crop = visualMatch > 0.85 && !exactMatch ? "Waarschijnlijk bijgesneden" : "Niet gedetecteerd";
    }

    const recalculatedProof = await generateCombinedProof(deed.imageHash, deed.anchorHash);
    if (recalculatedProof !== deed.combinedProof) {
      setAuditResult({ success: false, message: "Bewijsbestand Corrupt!", detail: "De interne cryptografie klopt niet." });
      return;
    }

    if (exactMatch) {
      setAuditResult({
        success: true, message: "Perfecte Match!",
        detail: `Dit is het exacte originele bestand zoals vastgelegd op ${new Date(deed.timestamp).toLocaleDateString()}.`,
        matchScore: 1.0, analysis
      });
    } else if (visualMatch > 0.85) {
      setAuditResult({
        success: true, message: `Visuele Match Gevonden!`,
        detail: `De pixels zijn anders, maar de inhoud is herkend.`,
        matchScore: visualMatch, analysis
      });
    } else {
      setAuditResult({
        success: false, message: "Geen Overeenkomst!",
        detail: `Dit bestand lijkt niet op de foto in het eigendomsbewijs.`,
        matchScore: visualMatch, analysis
      });
    }
  };

  const drawGrid = (canvas: HTMLCanvasElement | null, bits: number[]) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 160, 160);
    bits.forEach((bit, i) => {
      ctx.fillStyle = bit === 1 ? '#61dafb' : '#1e293b';
      ctx.fillRect((i % 16) * 10, Math.floor(i / 16) * 10, 9, 9);
    });
  };

  const drawDiffGrid = (canvas: HTMLCanvasElement | null, bits1: number[], bits2: number[]) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 160, 160);
    bits1.forEach((_, i) => {
      ctx.fillStyle = bits1[i] === bits2[i] ? '#2ecc71' : '#e74c3c';
      ctx.fillRect((i % 16) * 10, Math.floor(i / 16) * 10, 9, 9);
    });
  };

  return (
    <div className="dashboard-section" style={{ borderTop: '4px solid #3498db' }}>
      <h2>📜 Eigendom Auditor (Forensische Analyse)</h2>
      
      <div className="input-group">
        <label>1. Foto om te controleren: <input type="file" accept="image/*" onChange={handleImageUpload} /></label>
        <label>2. .JSON Bewijsbestand: <input type="file" accept=".json" onChange={handleDeedUpload} /></label>
        {image && deed && <button onClick={auditOwnership} className="primary-button">Forensische Controle Starten</button>}
      </div>

      {auditResult && (
        <div className="audit-visualization" style={{ marginTop: '20px', background: '#000', padding: '20px', borderRadius: '12px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', textAlign: 'center', fontSize: '0.7em', color: '#888', marginBottom: '20px' }}>
            <div>
              <span>DNA uit Bewijs</span>
              <canvas ref={canvasSourceRef} width={160} height={160} style={{ display: 'block', margin: '5px auto', border: '1px solid #333' }} />
            </div>
            <div>
              <span>DNA van deze Foto</span>
              <canvas ref={canvasCurrentRef} width={160} height={160} style={{ display: 'block', margin: '5px auto', border: '1px solid #333' }} />
            </div>
            <div>
              <span>Verschil Kaart</span>
              <canvas ref={canvasDiffRef} width={160} height={160} style={{ display: 'block', margin: '5px auto', border: '1px solid #333' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            {imageSrc && (
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.7em', color: '#888' }}>Geüploade afbeelding:</span>
                <img src={imageSrc} alt="Preview" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #333', marginTop: '5px' }} />
              </div>
            )}
            {auditResult.analysis && (
              <div style={{ flex: 1, background: '#111', padding: '15px', borderRadius: '8px', fontSize: '0.85em' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#61dafb' }}>🔍 Analyse Rapport</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li>📏 <strong>Grootte:</strong> {auditResult.analysis.resize}</li>
                  <li>📐 <strong>Verhouding:</strong> {auditResult.analysis.ratio}</li>
                  <li>🎨 <strong>Kleur:</strong> {auditResult.analysis.color}</li>
                  <li>✂️ <strong>Cropping:</strong> {auditResult.analysis.crop}</li>
                </ul>
              </div>
            )}
          </div>

          <div className={`results ${auditResult.success ? 'success' : 'error'}`}>
            <h3>{auditResult.message}</h3>
            <p>{auditResult.detail}</p>
            
            <div style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '10px' }}>
              <p style={{ fontSize: '0.9em', marginBottom: '5px' }}>
                <strong>Visuele Overeenkomst:</strong> {(auditResult.matchScore! * 100).toFixed(1)}%
              </p>
              <div style={{ height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${auditResult.matchScore! * 100}%`, 
                  height: '100%', 
                  background: auditResult.matchScore! > 0.85 ? '#2ecc71' : (auditResult.matchScore! > 0.5 ? '#f39c12' : '#e74c3c'),
                  transition: 'width 0.5s ease-out'
                }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
