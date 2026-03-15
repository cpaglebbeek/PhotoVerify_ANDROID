/**
 * Virtual Storage Utility v5.2 - Robust Elastic Anchor
 * 
 * 1. Scale-First Recovery: Prioritizes 1.0 scale for faster self-tests.
 * 2. Fine-Grained Sync: Reduced sync search step for better alignment.
 * 3. Enhanced Diagnostics: Returns info even on partial failures.
 */

const CELL_SIZE = 32;
const DELTA = 30; // Increased for better resistance to interpolation
const MAGIC_NUMBER = 0x564D; 
const SYNC_PATTERN = 0xAA55AA55; 
const HEADER_SIZE = 8; 
const PAYLOAD_BYTES = 3; 
const TOTAL_STORE_BYTES = HEADER_SIZE + PAYLOAD_BYTES;

export interface VirtualMemory {
  uid: string;
  timestamp: number;
  confidence: number;
  scale: number;
  diagnostics?: string;
}

export const generateFingerprint = async (imageData: ImageData): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', imageData.data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const getBlockCoreAvg = (data: Uint8ClampedArray, x: number, y: number, width: number, height: number, cellSize: number): number => {
  let sum = 0, count = 0;
  const core = cellSize * 0.5;
  const off = cellSize * 0.25;
  
  for (let by = 0; by < core; by++) {
    for (let bx = 0; bx < core; bx++) {
      const px = Math.floor(x + off + bx);
      const py = Math.floor(y + off + by);
      if (px >= 0 && px < width && py >= 0 && py < height) {
        const idx = (py * width + px) * 4;
        sum += data[idx + 2];
        count++;
      }
    }
  }
  return count > 0 ? sum / count : 128;
};

const modulateBlock = (data: Uint8ClampedArray, x: number, y: number, width: number, height: number, shift: number) => {
  const core = 16, off = 8;
  for (let by = 0; by < core && (y + off + by) < height; by++) {
    for (let bx = 0; bx < core && (x + off + bx) < width; bx++) {
      const idx = ((y + off + by) * width + (x + off + bx)) * 4;
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + shift));
      data[idx + 3] = 255;
    }
  }
};

const getBitCoordsScaled = (bitIdx: number, width: number, startX: number, startY: number, cellSize: number) => {
  const bitStep = cellSize * 2;
  const perRow = Math.floor((width - startX) / bitStep);
  if (perRow <= 0) return { x: 0, y: 999999 }; 
  return { 
    x: startX + (bitIdx % perRow) * bitStep, 
    y: startY + Math.floor(bitIdx / perRow) * cellSize 
  };
};

export const injectVirtualData = (imageData: ImageData, uidHex: string): ImageData => {
  const { data, width, height } = imageData;
  const hex = uidHex.padStart(6, '0').slice(0, 6);
  const bytes = new Uint8Array(PAYLOAD_BYTES);
  for(let i = 0; i < 3; i++) bytes[i] = parseInt(hex.substr(i*2, 2), 16);

  const fullPayload = new Uint8Array(TOTAL_STORE_BYTES);
  fullPayload[0] = 0xAA; fullPayload[1] = 0x55; fullPayload[2] = 0xAA; fullPayload[3] = 0x55;
  fullPayload[4] = (MAGIC_NUMBER >> 8) & 0xFF; fullPayload[5] = MAGIC_NUMBER & 0xFF;
  fullPayload.set(bytes, 8);

  const streamBits = fullPayload.length * 8;
  const totalSlots = Math.floor(width / (CELL_SIZE * 2)) * Math.floor(height / CELL_SIZE);

  for (let s = 0; s < totalSlots; s++) {
    const bit = (fullPayload[Math.floor((s % streamBits) / 8)] >> (7 - (s % 8))) & 1;
    const bitStep = CELL_SIZE * 2;
    const perRow = Math.floor(width / bitStep);
    const x = (s % perRow) * bitStep;
    const y = Math.floor(s / perRow) * CELL_SIZE;
    
    if (x + bitStep > width || y + CELL_SIZE > height) break;
    modulateBlock(data, x, y, width, height, bit === 1 ? DELTA : -DELTA);
    modulateBlock(data, x + CELL_SIZE, y, width, height, bit === 1 ? -DELTA : DELTA);
  }
  return imageData;
};

