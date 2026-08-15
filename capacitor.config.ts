import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'app',
  webDir: 'www',
  server: {
    cleartext: true,
    androidScheme: 'http'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
