import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { sha256, generateCombinedProof, type AnchorDeed } from '../utils/timeAnchor';
import { generatePerceptualHashDetailed, hashToBits, compareHashesElastic } from '../utils/perceptualHash';
import { generateHistogram, detectQuantization, type HistogramData } from '../utils/forensics';

const ClassificationTable = ({ currentVal }: { currentVal: number }) => {
  const getStyle = (min: number, max: number) => {
    const isActive = currentVal >= min && currentVal < max;
    return {
      color: isActive ? (min >= 0.85 ? '#2ecc71' : (min >= 0.75 ? '#f39c12' : '#e74c3c')) : '#555',
      fontWeight: isActive ? 'bold' : 'normal',
      background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
      transition: 'all 0.3s ease'
    };
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em', marginTop: '10px' }}>
      <tbody>
        <tr style={getStyle(0.98, 1.01)}><td style={{ padding: '4px' }}>98-100%</td><td style={{ padding: '4px' }}>Identical (Original)</td></tr>
        <tr style={getStyle(0.85, 0.98)}><td style={{ padding: '4px' }}>85-98%</td><td style={{ padding: '4px' }}>High Confidence (Edited)</td></tr>
        <tr style={getStyle(0.75, 0.85)}><td style={{ padding: '4px' }}>75-85%</td><td style={{ padding: '4px' }}>Probable Match (Cropped)</td></tr>
        <tr style={getStyle(0.00, 0.75)}><td style={{ padding: '4px' }}>&lt; 75%</td><td style={{ padding: '4px' }}>Unreliable / No Match</td></tr>
      </tbody>
    </table>
  );
};

