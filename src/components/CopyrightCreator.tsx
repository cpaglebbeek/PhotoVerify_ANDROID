import { useState, type ChangeEvent } from 'react';
import { generateUID, embedWatermark } from '../utils/watermark';

export default function CopyrightCreator() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [uid, setUid] = useState<string>(generateUID());
  const [watermarkedDataUrl, setWatermarkedDataUrl] = useState<string | null>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setWatermarkedDataUrl(null);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const applyWatermark = () => {
    if (!image) return;

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const watermarkedData = embedWatermark(imageData, uid);
    
    ctx.putImageData(watermarkedData, 0, 0);
    setWatermarkedDataUrl(canvas.toDataURL('image/png'));
  };

  return (
    <div className="component-container">
      <h2>1. Watermark Image (4-bit, Low Visibility)</h2>
      <p>This method uses a 4-bit UID (0-F) and subtle 4% luminance modulation for maximum stealth.</p>
      
      <div className="input-group">
        <label>Image: <input type="file" accept="image/*" onChange={handleImageUpload} /></label>
        <label>UID (4-bit hex, 0-F): 
          <input type="text" value={uid} onChange={e => setUid(e.target.value.toUpperCase())} maxLength={1} />
          <button onClick={() => setUid(generateUID())} style={{ marginLeft: '10px' }}>New UID</button>
        </label>
      </div>
      
      {image && (
        <div className="canvas-wrapper">
          <button onClick={applyWatermark} className="primary-button">Apply Watermark & Generate</button>
        </div>
      )}

      {watermarkedDataUrl && (
        <div className="results">
          <h3>Watermarked Image Ready:</h3>
          <p>This image now contains the hidden UID: <strong>{uid}</strong></p>
          <img src={watermarkedDataUrl} alt="Watermarked" style={{ maxWidth: '100%', marginBottom: '10px' }} />
          <div className="download-links">
            <a href={watermarkedDataUrl} download={`watermarked_${uid}.png`} className="download-btn">Download Protected Image</a>
          </div>
        </div>
      )}
    </div>
  );
}
