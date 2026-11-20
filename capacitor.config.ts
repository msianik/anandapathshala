import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anandapathshala.portal',
  appName: 'আনন্দ পাঠশালা',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    // Automatically points the app to the live Vercel portal so all data and features stay updated in real-time
    url: 'https://anandapathshala.vercel.app/?app=android',
    cleartext: true,
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
