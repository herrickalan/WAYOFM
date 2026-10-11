import type { ExpoConfig } from 'expo/config';
import { existsSync } from 'node:fs';

const splash = existsSync('./assets/wowee-progress.png')
  ? './assets/wowee-progress.png'
  : './assets/app-icon.png';

const config: ExpoConfig = {
  name: 'WAYO 104.3FM',
  slug: 'wayo-radio',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'wayo',
  userInterfaceStyle: 'light',
  icon: './assets/app-icon.png',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'org.wayofm.radio',
    infoPlist: { UIBackgroundModes: ['audio'] },
  },
  android: {
    package: 'org.wayofm.radio',
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#087CFA',
    },
  },
  web: { name: 'WAYO 104.3FM', favicon: './assets/favicon.png' },
  plugins: [
    ['expo-audio', {
      microphonePermission: false,
      recordAudioAndroid: false,
      enableBackgroundRecording: false,
      enableBackgroundPlayback: true,
    }],
    ['expo-splash-screen', {
      image: splash,
      imageWidth: 240,
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    }],
  ],
};

export default config;
