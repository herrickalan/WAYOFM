import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export async function openExternal(url: string): Promise<void> {
  const parsed = new URL(url);
  if (!['https:', 'tel:', 'sms:', 'mailto:'].includes(parsed.protocol)) throw new Error('This link is not supported.');
  if (parsed.protocol === 'https:' && Platform.OS !== 'web') {
    await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET });
  } else {
    await Linking.openURL(url);
  }
}
