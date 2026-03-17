import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'nl.fotolerant.photovault',
  appName: 'PhotoVerify v0.9.9',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowMixedContent: true
  }
};

export default config;
