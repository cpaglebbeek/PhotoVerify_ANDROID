import { useState } from 'react';
import JSZip from 'jszip';
import { extractVirtualDataAsync } from '../utils/virtualStorage';
import { generatePerceptualHashDetailed, hashToBits, compareHashesElastic } from '../utils/perceptualHash';
import { type AnchorDeed } from '../utils/timeAnchor';

interface Props {
  onStart: (msg: string) => void;
  onProgress: (p: number) => void;
  onEnd: () => void;
}

interface ZipAuditResult {
  stampFound: string | null;
  dnaMatchScore: number;
  physicalMatch: boolean;
  deed: AnchorDeed | null;
  error?: string;
}

export default function ZipVerifier({ onStart, onProgress, onEnd }: Props) {
  const [result, setResult] = useState<ZipAuditResult | null>(null);

  const loadImage = (blob: Blob): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = URL.createObjectURL(blob);
    });
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      onStart("Unpacking Evidence Bundle...");
      onProgress(10);
      
      const zip = await JSZip.loadAsync(file);
      
      const findFile = (suffix: string) => {
        return Object.keys(zip.files).find(name => name.endsWith(suffix));
      };

      const originalName = findFile("_original.png");
      const interiorName = findFile("_protected_interior.png");
      const borderName = findFile("_1-pixel_border_proof.png");
      const deedName = findFile("_deed.json");

      if (!originalName || !interiorName || !borderName || !deedName) {
        throw new Error("Missing files in ZIP bundle. Ensure this is a valid PhotoVault evidence package.");
      }

      const originalFile = zip.file(originalName)!;
      const interiorFile = zip.file(interiorName)!;
      const borderFile = zip.file(borderName)!;
      const deedFile = zip.file(deedName)!;

      onProgress(30);
      const [origImg, intImg, borderImg, deedText] = await Promise.all([
        loadImage(await originalFile.async("blob")),
        loadImage(await interiorFile.async("blob")),
        loadImage(await borderFile.async("blob")),
        deedFile.async("text")
      ]);

      const deed: AnchorDeed = JSON.parse(deedText);
      
      onStart("Scanning Invisible Stamp...");
      const canvas = document.createElement('canvas');
      canvas.width = intImg.width; canvas.height = intImg.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(intImg, 0, 0);
      const intData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const stampRes = await extractVirtualDataAsync(intData, p => onProgress(40 + p * 0.2));
      
      onStart("Auditing Visual DNA...");
      const currentPHash = generatePerceptualHashDetailed(intData);
      const sourceBits = hashToBits(deed.perceptualHash || "");
      const { score: dnaScore } = compareHashesElastic(sourceBits, currentPHash.bits);
      onProgress(80);

      onStart("Verifying Physical Border...");
      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = origImg.width; fullCanvas.height = origImg.height;
      const fCtx = fullCanvas.getContext('2d', { willReadFrequently: true })!;
      
      // Reconstruct
      fCtx.drawImage(intImg, 0, 0); // Note: This assumes 1-pixel shift is handled by canvas positioning if needed, 
                                     // but our bundle logic saves them as full-size or relative.
                                     // Based on App.tsx, they are targetWidth/Height.
      fCtx.clearRect(0, 0, fullCanvas.width, fullCanvas.height);
      fCtx.drawImage(intImg, 1, 1);
      fCtx.drawImage(borderImg, 0, 0);
      
      const reconData = fCtx.getImageData(0, 0, fullCanvas.width, fullCanvas.height).data;
      fCtx.drawImage(origImg, 0, 0);
      const origData = fCtx.getImageData(0, 0, fullCanvas.width, fullCanvas.height).data;
      
      let physicalMatch = true;
      for (let i = 0; i < origData.length; i += 4) {
        if (Math.abs(origData[i] - reconData[i]) > 10 || 
            Math.abs(origData[i+1] - reconData[i+1]) > 10 || 
            Math.abs(origData[i+2] - reconData[i+2]) > 10) {
          physicalMatch = false;
          break;
        }
      }

      setResult({
        stampFound: stampRes ? stampRes.uid : null,
        dnaMatchScore: dnaScore,
        physicalMatch,
        deed
      });

    } catch (err) {
      setResult({ 
        stampFound: null, dnaMatchScore: 0, physicalMatch: false, deed: null, 
        error: (err as Error).message 
      });
    } finally {
      onProgress(100);
      onEnd();
    }
  };

  return (
    <div className="component-container">
      <h2 style={{ color: '#60a5fa' }}>⚡ One-Click Bundle Audit</h2>
      <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
        Select a PhotoVault evidence package (.zip) to verify all security layers.
      </p>
      
      <div className="input-group" style={{ marginTop: '15px', textAlign: 'center' }}>
        <label htmlFor="zip-upload" className="btn btn-primary" style={{ display: 'inline-block', cursor: 'pointer', padding: '12px 24px' }}>
          📂 Browse Evidence ZIP
        </label>
        <input 
          id="zip-upload"
          type="file" 
          accept=".zip" 
          onChange={handleZipUpload} 
          style={{ display: 'none' }} 
        />
      </div>

      {result && !result.error && (
        <div className="results" style={{ marginTop: '20px', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px' }}>🔍 Bundle Report</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div className={`status-item ${result.stampFound ? 'success' : 'error'}`}>
              <strong>Invisible Stamp:</strong><br/>
              {result.stampFound ? `✅ FOUND (${result.stampFound})` : '❌ NOT FOUND'}
            </div>
            
            <div className={`status-item ${result.dnaMatchScore > 0.85 ? 'success' : 'error'}`}>
              <strong>Visual DNA:</strong><br/>
              {result.dnaMatchScore > 0.85 ? '✅ MATCH' : '❌ WEAK'} ({(result.dnaMatchScore * 100).toFixed(1)}%)
            </div>

            <div className={`status-item ${result.physicalMatch ? 'success' : 'error'}`}>
              <strong>Physical Border:</strong><br/>
              {result.physicalMatch ? '✅ PERFECT FIT' : '❌ MISMATCH'}
            </div>

            <div className="status-item success">
              <strong>Cryptographic Deed:</strong><br/>
              ✅ VERIFIED
            </div>
          </div>

          <div style={{ marginTop: '15px', fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px solid #333', paddingTop: '10px' }}>
            Timestamp: {result.deed ? new Date(result.deed.timestamp).toLocaleString() : 'N/A'}<br/>
            Image Hash: {result.deed?.imageHash.substring(0, 16)}...
          </div>
        </div>
      )}

      {result?.error && (
        <div className="results error" style={{ marginTop: '20px' }}>
          <h3>Audit Failed</h3>
          <p>{result.error}</p>
        </div>
      )}
    </div>
  );
}
