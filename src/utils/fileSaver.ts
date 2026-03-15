import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { addToHistory } from './history';

export const saveFile = async (dataUrl: string, fileName: string, type: 'image' | 'deed' = 'image') => {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = dataUrl.split(',')[1];
      // Save to Cache first to share from there
      const tempPath = fileName;
      await Filesystem.writeFile({
        path: tempPath,
        data: base64Data,
        directory: Directory.Cache
      });

      const fileUri = await Filesystem.getUri({ directory: Directory.Cache, path: tempPath });
      
      // For ZIP files (deeds), we always use Share to give the user "Save to Downloads" option
      await Share.share({
        title: fileName,
        url: fileUri.uri,
        dialogTitle: 'Save PhotoVerify Bundle'
      });

      addToHistory({ filename: fileName, type, dataUrl: type === 'deed' ? dataUrl : undefined });
    } catch (err) {
      console.error('Native save/share failed:', err);
      alert('Could not save file. Ensure storage permissions are granted.');
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
