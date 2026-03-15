import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { addToHistory } from './history';

export const saveFile = async (dataUrl: string, fileName: string, type: 'image' | 'deed' = 'image') => {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = dataUrl.split(',')[1];
      // Use Documents folder as primary storage for all evidence files
      const targetDir = Directory.Documents;
      
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: targetDir,
        recursive: true
      });

      addToHistory({ filename: fileName, type, dataUrl: type === 'deed' ? dataUrl : undefined });
      alert(`Saved to Documents: ${fileName}`);
    } catch (err) {
      console.warn('Native save failed, falling back to Share:', err);
      try {
        const path = fileName;
        await Filesystem.writeFile({
          path,
          data: dataUrl.split(',')[1],
          directory: Directory.Cache,
        });
        const fileUri = await Filesystem.getUri({ directory: Directory.Cache, path });
        await Share.share({ title: fileName, url: fileUri.uri });
        addToHistory({ filename: fileName, type });
      } catch {
        alert('Could not save file to device.');
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
