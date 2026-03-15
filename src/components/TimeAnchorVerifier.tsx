import { useState, type ChangeEvent } from 'react';
import { sha256, generateCombinedProof, type AnchorDeed } from '../utils/timeAnchor';

export default function TimeAnchorVerifier() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [deed, setDeed] = useState<AnchorDeed | null>(null);
  const [auditResult, setAuditResult] = useState<{ success: boolean, message: string } | null>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => setImage(img);
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
        } catch (err) {
          alert("Invalid Deed file format.");
        }
      };
      reader.readAsText(file);
    }
  };

  const auditOwnership = async () => {
    if (!image || !deed) return;

    const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    
    // 1. Check Image Hash
    const currentHash = await sha256(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
    if (currentHash !== deed.imageHash) {
      setAuditResult({ success: false, message: "Image Hash mismatch! This is not the original file described in the deed." });
      return;
    }

    // 2. Verify Cryptographic Link
    const recalculatedProof = await generateCombinedProof(deed.imageHash, deed.anchorHash);
    if (recalculatedProof !== deed.combinedProof) {
      setAuditResult({ success: false, message: "Deed Cryptography Error! The combined proof does not match the inputs." });
      return;
    }

    setAuditResult({
      success: true,
      message: `Audit Passed! Cryptographically proven ownership. This file existed at the time of: ${deed.anchorSource} (${new Date(deed.timestamp).toLocaleDateString()}).`
    });
  };

  return (
    <div className="dashboard-section" style={{ borderTop: '4px solid #3498db' }}>
      <h2>4. Ownership Auditor (Deed Verifier)</h2>
      <p>Audit an Ownership Deed against a physical file to verify its origin window.</p>
      
      <div className="input-group">
        <label>1. Image to Verify: <input type="file" accept="image/*" onChange={handleImageUpload} /></label>
        <label>2. JSON Deed File: <input type="file" accept=".json" onChange={handleDeedUpload} /></label>
        
        {image && deed && (
          <button onClick={auditOwnership} className="primary-button" style={{ backgroundColor: '#2980b9' }}>
            Verify Ownership Proof
          </button>
        )}
      </div>

      {auditResult && (
        <div className={`results ${auditResult.success ? 'success' : 'error'}`}>
          <h3>{auditResult.success ? 'Ownership Verified' : 'Audit Failed'}</h3>
          <p>{auditResult.message}</p>
        </div>
      )}
    </div>
  );
}
