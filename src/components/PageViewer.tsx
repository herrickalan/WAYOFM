import React, { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { type StationPage } from '../config';
import { openExternal } from '../services/links';
import { colors as c } from '../theme';
import { Button, Icon } from './ui';
import { EMBED_BASE_URL, canLoadMediaUrl, embeddedPlayerHtml, isEmbeddedPlayerUrl, mediaPageFromUrl } from '../services/embeddedMedia';
import LoadingScreen from './LoadingScreen';
import VideoPicker from './VideoPicker';
import MediaFrame from './MediaFrame';

export type PageViewerProps = {
  page: StationPage | null;
  onClose: () => void;
  onError: (message: string) => void;
  inline?: boolean;
  backLabel?: string;
  onHome?: () => void;
  onMediaPage?: (page: StationPage) => void;
};

export default function PageViewer({ page, onClose, onError, inline = false, backLabel = 'Listen', onHome, onMediaPage }: PageViewerProps) {
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
  const player = failure ? <ScrollView contentContainerStyle={s.failure} nestedScrollEnabled>
    <Icon name="wifi-off" size={36} /><Text style={s.message}>This {inline ? 'player' : 'page'} could not be loaded. Check your connection and try again.</Text>
    <Button title="Try again" onPress={() => { setFailure(false); setVersion(v => v + 1); }} />
    <Button title="Open in browser" kind="light" onPress={() => void openExternal(browserUrl).catch(() => onError('Could not open the browser.'))} />
  </ScrollView> : <WebView key={`${url}-${version}`} source={source} style={{ flex: 1, minHeight: 0 }} startInLoadingState
    renderLoading={() => <View style={s.loading}><LoadingScreen label={inline ? 'Loading the player…' : 'Loading WAYO…'} /></View>}
    onError={() => setFailure(true)}
    onHttpError={event => { if (event.nativeEvent.url === url && event.nativeEvent.statusCode >= 400) setFailure(true); }}
    allowsInlineMediaPlayback allowsFullscreenVideo mediaPlaybackRequiresUserAction allowsBackForwardNavigationGestures nestedScrollEnabled
    mixedContentMode="never" javaScriptCanOpenWindowsAutomatically={false}
    // Route every scheme through our handler. WebView's default whitelist can
    // hand rejected youtube:// or intent:// URLs straight to the operating system.
    originWhitelist={['*']}
    onOpenWindow={event => {
      const next = mediaPageFromUrl(event.nativeEvent.targetUrl);
      if (next && onMediaPage) {
        if (next.url !== url) onMediaPage(next);
      } else if (!inline) {
        void openExternal(event.nativeEvent.targetUrl).catch(() => onError('Could not open that link.'));
      }
    }}
    onShouldStartLoadWithRequest={request => {
      const next = mediaPageFromUrl(request.url);
      if (next && onMediaPage && (inline || request.isTopFrame) && !isEmbeddedPlayerUrl(request.url)) {
        if (next.url !== url) onMediaPage(next);
        return false;
      }
      if (inline) return canLoadMediaUrl(request.url, !!page.embed, request.isTopFrame);
      if (request.url === 'about:blank' || request.url.startsWith('https://')) return true;
      if (/^(tel:|sms:|mailto:)/i.test(request.url)) void Linking.openURL(request.url).catch(() => onError('No app is available for that link.'));
      return false;
    }} />;
  const picker = page.videos && <VideoPicker videos={page.videos} selected={videoIndex} onSelect={setVideoIndex} />;
  if (inline) return <MediaFrame title={title} backLabel={backLabel} onBack={onClose} onHome={onHome ?? onClose}
    video={url.startsWith('https://www.youtube.com/embed/')} live={!page.embed} player={player} picker={picker} />;
  return <Modal visible animationType="slide" onRequestClose={onClose} onDismiss={() => setFailure(false)}>
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close page" onPress={() => { setFailure(false); onClose(); }} style={s.iconButton}><Icon name="x" /></Pressable>
        <Text numberOfLines={1} style={s.title}>{page.title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Open in browser" style={s.iconButton} onPress={() => void openExternal(browserUrl).catch(() => onError('Could not open the browser.'))}><Icon name="external-link" size={19} /></Pressable>
      </View>
      {player}
      {picker}
    </SafeAreaView>
  </Modal>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.paper },
  header: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: c.line, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontWeight: '800', fontSize: 17, color: c.ink, textAlign: 'center' },
  loading: { position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: c.paper },
  failure: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  message: { color: c.muted, lineHeight: 23, fontSize: 15, textAlign: 'center', maxWidth: 380 },
});
