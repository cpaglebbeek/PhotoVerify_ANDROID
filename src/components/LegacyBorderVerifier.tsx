import { useState, useRef, type ChangeEvent } from 'react';

interface Props {
  onStart: () => void;
  onProgress: (p: number) => void;
  onEnd: () => void;
}

export default function LegacyBorderVerifier({ onStart, onProgress, onEnd }: Props) {
  const [original, setOriginal] = useState<HTMLImageElement | null>(null);
  const [cropped, setCropped] = useState<HTMLImageElement | null>(null);
  const [proof, setProof] = useState<HTMLImageElement | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean, message: string } | null>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (setter: (img: HTMLImageElement) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => setter(img);
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

  const verify = async () => {
    if (!original || !cropped || !proof) {
      setVerificationResult({ success: false, message: "Please upload all 3 files." });
      return;
    }

    onStart();
    onProgress(10);
    
    const width = original.width;
    const height = original.height;

    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })!;
    ctx.imageSmoothingEnabled = false;

    // 1. Get Clean Original Data
    ctx.drawImage(original, 0, 0);
    const originalData = ctx.getImageData(0, 0, width, height).data;
    onProgress(30);
    await yieldToMain();

    // 2. Reconstruct from parts
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(cropped, 1, 1);
    ctx.drawImage(proof, 0, 0);
    const reconstructedData = ctx.getImageData(0, 0, width, height).data;
    onProgress(60);
    await yieldToMain();

    // 3. Compare with High Tolerance (due to browser rendering quirks)
    const diffCanvas = diffCanvasRef.current;
    let diffCtx = null;
    let diffImgData = null;
    if (diffCanvas) {
      diffCanvas.width = width; diffCanvas.height = height;
      diffCtx = diffCanvas.getContext('2d')!;
      diffImgData = diffCtx.createImageData(width, height);
    }

    let match = true;
    let errorCount = 0;
    const TOLERANCE = 8; // Increased tolerance for robust matching across different browsers/OS

    for (let i = 0; i < originalData.length; i += 4) {
      const rD = Math.abs(originalData[i] - reconstructedData[i]);
      const gD = Math.abs(originalData[i+1] - reconstructedData[i+1]);
      const bD = Math.abs(originalData[i+2] - reconstructedData[i+2]);

      const isPixelMatch = rD <= TOLERANCE && gD <= TOLERANCE && bD <= TOLERANCE;

      if (!isPixelMatch) {
        match = false;
        errorCount++;
        if (diffImgData) {
          diffImgData.data[i] = 255; diffImgData.data[i+1] = 0; diffImgData.data[i+2] = 0; diffImgData.data[i+3] = 255;
        }
      } else if (diffImgData) {
        diffImgData.data[i] = 0; diffImgData.data[i+1] = 255; diffImgData.data[i+2] = 0; diffImgData.data[i+3] = 100;
      }

      if (i % 40000 === 0) {
        onProgress(60 + Math.floor((i / originalData.length) * 30));
        await yieldToMain();
      }
    }

    if (diffCtx && diffImgData) diffCtx.putImageData(diffImgData, 0, 0);

    if (match || errorCount < (width * height * 0.001)) { // Allow 0.1% noise
      setVerificationResult({ success: true, message: `Verification Successful! Geometric match confirmed (${errorCount} tiny noise pixels ignored).` });
    } else {
      setVerificationResult({ success: false, message: `Verification Failed! ${errorCount} pixels do not match. See the red error map below.` });
    }
    
    onProgress(100);
    onEnd();
  };

  return (
    <div className="component-container">
      <div className="upload-section">
        <label>1. Original File to verify: <input type="file" accept="image/*" onChange={handleFileUpload(setOriginal)} /></label>
        <label>2. Cropped Interior part: <input type="file" accept="image/*" onChange={handleFileUpload(setCropped)} /></label>
        <label>3. 1-Pixel Border part: <input type="file" accept="image/*" onChange={handleFileUpload(setProof)} /></label>
      </div>
      <button onClick={verify} className="primary-button" style={{ marginTop: '10px' }}>Verify Physical Combination</button>
      
      {verificationResult && (
        <div className={`results ${verificationResult.success ? 'success' : 'error'}`}>
          <h3>{verificationResult.success ? 'Confirmed' : 'Error'}</h3>
          <p>{verificationResult.message}</p>
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7em', color: '#888' }}>Geometric Error Map (Red = Mismatch)</span>
            <canvas ref={diffCanvasRef} style={{ maxWidth: '100%', display: 'block', margin: '5px auto', border: '1px solid #333' }} />
          </div>
        </div>
      )}
    </div>
  );
}
