import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cooksnap.app',
  appName: 'CookSnap',
  webDir: 'public',
  server: {
    // Point to the live server - the Android WebView will load this URL
    url: 'https://preview-daa2a051.space.chatglm.site',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
