import { Device } from '@capacitor/device';
import { sha256 } from './timeAnchor';

export interface LicenseStatus {
  active: boolean;
  expiry: number;
  deviceHash: string;
  lastCheck: number;
  message?: string;
}

const STORAGE_KEY = 'photovault_license_state';

/**
 * Generates a unique hash tied to hardware (Native) or browser fingerprint (Web).
 */
export const getDeviceHash = async (): Promise<string> => {
  const info = await Device.getId();
  const model = (await Device.getInfo()).model;
  // Use string seed for sha256 to avoid type mismatch
  const seed = `${info.identifier}_${model}_PV_SALT_2026`;
  const hash = await sha256(seed);
  return hash.toUpperCase().substring(0, 16);
};

/**
 * Checks server for license validity. 
 * Local-First: Checks localStorage first for valid, non-expired license.
 */
export const checkLicense = async (hash: string, serverUrl: string, forceSync = false): Promise<LicenseStatus> => {
  const localState: LicenseStatus = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  const now = Date.now();
  const GRACE_PERIOD = 24 * 60 * 60 * 1000; // 1 Day

  // 1. Fast Path: Use local if active, not expired, and not forcing a sync
  if (!forceSync && localState && localState.deviceHash === hash && localState.active && localState.expiry > now) {
    const timeSinceLastCheck = now - localState.lastCheck;
    if (timeSinceLastCheck < GRACE_PERIOD) {
      return { ...localState, message: localState.message || "License Active (Offline)" };
    }
  }

  // 2. Sync Path: Try to retrieve from server
  try {
    const res = await fetch(`${serverUrl}/licenses/${hash}.json`, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) throw new Error("ID not registered on server");
      throw new Error("Server communication error");
    }
    
    const serverData = await res.json();
    const newState: LicenseStatus = {
      active: serverData.active && serverData.expiry > now,
      expiry: serverData.expiry,
      deviceHash: hash,
      lastCheck: now,
      message: serverData.message || "License Verified"
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    return newState;
  } catch (err: unknown) {
    const error = err as Error;
    // 3. Fallback Path: If server fails, check if we can stay in offline grace period
    if (localState && localState.deviceHash === hash) {
      const timeSinceLastCheck = now - localState.lastCheck;
      if (timeSinceLastCheck < GRACE_PERIOD) {
        return { ...localState, message: "Offline Mode (Grace Period Active)" };
      }
      return { ...localState, active: false, message: error.message || "Grace period expired. Connect to internet." };
    }
    
    return { active: false, expiry: 0, deviceHash: hash, lastCheck: 0, message: error.message || "Activation required." };
  }
};
