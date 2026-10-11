import React, { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { type StationPage } from '../config';
import { openExternal } from '../services/links';
import { colors as c } from '../theme';
import { Button, Icon } from './ui';
import { EMBED_BASE_URL, embeddedPlayerHtml } from '../services/embeddedMedia';
import LoadingScreen from './LoadingScreen';
import VideoPicker from './VideoPicker';

export type PageViewerProps = { page: StationPage | null; onClose: () => void; onError: (message: string) => void };

export default function PageViewer({ page, onClose, onError }: PageViewerProps) {
  const [failure, setFailure] = useState(false);
  const [version, setVersion] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const video = page?.videos?.[videoIndex];
  const selectedUrl = video?.url ?? page?.url;
  useEffect(() => { setVideoIndex(0); }, [page?.url]);
  useEffect(() => { setFailure(false); setVersion(0); }, [selectedUrl]);
  if (!page) return null;
  const url = selectedUrl ?? page.url;
  const title = video?.title ?? page.title;
  const browserUrl = page.browserUrl ?? video?.browserUrl ?? page.url;
  const source = page.embed
    ? { html: embeddedPlayerHtml(url, title), baseUrl: EMBED_BASE_URL }
    : { uri: url };
  return <Modal visible animationType="slide" onRequestClose={onClose} onDismiss={() => setFailure(false)}>
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close page" onPress={() => { setFailure(false); onClose(); }} style={s.iconButton}><Icon name="x" /></Pressable>
        <Text numberOfLines={1} style={s.title}>{page.title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Open in browser" style={s.iconButton} onPress={() => void openExternal(browserUrl).catch(() => onError('Could not open the browser.'))}><Icon name="external-link" size={19} /></Pressable>
      </View>
      {failure ? <View style={s.failure}><Icon name="wifi-off" size={36} /><Text style={s.message}>This page could not be loaded. Check your connection or open it in your browser.</Text><Button title="Try again" onPress={() => { setFailure(false); setVersion(v => v + 1); }} /><Button title="Open in browser" kind="light" onPress={() => void openExternal(browserUrl).catch(() => onError('Could not open the browser.'))} /></View> :
        <WebView key={`${url}-${version}`} source={source} style={{ flex: 1 }} startInLoadingState
          renderLoading={() => <View style={s.loading}><LoadingScreen label={page.embed ? 'Loading the player…' : 'Loading WAYO…'} /></View>}
          onError={() => setFailure(true)}
          onHttpError={event => { if (event.nativeEvent.url === url && event.nativeEvent.statusCode >= 400) setFailure(true); }}
          allowsInlineMediaPlayback allowsFullscreenVideo mediaPlaybackRequiresUserAction allowsBackForwardNavigationGestures
          mixedContentMode="never" javaScriptCanOpenWindowsAutomatically={false}
          onOpenWindow={event => void openExternal(event.nativeEvent.targetUrl).catch(() => onError('Could not open that link.'))}
          onShouldStartLoadWithRequest={request => {
            if (request.url === 'about:blank' || request.url.startsWith('https://')) return true;
            if (/^(tel:|sms:|mailto:)/i.test(request.url)) void Linking.openURL(request.url).catch(() => onError('No app is available for that link.'));
            return false;
          }} />}
      {page.videos && <VideoPicker videos={page.videos} selected={videoIndex} onSelect={setVideoIndex} />}
    </SafeAreaView>
  </Modal>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.paper },
  header: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: c.line, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontWeight: '800', fontSize: 17, color: c.ink, textAlign: 'center' },
  loading: { position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: c.paper },
  failure: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  message: { color: c.muted, lineHeight: 23, fontSize: 15, textAlign: 'center', maxWidth: 380 },
});
