import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trovato.ai',
  appName: 'trovato-ai',
  webDir: 'www',

  server: {
    androidScheme: 'http',
  },
};

export default config;