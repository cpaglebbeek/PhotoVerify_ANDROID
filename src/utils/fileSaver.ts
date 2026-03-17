import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { addToHistory } from './history';

interface NativeBridgePlugin {
  openFolderPicker(): Promise<void>;
  saveToSelectedFolder(options: { filename: string; base64Data: string; mimeType: string }): Promise<void>;
}

const NativeBridge = registerPlugin<NativeBridgePlugin>('NativeBridge');

export const saveFile = async (dataUrl: string, fileName: string, type: 'image' | 'deed' = 'image') => {
  if (Capacitor.isNativePlatform()) {
    const safUri = localStorage.getItem('saf_folder_uri');
    const base64Data = dataUrl.split(',')[1];
    const mimeType = type === 'image' ? 'image/png' : 'application/zip';

    if (safUri) {
      try {
        console.log(`[SAF] Sending file ${fileName} to native bridge...`);
        await NativeBridge.saveToSelectedFolder({
          filename: fileName,
          base64Data: base64Data,
          mimeType: mimeType
        });
        
        addToHistory({ filename: fileName, type, dataUrl: type === 'deed' ? dataUrl : undefined });
        return;
      } catch (err) {
        console.error('[SAF] Native save failed:', err);
      }
    }

    try {
      // Fallback: Direct Write to Public Documents (if allowed)
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });

      addToHistory({ filename: fileName, type, dataUrl: type === 'deed' ? dataUrl : undefined });
      alert(`Success! File saved directly to your Documents folder: ${fileName}`);
      
    } catch (err) {
      const error = err as Error;
      console.error('Direct save to Documents failed:', error);
      alert(`Save failed: ${error.message}. Please select a storage folder in the app startup to grant permissions.`);
      
      // If direct save fails and no SAF is set, trigger folder picker
      if (!safUri) {
        await NativeBridge.openFolderPicker().catch(e => console.error('Picker call failed', e));
      }
    }
  } else {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToHistory({ filename: fileName, type, dataUrl: type === 'deed' ? dataUrl : undefined });
  }
};

export const saveJsonFile = async (jsonObject: object, fileName: string) => {
  const data = JSON.stringify(jsonObject, null, 2);
  const dataUrl = `data:application/json;base64,${btoa(data)}`;
  await saveFile(dataUrl, fileName, 'deed');
};