export const extractVirtualData = (imageData: ImageData): VirtualMemory | null => {
  const { data, width, height } = imageData;
  const streamBits = TOTAL_STORE_BYTES * 8;

  let bestScale = 1.0, bestX = 0, bestY = 0, syncFound = false;
  let maxSyncMatches = 0;

  // We check 1.0 first, then a range from 0.8 to 1.2
  const scalesToTry = [1.0];
  for (let s = 0.8; s <= 1.21; s += 0.01) {
    if (Math.abs(s - 1.0) > 0.001) scalesToTry.push(s);
  }

  for (const scale of scalesToTry) {
    const currentCellSize = CELL_SIZE * scale;
    // Step of 2 instead of 4 for better precision
    for (let sy = 0; sy < Math.min(currentCellSize, 16); sy += 2) {
      for (let sx = 0; sx < Math.min(currentCellSize, 16); sx += 2) {
        let matches = 0;
        for (let i = 0; i < 32; i++) {
          const coords = getBitCoordsScaled(i, width, sx, sy, currentCellSize);
          if (coords.y + currentCellSize > height) break;
          const avgA = getBlockCoreAvg(data, coords.x, coords.y, width, height, currentCellSize);
          const avgB = getBlockCoreAvg(data, coords.x + currentCellSize, coords.y, width, height, currentCellSize);
          const bit = avgA > avgB ? 1 : 0;
          const expected = (SYNC_PATTERN >>> (31 - i)) & 1;
          if (bit === expected) matches++;
        }
        if (matches > maxSyncMatches) {
          maxSyncMatches = matches;
          bestScale = scale; bestX = sx; bestY = sy;
        }
        if (matches >= 30) { syncFound = true; break; }
      }
      if (syncFound) break;
    }
    if (syncFound) break;
  }

  if (maxSyncMatches < 24) return null;

  const finalCellSize = CELL_SIZE * bestScale;
  const totalSlots = Math.floor((width - bestX) / (finalCellSize * 2)) * Math.floor((height - bestY) / finalCellSize);
  
  const bitVotes: { [key: number]: number }[] = new Array(streamBits).fill(0).map(() => ({ 0: 0, 1: 0 }));
  for (let s = 0; s < totalSlots; s++) {
    const coords = getBitCoordsScaled(s, width, bestX, bestY, finalCellSize);
    if (coords.y + finalCellSize > height) break;
    const avgA = getBlockCoreAvg(data, coords.x, coords.y, width, height, finalCellSize);
    const avgB = getBlockCoreAvg(data, coords.x + finalCellSize, coords.y, width, height, finalCellSize);
    const bit = avgA > avgB ? 1 : 0;
    const votes = bitVotes[s % streamBits];
    if (bit === 1) votes[1]++; else votes[0]++;
  }

  const buffer = new Uint8Array(TOTAL_STORE_BYTES);
  let totalAgreement = 0;
  for (let i = 0; i < TOTAL_STORE_BYTES; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      const votes = bitVotes[i * 8 + b];
      const bit = votes[1] > votes[0] ? 1 : 0;
      byte = (byte << 1) | bit;
      totalAgreement += (Math.max(votes[0], votes[1]) / (votes[0] + votes[1] || 1));
    }
    buffer[i] = byte;
  }

  const magicMatch = ((buffer[4] << 8) | buffer[5]) === MAGIC_NUMBER;
  if (!magicMatch) return null;

  const hex = Array.from(buffer.slice(8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('').toUpperCase();

  return {
    uid: hex,
    timestamp: Date.now(),
    confidence: (totalAgreement / streamBits),
    scale: bestScale,
    diagnostics: `Locked at ${(bestScale*100).toFixed(1)}% scale. Offset: (${bestX},${bestY}). Sync: ${maxSyncMatches}/32.`
  };
};

export const calculateCapacity = (_width: number, _height: number): number => 6;
