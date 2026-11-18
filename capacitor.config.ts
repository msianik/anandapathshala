import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anandapathshala.portal',
  appName: 'আনন্দ পাঠশালা',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // Allows loading local bundled build with fallback to live HTTPS origin
    androidScheme: 'https',
    iosScheme: 'https'
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scheme: 'AnandoPathshala'
  }
};

export default config;
