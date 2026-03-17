import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'nl.fotolerant.photoverify',
  appName: 'PhotoVerify',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'photoverify.local'
  }
};

export default config;
