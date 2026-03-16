import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { addToHistory } from './history';

export const saveFile = async (dataUrl: string, fileName: string, type: 'image' | 'deed' = 'image') => {
  if (Capacitor.isNativePlatform()) {
    const safUri = localStorage.getItem('saf_folder_uri');
    const base64Data = dataUrl.split(',')[1];
    const mimeType = type === 'image' ? 'image/png' : 'application/zip';

    if (safUri) {
      // Use the Native SAF Bridge we built in MainActivity
      console.log(`[SAF] Sending file ${fileName} to native bridge...`);
      // Since we can't call methods directly, we use evaluateJavascript-style bridge via window
      (window as any).Capacitor.nativeCallback('PhotoVerify', 'saveToSelectedFolder', {
        filename: fileName,
        base64Data: base64Data,
        mimeType: mimeType
      });
      
      addToHistory({ filename: fileName, type, dataUrl: type === 'deed' ? dataUrl : undefined });
      return;
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
      alert(`Save failed: ${error.message}. Ensure storage permissions are granted in Android settings.`);
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
