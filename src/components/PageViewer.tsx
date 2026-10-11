import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { type StationPage } from '../config';
import { openExternal } from '../services/links';
import { colors as c } from '../theme';
import { Button, Icon } from './ui';
import { EMBED_BASE_URL, embeddedPlayerHtml } from '../services/embeddedMedia';
import { decidePageNavigation, isMediaPage } from '../services/pageNavigation';
import LoadingScreen from './LoadingScreen';
import VideoPicker from './VideoPicker';
import PageFrame from './PageFrame';

export type PageViewerProps = {
  page: StationPage;
  onClose: () => void;
  onError: (message: string) => void;
  backLabel: string;
  onHome: () => void;
  onOpenPage: (page: StationPage) => void;
};

export default function PageViewer({ page, onClose, onError, backLabel, onHome, onOpenPage }: PageViewerProps) {
  const [failure, setFailure] = useState(false);
  const [version, setVersion] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const [popupUrl, setPopupUrl] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const webview = useRef<WebView>(null);
  const documentUrl = useRef(page.url);
  const website = !isMediaPage(page);
  const video = page.videos?.[videoIndex];
  const url = video?.url ?? popupUrl ?? page.url;
  useEffect(() => { setVideoIndex(0); setPopupUrl(null); }, [page.url]);
  useEffect(() => { setFailure(false); setVersion(0); documentUrl.current = url; }, [url]);
  const title = video?.title ?? page.title;
  const browserUrl = page.browserUrl ?? video?.browserUrl ?? page.url;
  const source = page.embed
    ? { html: embeddedPlayerHtml(url, title), baseUrl: EMBED_BASE_URL }
    : { uri: url };
  const player = failure ? <ScrollView contentContainerStyle={s.failure} nestedScrollEnabled>
    <Icon name="wifi-off" size={36} /><Text style={s.message}>This {website ? 'page' : 'player'} could not be loaded. Check your connection and try again.</Text>
    <Button title="Try again" onPress={() => { if (website) setPopupUrl(documentUrl.current); setFailure(false); setVersion(v => v + 1); }} />
    <Button title="Open in browser" kind="light" onPress={() => void openExternal(browserUrl).catch(() => onError('Could not open the browser.'))} />
  </ScrollView> : <WebView ref={webview} key={`${url}-${version}`} source={source} style={{ flex: 1, minHeight: 0 }} startInLoadingState
    renderLoading={() => <View style={s.loading}><LoadingScreen label={website ? 'Loading WAYO…' : 'Loading the player…'} /></View>}
    onError={() => setFailure(true)}
    onLoadStart={event => { if (event.nativeEvent.url.startsWith('https://')) documentUrl.current = event.nativeEvent.url; }}
    onNavigationStateChange={navigation => { if (navigation.url.startsWith('https://')) documentUrl.current = navigation.url; setCanGoBack(navigation.canGoBack); }}
    onHttpError={event => { if ([url, documentUrl.current].includes(event.nativeEvent.url) && event.nativeEvent.statusCode >= 400) setFailure(true); }}
    allowsInlineMediaPlayback allowsFullscreenVideo mediaPlaybackRequiresUserAction allowsBackForwardNavigationGestures nestedScrollEnabled
    mixedContentMode="never" javaScriptCanOpenWindowsAutomatically={false}
    // Route every scheme through our handler. WebView's default whitelist can
    // hand rejected youtube:// or intent:// URLs straight to the operating system.
    originWhitelist={['*']}
    onOpenWindow={event => {
      const target = event.nativeEvent.targetUrl;
      const navigation = decidePageNavigation(target, { ...page, url }, true);
      if (navigation.action === 'open') onOpenPage(navigation.page);
      else if (navigation.action === 'allow' && website && target.startsWith('https://')) setPopupUrl(target);
      else if (navigation.action === 'external') void Linking.openURL(navigation.url).catch(() => onError('No app is available for that link.'));
    }}
    onShouldStartLoadWithRequest={request => {
      const navigation = decidePageNavigation(request.url, { ...page, url }, request.isTopFrame);
      if (navigation.action === 'open') onOpenPage(navigation.page);
      else if (navigation.action === 'external') void Linking.openURL(navigation.url).catch(() => onError('No app is available for that link.'));
      return navigation.action === 'allow';
    }} />;
  const picker = page.videos && <VideoPicker videos={page.videos} selected={videoIndex} onSelect={setVideoIndex} />;
  const tools = website && <View style={s.tools}>
    <Pressable accessibilityRole="button" accessibilityLabel="Previous website page" accessibilityState={{ disabled: !canGoBack || failure }} disabled={!canGoBack || failure} style={s.tool} onPress={() => webview.current?.goBack()}><Icon name="arrow-left" size={16} color={canGoBack && !failure ? c.blue : c.muted} /><Text style={s.toolLabel}>Previous page</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Reload website page" disabled={failure} style={s.tool} onPress={() => webview.current?.reload()}><Icon name="refresh-cw" size={16} color={c.blue} /><Text style={s.toolLabel}>Reload</Text></Pressable>
  </View>;
  return <PageFrame title={title} backLabel={backLabel} onBack={onClose} onHome={onHome}
    website={website} tools={tools} video={url.startsWith('https://www.youtube.com/embed/')} live={!page.embed} player={player} picker={picker} />;
}

const s = StyleSheet.create({
  tools: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.line },
  tool: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 44, paddingHorizontal: 4 },
  toolLabel: { color: c.muted, fontSize: 12, fontWeight: '600' },
  loading: { position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: c.paper },
  failure: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  message: { color: c.muted, lineHeight: 23, fontSize: 15, textAlign: 'center', maxWidth: 380 },
});
