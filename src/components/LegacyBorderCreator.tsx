import { useState, useRef, useEffect } from 'react';

interface Props {
  image: HTMLImageElement | null;
}

export default function LegacyBorderCreator({ image }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [results, setResults] = useState<{ original: string, cropped: string, proof: string } | null>(null);

  useEffect(() => {
    if (image && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
      }
    }
  }, [image]);

  const generateProof = () => {
    if (!image) return;
    const { width, height } = image;
    const originalCanvas = document.createElement('canvas');
    originalCanvas.width = width; originalCanvas.height = height;
    const originalCtx = originalCanvas.getContext('2d')!;
    originalCtx.drawImage(image, 0, 0);
    const originalData = originalCanvas.toDataURL('image/png');

    const proofCanvas = document.createElement('canvas');
    proofCanvas.width = width; proofCanvas.height = height;
    const proofCtx = proofCanvas.getContext('2d')!;
    proofCtx.drawImage(image, 0, 0, width, 1, 0, 0, width, 1);
    proofCtx.drawImage(image, 0, height - 1, width, 1, 0, height - 1, width, 1);
    proofCtx.drawImage(image, 0, 1, 1, height - 2, 0, 1, 1, height - 2);
    proofCtx.drawImage(image, width - 1, 1, 1, height - 2, width - 1, 1, 1, height - 2);
    const proofData = proofCanvas.toDataURL('image/png');

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = width; croppedCanvas.height = height;
    const croppedCtx = croppedCanvas.getContext('2d')!;
    croppedCtx.drawImage(image, 0, 0);
    croppedCtx.clearRect(0, 0, width, 1);
    croppedCtx.clearRect(0, height - 1, width, 1);
    croppedCtx.clearRect(0, 1, 1, height - 2);
    croppedCtx.clearRect(width - 1, 1, 1, height - 2);
    const croppedData = croppedCanvas.toDataURL('image/png');

    setResults({ original: originalData, cropped: croppedData, proof: proofData });
  };

  return (
    <div className="component-container">
      {!image && <p style={{ color: '#e74c3c' }}>Please upload a photo in the first step.</p>}
      
      {image && (
        <div className="canvas-wrapper">
          <p style={{ fontSize: '0.9em', color: '#888' }}>The 1-pixel border rectangle (red) will be extracted as physical proof:</p>
          <canvas ref={canvasRef} style={{ maxWidth: '100%', border: '1px solid #333', borderRadius: '4px' }} />
          <button onClick={generateProof} className="primary-button" style={{ marginTop: '10px' }}>Extract Physical Border Proof</button>
        </div>
      )}
      {results && (
        <div className="results success">
          <h3>Physical Proof Files Ready:</h3>
          <p>Download all three files. To verify, you will need all of them.</p>
          <div className="download-links" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a href={results.original} download="original.png" className="download-btn" style={{ backgroundColor: '#475569' }}>1. Download Original</a>
            <a href={results.cropped} download="cropped_interior.png" className="download-btn" style={{ backgroundColor: '#475569' }}>2. Download Cropped Interior</a>
            <a href={results.proof} download="proof_border.png" className="download-btn">3. Download 1-Pixel Border</a>
          </div>
        </div>
      )}
    </div>
  );
}
