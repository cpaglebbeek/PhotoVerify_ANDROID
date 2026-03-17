import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { addToHistory } from './history';

interface NativeBridgePlugin {
  openFolderPicker(): Promise<void>;
  saveFileFromPath(options: { filename: string; tempPath: string; mimeType: string }): Promise<void>;
  saveToSelectedFolder(options: { filename: string; base64Data: string; mimeType: string }): Promise<void>;
}

const NativeBridge = registerPlugin<NativeBridgePlugin>('NativeBridge');

export const saveFile = async (dataUrl: string, fileName: string, type: 'image' | 'deed' = 'image') => {
  if (Capacitor.isNativePlatform()) {
    const safUri = localStorage.getItem('saf_folder_uri');
    const base64Data = dataUrl.split(',')[1];
    const mimeType = type === 'image' ? 'image/png' : 'application/zip';

    try {
      // 1. Write the file to the app's private CACHE directory first.
      // This is fast, doesn't need permissions, and handles large data well.
      const tempFile = await Filesystem.writeFile({
        path: `temp_${Date.now()}_${fileName}`,
        data: base64Data,
        directory: Directory.Cache
      });

      // 2. Try the Native Bridge to copy it to the user's selected SAF folder
      if (safUri) {
        console.log(`[SAF] Requesting native copy for ${fileName} via SAF...`);
        try {
          await NativeBridge.saveFileFromPath({
            filename: fileName,
            tempPath: tempFile.uri,
            mimeType: mimeType
          });
          
          addToHistory({ filename: fileName, type, dataUrl: type === 'deed' ? dataUrl : undefined });
          
          // Cleanup temp file
          await Filesystem.deleteFile({
            path: tempFile.uri
          }).catch(e => console.warn('Temp cleanup failed', e));
          
          return;
        } catch (nativeErr) {
          console.error('[SAF] Native bridge failed:', nativeErr);
          // Fall through to alert
        }
      }

      // If we are here, either no SAF folder is set or the bridge failed.
      // On Android 11+, Directory.Documents will fail with EACCESS.
      // We inform the user they MUST select a folder.
      alert(`Save failed. Please ensure a storage folder is selected in the app startup. The system restricts direct access to your Documents folder.`);
      
      // Trigger picker if nothing is set
      if (!safUri) {
        await NativeBridge.openFolderPicker().catch(e => console.error('Picker call failed', e));
      }

    } catch (err) {
      const error = err as Error;
      console.error('Save operation failed:', error);
      alert(`Fatal save error: ${error.message}`);
    }
  } else {
    // Web implementation
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
