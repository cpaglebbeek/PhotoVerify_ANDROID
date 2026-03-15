import { useState, useRef, type ChangeEvent } from 'react';
import { extractVirtualData, injectVirtualData } from '../utils/virtualStorage';
import { generatePerceptualHashDetailed, hashToBits, compareHashesElastic } from '../utils/perceptualHash';
import { sha256, generateCombinedProof, type AnchorDeed } from '../utils/timeAnchor';

const SAMPLES = [
  { id: 'hi', name: 'High Res (2000px)', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2000&auto=format&fit=crop' },
  { id: 'mid', name: 'Medium Res (1000px)', url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1000&auto=format&fit=crop' },
  { id: 'low', name: 'Low Res (400px)', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&auto=format&fit=crop' }
];

export default function ImageLab() {
  const [activeImage, setActiveImage] = useState<HTMLImageElement | null>(null);
  const [currentDeed, setCurrentDeed] = useState<AnchorDeed | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [labMode, setLabMode] = useState<'MANIPULATE' | 'STAMP' | 'BORDER' | 'VERIFY'>('MANIPULATE');
  const [stampCode, setStampCode] = useState('A1B2C3');
  const workbenchRef = useRef<HTMLCanvasElement>(null);

  // Border Lab State
  const [borderFiles, setBorderFiles] = useState<{ cropped: string, border: string } | null>(null);
  const [extCropped, setExtCropped] = useState<HTMLImageElement | null>(null);
  const [extBorder, setExtBorder] = useState<HTMLImageElement | null>(null);

  const loadSample = (url: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setActiveImage(img);
      setTestResult(null);
      setLabMode('MANIPULATE');
      createBaseDeed(img);
    };
    img.src = url;
  };

  const createBaseDeed = async (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const h1 = await sha256(imageData.data);
    const ph = generatePerceptualHashDetailed(imageData);
    setCurrentDeed({
      imageHash: h1, perceptualHash: ph.hash,
      anchorHash: "LAB_ANCHOR", anchorSource: "Lab",
      combinedProof: await generateCombinedProof(h1, "LAB_ANCHOR"),
      timestamp: Date.now(),
      metadata: { width: img.width, height: img.height, isColor: true, aspectRatio: "N/A" }
    });
    updateWorkbench(img);
  };

  const updateWorkbench = (img: HTMLImageElement | HTMLCanvasElement) => {
    const canvas = workbenchRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
  };

  // --- STAMP ACTIONS ---
  const applyDigitalStamp = () => {
    const canvas = workbenchRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const stamped = injectVirtualData(imageData, stampCode);
    ctx.putImageData(stamped, 0, 0);
    setTestResult({ msg: "Stamp Injected Locally" });
  };

  const downloadWorkbench = () => {
    const canvas = workbenchRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'lab_output.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // --- BORDER ACTIONS ---
  const generateBorderProof = () => {
    const canvas = workbenchRef.current;
    if (!canvas) return;
    const { width, height } = canvas;
    
    // Create border image
    const bCanvas = document.createElement('canvas');
    bCanvas.width = width; bCanvas.height = height;
    const bCtx = bCanvas.getContext('2d')!;
    bCtx.drawImage(canvas, 0, 0, width, 1, 0, 0, width, 1);
    bCtx.drawImage(canvas, 0, height-1, width, 1, 0, height - 1, width, 1);
    bCtx.drawImage(canvas, 0, 1, 1, height-2, 0, 1, 1, height - 2);
    bCtx.drawImage(canvas, width-1, 1, 1, height-2, width - 1, 1, 1, height - 2);
    
    // Create cropped image
    const cCanvas = document.createElement('canvas');
    cCanvas.width = width; cCanvas.height = height;
    const cCtx = cCanvas.getContext('2d')!;
    cCtx.drawImage(canvas, 0, 0);
    cCtx.clearRect(0, 0, width, 1);
    cCtx.clearRect(0, height-1, width, 1);
    cCtx.clearRect(0, 1, 1, height-2);
    cCtx.clearRect(width-1, 1, 1, height-2);

    setBorderFiles({
      border: bCanvas.toDataURL('image/png'),
      cropped: cCanvas.toDataURL('image/png')
    });
  };

  const handleFileUpload = (setter: any) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => setter(img);
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyBorderFit = () => {
    if (!extCropped || !extBorder || !activeImage) return;
    const canvas = document.createElement('canvas');
    canvas.width = activeImage.width; canvas.height = activeImage.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(extCropped, 0, 0);
    ctx.drawImage(extBorder, 0, 0);
    
    const reconstructed = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    const oCanvas = document.createElement('canvas');
    oCanvas.width = activeImage.width; oCanvas.height = activeImage.height;
    const oCtx = oCanvas.getContext('2d')!;
    oCtx.drawImage(activeImage, 0, 0);
    const original = oCtx.getImageData(0, 0, oCanvas.width, oCanvas.height).data;

    let match = true;
    for (let i = 0; i < original.length; i++) {
      if (Math.abs(original[i] - reconstructed[i]) > 2) { match = false; break; }
    }
    setTestResult({ borderMatch: match ? 'PERFECT FIT' : 'NO MATCH' });
  };

  // --- MANIPULATIONS ---
  const applyGrayscale = () => {
    const canvas = workbenchRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg; data[i + 1] = avg; data[i + 2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const applyResize = (percent: number) => {
    const canvas = workbenchRef.current;
    if (!canvas) return;
    const newW = Math.floor(canvas.width * (percent / 100));
    const newH = Math.floor(canvas.height * (percent / 100));
    const temp = document.createElement('canvas');
    temp.width = newW; temp.height = newH;
    const tctx = temp.getContext('2d')!;
    tctx.drawImage(canvas, 0, 0, newW, newH);
    updateWorkbench(temp);
  };

  const applyCrop = () => {
    const canvas = workbenchRef.current;
    if (!canvas) return;
    const newW = Math.floor(canvas.width * 0.8);
    const newH = Math.floor(canvas.height * 0.8);
    const startX = Math.floor(canvas.width * 0.1);
    const startY = Math.floor(canvas.height * 0.1);
    const temp = document.createElement('canvas');
    temp.width = newW; temp.height = newH;
    const tctx = temp.getContext('2d')!;
    tctx.drawImage(canvas, startX, startY, newW, newH, 0, 0, newW, newH);
    updateWorkbench(temp);
  };

  const runIntegrityTest = async () => {
    const canvas = workbenchRef.current;
    if (!canvas || !currentDeed) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const stampData = extractVirtualData(imageData);
    const currentPHash = generatePerceptualHashDetailed(imageData);
    const { score } = compareHashesElastic(hashToBits(currentDeed.perceptualHash || ""), currentPHash.bits);
    
    setTestResult({
      stamp: stampData ? `FOUND: ${stampData.uid}` : 'NOT FOUND',
      dna: (score * 100).toFixed(1) + '%',
      status: score > 0.85 ? 'PROVEN' : 'WEAK'
    });
  };

  return (
    <div className="lab-container" style={{ textAlign: 'left' }}>
      <h2 style={{ color: '#fbbf24' }}>🧪 Stress Test Laboratory v11.1</h2>
      
      <div className="lab-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', marginTop: '20px' }}>
        <aside className="lab-sidebar">
          <div className="step-box">
            <h4 style={{ margin: '0 0 10px 0' }}>1. Select Base Sample</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
              {SAMPLES.map(s => (
                <button key={s.id} className="lang-btn" onClick={() => loadSample(s.url)} style={{ padding: '5px', fontSize: '0.7em' }}>{s.id.toUpperCase()}</button>
              ))}
            </div>
          </div>

          {activeImage && (
            <>
              <div style={{ display: 'flex', gap: '5px', marginTop: '15px' }}>
                <button className={`lang-btn ${labMode==='MANIPULATE'?'active':''}`} onClick={()=>setLabMode('MANIPULATE')} style={{fontSize: '0.7em'}}>Edit</button>
                <button className={`lang-btn ${labMode==='STAMP'?'active':''}`} onClick={()=>setLabMode('STAMP')} style={{fontSize: '0.7em'}}>Stamp</button>
                <button className={`lang-btn ${labMode==='BORDER'?'active':''}`} onClick={()=>setLabMode('BORDER')} style={{fontSize: '0.7em'}}>Border</button>
                <button className={`lang-btn ${labMode==='VERIFY'?'active':''}`} onClick={()=>setLabMode('VERIFY')} style={{fontSize: '0.7em'}}>Verify</button>
              </div>

              <div className="step-box" style={{ marginTop: '10px', minHeight: '200px' }}>
                {labMode === 'MANIPULATE' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button className="lang-btn" onClick={applyGrayscale}>Grayscale</button>
                    <button className="lang-btn" onClick={() => applyResize(90)}>Scale 90%</button>
                    <button className="lang-btn" onClick={() => applyResize(110)}>Scale 110%</button>
                    <button className="lang-btn" onClick={applyCrop}>Crop 20%</button>
                    <button className="lang-btn" onClick={() => updateWorkbench(activeImage)} style={{gridColumn: 'span 2', background: '#451a1a'}}>Reset Pixels</button>
                  </div>
                )}

                {labMode === 'STAMP' && (
                  <div>
                    <label style={{fontSize: '0.8em'}}>Test Code:</label>
                    <input type="text" value={stampCode} onChange={e=>setStampCode(e.target.value)} maxLength={6} style={{marginBottom: '10px', width:'100%'}} />
                    <button className="lang-btn" onClick={applyDigitalStamp} style={{width:'100%', background: '#059669'}}>1. Inject Stamp</button>
                    <button className="lang-btn" onClick={downloadWorkbench} style={{width:'100%', marginTop:'5px'}}>2. Download Stamped</button>
                  </div>
                )}

                {labMode === 'BORDER' && (
                  <div>
                    <button className="lang-btn" onClick={generateBorderProof} style={{width:'100%', background: '#059669'}}>1. Generate Border</button>
                    {borderFiles && (
                      <div style={{marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px'}}>
                        <a href={borderFiles.cropped} download="lab_cropped.png" className="lang-btn" style={{textAlign:'center', textDecoration:'none', background:'#475569'}}>Download Cropped</a>
                        <a href={borderFiles.border} download="lab_border.png" className="lang-btn" style={{textAlign:'center', textDecoration:'none'}}>Download Border</a>
                      </div>
                    )}
                  </div>
                )}

                {labMode === 'VERIFY' && (
                  <div style={{fontSize: '0.85em'}}>
                    <button className="primary-button" onClick={runIntegrityTest} style={{width:'100%', marginBottom: '15px'}}>Full DNA/Stamp Scan</button>
                    <hr style={{opacity: 0.1}}/>
                    <p style={{marginTop: '10px'}}><strong>Manual Border Verification:</strong></p>
                    <label>Upload Cropped: <input type="file" onChange={handleFileUpload(setExtCropped)} style={{fontSize:'0.7em'}}/></label>
                    <label>Upload Border: <input type="file" onChange={handleFileUpload(setExtBorder)} style={{fontSize:'0.7em'}}/></label>
                    {extCropped && extBorder && <button className="lang-btn" onClick={verifyBorderFit} style={{width:'100%', marginTop: '10px'}}>Test Border Fit</button>}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="step-box" style={{ marginTop: '15px', background: '#0f172a' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8' }}>External Tools</h4>
            <ul style={{ fontSize: '0.8em', paddingLeft: '20px', color: '#64748b' }}>
              <li><a href="https://www.photopea.com/" target="_blank" style={{ color: '#60a5fa' }}>Photopea</a></li>
              <li><a href="https://tinypng.com/" target="_blank" style={{ color: '#60a5fa' }}>TinyPNG</a></li>
            </ul>
          </div>
        </aside>

        <main className="lab-workbench">
          <div className="step-box" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', background: '#000' }}>
            {!activeImage && <p style={{ color: '#475569' }}>Select a sample to begin.</p>}
            <canvas ref={workbenchRef} style={{ maxWidth: '100%', maxHeight: '70vh', border: '1px solid #334155', borderRadius: '8px' }} />
            
            {testResult && (
              <div className="test-overlay" style={{ 
                position: 'absolute', top: '20px', right: '20px', 
                background: 'rgba(15, 23, 42, 0.95)', padding: '20px', 
                borderRadius: '16px', border: '1px solid #334155',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                minWidth: '200px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #333', paddingBottom: '5px' }}>Lab Report</h4>
                {testResult.msg && <p style={{color: '#60a5fa'}}>{testResult.msg}</p>}
                {testResult.stamp && <p>Stamp: <strong style={{color: testResult.stamp.includes('FOUND') ? '#2ecc71' : '#e74c3c'}}>{testResult.stamp}</strong></p>}
                {testResult.dna && <p>DNA Match: <strong>{testResult.dna}</strong></p>}
                {testResult.borderMatch && <p>Border Fit: <strong style={{color: testResult.borderMatch==='PERFECT FIT'?'#2ecc71':'#e74c3c'}}>{testResult.borderMatch}</strong></p>}
                
                {testResult.status && (
                  <div style={{ marginTop: '15px', padding: '8px', borderRadius: '6px', background: testResult.status === 'PROVEN' ? '#064e3b' : '#451a1a', textAlign: 'center' }}>
                    <strong style={{ color: testResult.status === 'PROVEN' ? '#10b981' : '#f87171' }}>
                      {testResult.status === 'PROVEN' ? '✅ VERIFIED' : '❌ UNVERIFIED'}
                    </strong>
                  </div>
                )}
                <button onClick={()=>setTestResult(null)} style={{background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:'0.7em', marginTop:'10px'}}>Dismiss</button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
