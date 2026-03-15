import { useState, type ChangeEvent } from 'react';
import CopyrightCreator from './components/CopyrightCreator';
import CopyrightVerifier from './components/CopyrightVerifier';
import TimeAnchorCreator from './components/TimeAnchorCreator';
import TimeAnchorVerifier from './components/TimeAnchorVerifier';
import LegacyBorderCreator from './components/LegacyBorderCreator';
import LegacyBorderVerifier from './components/LegacyBorderVerifier';
import versionData from './version.json';
import './App.css';

type Mode = 'START' | 'PROTECT' | 'VERIFY' | 'INFO' | 'ABOUT' | 'LAB';

const menuLanguages = [
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'es', name: 'Spanish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'tr', name: 'Turkish' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hu', name: 'Hungarian' },
];

function App() {
  const [mode, setMode] = useState<Mode>('START');
  const [sharedImage, setSharedImage] = useState<HTMLImageElement | null>(null);
  const [showExtensive, setShowExtensive] = useState(false);

  const translatePage = (langCode: string) => {
    localStorage.setItem('google_translate_lang', langCode);
    const cookieValue = `/en/${langCode}`;
    document.cookie = `googtrans=${cookieValue}; path=/`;
    document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname}`;
    window.location.reload();
  };

  const showOtherLanguages = () => {
    const el = document.getElementById('google_translate_element_hidden');
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  };

  const handleInitialUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => setSharedImage(img);
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const resetWizard = () => {
    setSharedImage(null);
    setMode('START');
    setShowExtensive(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-top">
          <div className="app-branding" onClick={resetWizard} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2.5rem' }}>📸</span>
            <h1>PhotoVault <small>v{versionData.current}</small></h1>
          </div>
          
          <div className="translation-bar">
            {menuLanguages.map(lang => (
              <button key={lang.code} className="lang-btn" onClick={() => translatePage(lang.code)}>{lang.name}</button>
            ))}
            <button className="lang-btn other" onClick={showOtherLanguages}>Other...</button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="info-toggle" onClick={resetWizard}>🏠 Home</button>
            <button className="info-toggle" onClick={() => setMode(mode === 'ABOUT' ? 'START' : 'ABOUT')}>
              {mode === 'ABOUT' ? '✖ Close' : '❓ About'}
            </button>
            <button className="info-toggle" onClick={() => { setMode(mode === 'INFO' ? 'START' : 'INFO'); setShowExtensive(false); }}>
              {mode === 'INFO' ? '✖ Close' : 'ℹ️ Help'}
            </button>
          </div>
        </div>
        <p className="subtitle">Universal Sovereignty: Stamp, Deed, & Forensic DNA.</p>
      </header>

      <main className="wizard-container">
        {mode === 'START' && (
          <div className="welcome-screen">
            <div className="concept-box">
              <h3>Secure Your Vision</h3>
              <p>PhotoVault provides a multi-layered forensic evidence kit to prove image ownership. From invisible pixel-level watermarking to cryptographic time-stamping.</p>
              <ol>
                <li><strong>Invisible Digital Stamp:</strong> Embedded directly into the RGB channels.</li>
                <li><strong>Visual DNA Analysis:</strong> Content-based identification resilient to cropping.</li>
                <li><strong>Physical Border Stamp:</strong> A 1-pixel frame signature for physical verification.</li>
                <li><strong>Time-Anchor Proof:</strong> Cryptographic link to immutable public events.</li>
              </ol>
            </div>

            <div className="action-cards">
              <button className="card protect" onClick={() => setMode('PROTECT')}>
                <span className="icon">🛡️</span>
                <h2>Protect New Photo</h2>
                <p>Embed identity & Generate legal proof.</p>
              </button>

              <button className="card verify" onClick={() => setMode('VERIFY')}>
                <span className="icon">🔍</span>
                <h2>Verify a Photo</h2>
                <p>Run forensic audit & identify origin.</p>
              </button>
            </div>
          </div>
        )}

        {mode === 'ABOUT' && (
          <div className="info-screen extensive-scroll" style={{ textAlign: 'left', lineHeight: '1.6', maxHeight: '80vh', overflowY: 'auto', padding: '2rem' }}>
            <h1 style={{ color: '#60a5fa', textAlign: 'center' }}>PhotoVault: Strategic & Competitive Analysis</h1>
            <p className="tagline" style={{ textAlign: 'center', fontStyle: 'italic', color: '#94a3b8' }}>"Pixels are the ultimate witness."</p>

            <div className="extensive-content">
              <h2>1. Executive Summary</h2>
              <p>In the age of generative AI and ubiquitous digital reproduction, the concept of "originality" is under siege. Current industry standards from Microsoft, Google, and Adobe prioritize platform security or centralized metadata standards. <strong>PhotoVault</strong> shifts the paradigm to <strong>Sovereign Forensic Proof</strong>—empowering individual creators with local-first, mathematically irrefutable evidence of origin through digital signatures and the unique <strong>Physical Border Stamp</strong>.</p>

              <h2>2. Comparative Landscape: Adobe, Microsoft, & Google</h2>
              
              <h3>Adobe: Content Authenticity Initiative (CAI / C2PA)</h3>
              <p>Adobe’s approach involves "Content Credentials"—cryptographically signed manifests attached to image headers. While robust within the Adobe ecosystem, it suffers from two major vulnerabilities:</p>
              <ul>
                <li><strong>Fragility:</strong> Metadata manifests are often stripped by social media platforms, screenshot operations, or re-saving in non-compliant software.</li>
                <li><strong>Centralization:</strong> It requires institutional trust in the signing authority.</li>
              </ul>
              <p><strong>PhotoVault Advantage:</strong> By embedding information in the <strong>Chroma Spectrum</strong> of the pixels themselves and providing a <strong>Physical Border Stamp</strong>, PhotoVault creates a multi-layered defense that survives metadata stripping and format conversion.</p>
              <p>🔗 <a href="https://contentauthenticity.org/" target="_blank" rel="noreferrer">Content Authenticity Initiative</a></p>

              <h3>Microsoft: PhotoDNA</h3>
              <p>Microsoft’s PhotoDNA is a reactive technology designed for platforms to identify and block known illegal content. It relies on robust hashing to find exact or near-exact matches.</p>
              <ul>
                <li><strong>Platform vs. Person:</strong> PhotoDNA serves the platform's need to filter; it does not serve the creator's need to prove possession.</li>
              </ul>
              <p><strong>PhotoVault Advantage:</strong> PhotoVault is <strong>Proactive</strong>. It allows a creator to establish a "Time-Anchor" and a <strong>Physical Border Stamp</strong> before distribution, providing tangible proof of original possession that PhotoDNA cannot offer.</p>
              <p>🔗 <a href="https://www.microsoft.com/en-us/photodna" target="_blank" rel="noreferrer">Microsoft PhotoDNA Overview</a></p>

              <h3>Google: Reverse Image Search & Lens</h3>
              <p>Google Lens uses advanced AI to find visual similarity across the web. While excellent for discovery, it provides no forensic proof of ownership.</p>
              <p><strong>PhotoVault Advantage:</strong> Google provides "looks like"; PhotoVault provides **"mathematically derived from."** Our <strong>Elastic Hamming Distance</strong> maps and the <strong>Physical Border Stamp</strong> provide a statistical and geometric match that holds up under forensic scrutiny.</p>
              <p>🔗 <a href="https://en.wikipedia.org/wiki/Reverse_image_search" target="_blank" rel="noreferrer">Reverse Image Search Technology</a></p>

              <h2>3. Technical Uniqueness: The Triple-Lock</h2>
              <p>PhotoVault is the only tool that integrates three independent layers of evidence into a single workflow:</p>
              <ol>
                <li><strong>The Digital Lock (Luminance Modulation):</strong> Data stored in the Blue channel, invisible to humans but high-signal for computers.</li>
                <li><strong>The Forensic Lock (Visual DNA):</strong> Content-aware hashing (aHash) that identifies the "soul" of the image regardless of cropping.</li>
                <li><strong>The Physical Lock (Physical Border Stamp):</strong> A geometric proof using a 1-pixel frame that requires possession of the exact original resolution to verify.</li>
              </ol>

              <h2>4. The Sovereign Advantage</h2>
              <p>Privacy is the core of PhotoVault. By running 100% locally in the browser via the <strong>Web Crypto API</strong>, we ensure that a user’s original file never touches a server. Combined with the <strong>Physical Border Stamp</strong>—which only you possess in its two component parts—PhotoVault ensures absolute proof of original physical possession.</p>
              <p>🔗 <a href="https://www.w3.org/TR/WebCryptoAPI/" target="_blank" rel="noreferrer">W3C Web Crypto API Standards</a></p>

              <h2>5. Business Viability & SaaS Potential</h2>
              <p>As deepfakes and image theft increase, the market for <strong>"Verified Origin"</strong> will grow. PhotoVault is positioned as the <strong>"Black Box for Media"</strong>—a tool that provides an objective paper trail for any digital asset, backed by digital, forensic, and physical evidence.</p>
            </div>

            <button className="primary-button" onClick={() => setMode('START')} style={{ marginTop: '30px', width: '100%' }}>Return to App</button>
          </div>
        )}

        {mode === 'INFO' && (
          <div className="info-screen extensive-scroll" style={{ textAlign: 'left', lineHeight: '1.6', maxHeight: '80vh', overflowY: 'auto', padding: '2rem' }}>
            {!showExtensive ? (
              <>
                <h2 style={{ color: '#fbbf24' }}>Forensic Help Center</h2>
                
                <section className="info-sub">
                  <h3>1. Perceptual Hashing (Visual DNA)</h3>
                  <p>Standard hashing (like SHA-256) changes if a single pixel is different. <strong>Perceptual Hashing</strong> looks at the <em>shapes and structures</em>. If you crop or resize the image, the DNA remains recognizable.</p>
                </section>

                <section className="info-sub" style={{ marginTop: '20px' }}>
                  <h3>2. Physical Border Stamp (Geometric Proof)</h3>
                  <p>The <strong>Physical Border Stamp</strong> extracts a 1-pixel frame. This acts as a physical witness, proving you possess the original dimensions of the photo.</p>
                </section>

                <section className="info-sub" style={{ marginTop: '20px' }}>
                  <h3>3. Time-Anchor (Cryptographic Proof)</h3>
                  <p>Linking your photo to a <strong>Public Anchor</strong> (like a recent Bitcoin block hash) proves you had the photo at that exact time. This creates a "Time-Lock" on your ownership.</p>
                </section>

                <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                  <button className="primary-button" onClick={() => setMode('START')} style={{ flex: 1 }}>Got it!</button>
                  <button className="secondary-button" onClick={() => setShowExtensive(true)} style={{ flex: 1, backgroundColor: '#475569', color: 'white' }}>🔍 Extensive Deep Dive (10+ Pages)</button>
                </div>
              </>
            ) : (
              <div className="extensive-info">
                <button className="back-btn" onClick={() => setShowExtensive(false)} style={{ marginBottom: '15px' }}>← Back to Overview</button>
                <h1 style={{ color: '#fbbf24', textAlign: 'center' }}>Forensic Deep Dive & Technical Reference</h1>
                
                <section className="info-sub">
                  <h2>Page 1: The Philosophy of Digital Sovereignty</h2>
                  <p>In the digital age, the "Chicken & Egg" problem of image ownership is pervasive: if two individuals possess the same file, who created it? PhotoVault solves this through <strong>Local Sovereignty</strong> across three layers: Digital (Stamp), Forensic (DNA), and Physical (Border Stamp). By generating mathematical and physical proof locally, the creator retains absolute control without relying on third-party cloud trust.</p>
                  <p><strong>Instructions:</strong> Use the "Protect" wizard to generate your evidence kit—including the <strong>Physical Border Stamp</strong>—<em>before</em> uploading your image anywhere.</p>
                  <p>🔗 <a href="https://en.wikipedia.org/wiki/Self-sovereign_identity" target="_blank" rel="noreferrer">Self-Sovereign Identity Concepts</a></p>
                </section>

                <section className="info-sub">
                  <h2>Page 2: Digital Fingerprinting (SHA-256)</h2>
                  <p>Cryptographic hashing is the foundation of digital integrity. <strong>SHA-256</strong> produces a unique signature for every file. This serves as the first layer of your <strong>Triple-Lock</strong> evidence, providing a "Binary Witness" to the original state of your pixels.</p>
                  <p><strong>Instructions:</strong> Your master file's SHA-256 hash is essential to prove that derived copies (stamped or geresized) originated from your source.</p>
                  <p>🔗 <a href="https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf" target="_blank" rel="noreferrer">NIST: FIPS 180-4 Standard</a></p>
                </section>

                <section className="info-sub">
                  <h2>Page 3: Perceptual Hashing (aHash)</h2>
                  <p>Unlike cryptographic hashes, **Perceptual Hashes** are stable against visual changes. This creates a "Visual DNA" that identifies the content. It works in tandem with the <strong>Physical Border Stamp</strong> to ensure the image remains identifiable even after heavy editing.</p>
                  <p>🔗 <a href="https://en.wikipedia.org/wiki/Perceptual_hashing" target="_blank" rel="noreferrer">Wikipedia: Perceptual Hashing</a></p>
                </section>

                <section className="info-sub">
                  <h2>Page 4: The Mathematics of the 256-Bit DNA</h2>
                  <p>We use Hamming Distance to compare DNA samples. In our 256-bit space, a match of &gt;75% is statistically impossible by accident ($p &lt; 10^{-9}$), providing the forensic weight needed alongside your <strong>Physical Border Stamp</strong>.</p>
                  <p>🔗 <a href="https://en.wikipedia.org/wiki/Hamming_distance" target="_blank" rel="noreferrer">Hamming Distance Wikipedia</a></p>
                </section>

                <section className="info-sub">
                  <h2>Page 5: Human Visual System (HVS) & Chroma Steganography</h2>
                  <p>The "Invisible Stamp" exploits the HVS by modulating the Blue channel. This digital signature is the "invisible" counterpart to the "visible" <strong>Physical Border Stamp</strong>, ensuring protection at multiple perceptual levels.</p>
                  <p>🔗 <a href="https://en.wikipedia.org/wiki/Visual_perception" target="_blank" rel="noreferrer">HVS Perception Research</a></p>
                </section>

                <section className="info-sub">
                  <h2>Page 6: Trusted Timestamping via Public Anchors</h2>
                  <p>Hashing your image with a Public Anchor creates a "Time-Lock". This proves you possessed the image (and its <strong>Physical Border Stamp</strong> components) at a specific point in time.</p>
                  <p>🔗 <a href="https://en.wikipedia.org/wiki/Trusted_timestamping" target="_blank" rel="noreferrer">Trusted Timestamping Standards</a></p>
                </section>

                <section className="info-sub">
                  <h2>Page 7: Forensic Artifacts: Quantization & Histograms</h2>
                  <p>We analyze Histogram Gaps to establish the forensic hierarchy. High-quality originals have continuous histograms, while afgeleide copies show quantization errors—proving you are the source.</p>
                  <p>🔗 <a href="https://en.wikipedia.org/wiki/Error_level_analysis" target="_blank" rel="noreferrer">Error Level Analysis</a></p>
                </section>

                <section className="info-sub">
                  <h2>Page 8: Elastic Alignment & Jitter Control</h2>
                  <p>Our **Elastic Anchor** technology re-aligns the DNA raster after cropping. This ensures that even if only a fragment of your image remains, your <strong>Physical Border Stamp</strong> can still be contextualized.</p>
                </section>

                <section className="info-sub">
                  <h2>Page 9: Physical Evidence: The Border Stamp</h2>
                  <p>The **Physical Border Stamp** method provides a geometric proof of possession. By extracting the outermost 1-pixel rectangle and saving it as a separate "Proof" image, you create a unique puzzle piece. Since the interior pixels are cleared, only the individual who possesses both the Border and the exact original dimensions can reconstruct the image with 100% mathematical accuracy. This is the third and most tangible layer of the **Triple-Lock** system.</p>
                  <p><strong>Instructions:</strong> Store `proof_border.png` and `cropped_interior.png` as high-priority evidence.</p>
                </section>

                <section className="info-sub">
                  <h2>Page 10: Legal Validity & Courtroom Readiness</h2>
                  <p>PhotoVault reports support the **"Substantial Similarity"** and **"Originality"** tests. By providing bit-level Diff Maps, Time-Anchored Deeds, and <strong>Physical Border Stamp</strong> reconstructions, you offer objective evidence that survives legal scrutiny.</p>
                  <p>🔗 <a href="https://en.wikipedia.org/wiki/Substantial_similarity" target="_blank" rel="noreferrer">Legal: Substantial Similarity</a></p>
                </section>

                <button className="primary-button" onClick={() => setShowExtensive(false)} style={{ marginTop: '30px', width: '100%' }}>Return to Overview</button>
              </div>
            )}
          </div>
        )}

        {mode === 'PROTECT' && (
          <div className="wizard-flow">
            <button className="back-btn" onClick={resetWizard}>← Back to start</button>
            
            <div className="step-box" style={{ background: sharedImage ? '#064e3b' : '#0f172a', border: sharedImage ? '1px solid #10b981' : 'none' }}>
              <div className="step-header">📸 Step 0: Upload Original Photo</div>
              <input type="file" accept="image/*" onChange={handleInitialUpload} />
              {sharedImage && <p style={{ color: '#10b981', marginTop: '10px', fontSize: '0.9em' }}>✅ Photo loaded successfully.</p>}
            </div>

            {sharedImage && (
              <>
                <div className="step-divider">Next Layer...</div>
                <div className="step-box">
                  <div className="step-header">🖼️ Step 1: Embed Invisible Stamp</div>
                  <CopyrightCreator image={sharedImage} />
                </div>
                
                <div className="step-divider">Next Layer...</div>
                
                <div className="step-box">
                  <div className="step-header">🔒 Step 2: Create Ownership Deed</div>
                  <TimeAnchorCreator image={sharedImage} />
                </div>

                <div className="step-divider">Final Layer...</div>

                <div className="step-box">
                  <div className="step-header">📐 Step 3: Extract Physical Border Stamp</div>
                  <LegacyBorderCreator image={sharedImage} />
                </div>

                <div className="manual-footer">
                  <h4>Evidence Collection Checklist:</h4>
                  <p>✅ <strong>Stamped Image:</strong> Downloaded in Step 1.</p>
                  <p>✅ <strong>Ownership Deed (.JSON):</strong> Downloaded in Step 2.</p>
                  <p>✅ <strong>Border Stamp Files:</strong> Downloaded the 3 files in Step 3.</p>
                  <p style={{ marginTop: '10px', color: '#fbbf24' }}>Store all these files together! They form your complete legal evidence kit.</p>
                </div>
              </>
            )}
          </div>
        )}

        {mode === 'VERIFY' && (
          <div className="wizard-flow">
            <button className="back-btn" onClick={() => setMode('START')}>← Back to start</button>
            <div className="step-box"><div className="step-header">🔎 Scan for Invisible Stamp</div><CopyrightVerifier /></div>
            <div className="step-divider">Detailed Audit...</div>
            <div className="step-box"><div className="step-header">📜 Audit Official Deed & DNA</div><TimeAnchorVerifier /></div>
            <div className="step-divider">Physical Match...</div>
            <div className="step-box"><div className="step-header">📐 Verify Physical Border Fit</div><LegacyBorderVerifier /></div>
          </div>
        )}
      </main>

      <footer>
        <p>&copy; 2026 PhotoVault v{versionData.current} - Built for Creators</p>
      </footer>
    </div>
  );
}

export default App;