export default function TimeAnchorVerifier() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [deed, setDeed] = useState<AnchorDeed | null>(null);
  const [threshold, setThreshold] = useState<number>(0.85);
  const [auditResult, setAuditResult] = useState<{ 
    success: boolean, 
    message: string, 
    detail?: string, 
    matchScore?: number,
    analysis?: {
      resize: string,
      ratio: string,
      color: string,
      crop: string,
      histSimilarity: number,
      quantizationGaps: number
    }
  } | null>(null);
  const [comparisonData, setComparisonData] = useState<{ sourceBits: number[], currentBits: number[] } | null>(null);
  const [histData, setHistData] = useState<HistogramData | null>(null);
  
  const canvasSourceRef = useRef<HTMLCanvasElement>(null);
  const canvasCurrentRef = useRef<HTMLCanvasElement>(null);
  const canvasDiffRef = useRef<HTMLCanvasElement>(null);
  const canvasHistRef = useRef<HTMLCanvasElement>(null);

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
          setHistData(null);
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
          alert("Invalid deed file.");
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
    if (histData && canvasHistRef.current) {
      drawHistogram(canvasHistRef.current, histData);
    }
  }, [comparisonData, auditResult, histData]);

  const auditOwnership = async () => {
    if (!image || !deed) return;

    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const currentHash = await sha256(imageData.data);
    const exactMatch = (currentHash === deed.imageHash);
    const currentPHashResult = generatePerceptualHashDetailed(imageData);
    const sourceBits = hashToBits(deed.perceptualHash || "");
    const { score: visualMatch, offsetBits: alignedCurrentBits } = compareHashesElastic(sourceBits, currentPHashResult.bits);
    setComparisonData({ sourceBits, currentBits: alignedCurrentBits });

    const currentHist = generateHistogram(imageData);
    setHistData(currentHist);
    const gaps = detectQuantization(currentHist.luminance);

    let analysis = { 
      resize: "Unknown", ratio: "Unknown", color: "Unknown", crop: "None",
      histSimilarity: 1.0, quantizationGaps: gaps
    };

    if (deed.metadata) {
      const sizeDiff = Math.abs(1 - (image.width * image.height) / (deed.metadata.width * deed.metadata.height));
      analysis.resize = sizeDiff < 0.01 ? "Original size" : `Changed (${image.width}x${image.height})`;
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const common = gcd(image.width, image.height);
      const currentRatio = `${image.width/common}:${image.height/common}`;
      analysis.ratio = currentRatio === deed.metadata.aspectRatio ? "Same" : `Changed (${currentRatio})`;
      let currentHasColor = false;
      for(let i=0; i<Math.min(imageData.data.length, 4000); i+=4) {
        if(Math.abs(imageData.data[i]-imageData.data[i+1]) > 15) { currentHasColor = true; break; }
      }
      analysis.color = currentHasColor === deed.metadata.isColor ? "Same" : (currentHasColor ? "Color added" : "Grayscale");
      analysis.crop = visualMatch > threshold && !exactMatch ? "Likely cropped" : "Not detected";
    }

    const recalculatedProof = await generateCombinedProof(deed.imageHash, deed.anchorHash);
    if (recalculatedProof !== deed.combinedProof) {
      setAuditResult({ success: false, message: "Deed Corrupt!", detail: "Cryptographic link failed." });
      return;
    }

    if (exactMatch) {
      setAuditResult({
        success: true, message: "Perfect Match!",
        detail: `Exact original file.`,
        matchScore: 1.0, analysis
      });
    } else if (visualMatch >= threshold) {
      setAuditResult({
        success: true, message: `Visual Match Found!`,
        detail: `Pixels changed, but content matches above threshold.`,
        matchScore: visualMatch, analysis
      });
    } else {
      setAuditResult({
        success: false, message: "No Match!",
        detail: `Visual match below threshold of ${(threshold * 100).toFixed(0)}%.`,
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

  const drawHistogram = (canvas: HTMLCanvasElement, data: HistogramData) => {
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#61dafb';
    const barWidth = w / 256;
    for (let i = 0; i < 256; i++) {
      const barHeight = (data.luminance[i] / data.max) * h;
      ctx.fillRect(i * barWidth, h - barHeight, barWidth, barHeight);
    }
  };

  return (
    <div className="dashboard-section" style={{ borderTop: '4px solid #3498db' }}>
      <h2>📜 Ownership Auditor (Forensic Analysis)</h2>
      
      <div className="input-group">
        <label>1. Photo to verify: <input type="file" accept="image/*" onChange={handleImageUpload} /></label>
        <label>2. .JSON Deed File: <input type="file" accept=".json" onChange={handleDeedUpload} /></label>
        
        <div style={{ background: '#111', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Set Match Threshold: <strong>{(threshold * 100).toFixed(0)}%</strong></span>
            <input 
              type="range" min="0.5" max="1.0" step="0.01" 
              value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))} 
              style={{ width: '60%' }}
            />
          </label>
          <ClassificationTable currentVal={threshold} />
        </div>

        {image && deed && <button onClick={auditOwnership} className="primary-button">Start Forensic Audit</button>}
      </div>

      {auditResult && (
        <div className="audit-visualization" style={{ marginTop: '20px', background: '#000', padding: '20px', borderRadius: '12px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', textAlign: 'center', fontSize: '0.7em', color: '#888', marginBottom: '20px' }}>
            <div><span>Deed DNA</span><canvas ref={canvasSourceRef} width={160} height={160} style={{ display: 'block', margin: '5px auto', border: '1px solid #333' }} /></div>
            <div><span>Photo DNA</span><canvas ref={canvasCurrentRef} width={160} height={160} style={{ display: 'block', margin: '5px auto', border: '1px solid #333' }} /></div>
            <div><span>Diff Map</span><canvas ref={canvasDiffRef} width={160} height={160} style={{ display: 'block', margin: '5px auto', border: '1px solid #333' }} /></div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            {imageSrc && (
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.7em', color: '#888' }}>Analyzed Photo:</span>
                <img src={imageSrc} alt="Preview" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #333', marginTop: '5px' }} />
                <div style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '0.7em', color: '#888' }}>Luminance Histogram:</span>
                  <canvas ref={canvasHistRef} width={300} height={60} style={{ display: 'block', width: '100%', height: '60px', background: '#111', borderRadius: '4px', marginTop: '5px' }} />
                </div>
              </div>
            )}
            {auditResult.analysis && (
              <div style={{ flex: 1, background: '#111', padding: '15px', borderRadius: '8px', fontSize: '0.85em' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#61dafb' }}>🔍 Forensic Report</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ marginBottom: '5px' }}>📏 <strong>Size:</strong> {auditResult.analysis.resize}</li>
                  <li style={{ marginBottom: '5px' }}>📐 <strong>Aspect Ratio:</strong> {auditResult.analysis.ratio}</li>
                  <li style={{ marginBottom: '5px' }}>🎨 <strong>Color:</strong> {auditResult.analysis.color}</li>
                  <li style={{ marginBottom: '5px' }}>✂️ <strong>Cropping:</strong> {auditResult.analysis.crop}</li>
                  <li style={{ marginBottom: '5px', borderTop: '1px solid #222', paddingTop: '5px', marginTop: '5px' }}>📉 <strong>Histogram Gaps:</strong> {auditResult.analysis.quantizationGaps}</li>
                </ul>
              </div>
            )}
          </div>

          <div className={`results ${auditResult.success ? 'success' : 'error'}`}>
            <h3>{auditResult.message}</h3>
            <p>{auditResult.detail}</p>
            
            <div style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '10px' }}>
              <p style={{ fontSize: '1.1em', marginBottom: '10px' }}>
                <strong>Visual Similarity:</strong> <span style={{ color: auditResult.matchScore! >= 0.85 ? '#2ecc71' : (auditResult.matchScore! >= 0.75 ? '#f39c12' : '#e74c3c') }}>
                  {(auditResult.matchScore! * 100).toFixed(1)}%
                </span>
              </p>
              
              <div style={{ height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden', marginBottom: '15px' }}>
                <div style={{ 
                  width: `${auditResult.matchScore! * 100}%`, 
                  height: '100%', 
                  background: auditResult.matchScore! >= threshold ? '#2ecc71' : (auditResult.matchScore! > 0.5 ? '#f39c12' : '#e74c3c'),
                  transition: 'width 0.5s ease-out'
                }} />
              </div>

              <div style={{ background: '#111', padding: '10px', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.8em', color: '#888', marginBottom: '5px' }}><strong>Result Classification:</strong></p>
                <ClassificationTable currentVal={auditResult.matchScore!} />
              </div>

              {auditResult.matchScore! < 0.85 && (
                <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(231, 76, 60, 0.1)', border: '1px solid #e74c3c', borderRadius: '8px' }}>
                  <p style={{ margin: 0, color: '#e74c3c', fontWeight: 'bold', fontSize: '0.9em' }}>⚠️ Warning: Score below norm</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.8em', color: '#ccc' }}>Match is insufficient for irrefutable proof.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
