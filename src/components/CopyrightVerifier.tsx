import { useState, type ChangeEvent } from 'react';
import { extractWatermark, type WatermarkResult } from '../utils/watermark';

export default function CopyrightVerifier() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scanResult, setScanResult] = useState<WatermarkResult | null>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setScanResult(null);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const scan = () => {
    if (!image) return;

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = extractWatermark(imageData);
    setScanResult(result);
  };

  return (
    <div className="component-container">
      <h2>2. Scan for Watermark (Detect UID)</h2>
      <p>Upload any image (even if cropped or blurred) to attempt UID extraction.</p>
      
      <div className="upload-section">
        <label>Image to scan: 
          <input type="file" accept="image/*" onChange={handleFileUpload} />
        </label>
      </div>
      
      {image && (
        <button onClick={scan} className="primary-button">Start Extraction Scan</button>
      )}

      {scanResult && (
        <div className={`verification-result ${scanResult.confidence > 0.15 ? 'success' : 'error'}`}>
          <h3>Scan Results:</h3>
          <p>Extracted UID: <strong style={{ fontSize: '1.5em' }}>{scanResult.uid}</strong></p>
          <p>Detection Confidence: <strong>{(scanResult.confidence * 100).toFixed(2)}%</strong></p>
          <p style={{ fontSize: '0.9em', fontStyle: 'italic' }}>
            {scanResult.confidence > 0.15 
              ? "Watermark found. High probability of detection." 
              : "No strong watermark detected. The image is likely original or too heavily damaged."}
          </p>
        </div>
      )}
    </div>
  );
}
