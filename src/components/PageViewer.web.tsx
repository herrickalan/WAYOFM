import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { openExternal } from '../services/links';
import { colors as c } from '../theme';
import { Icon } from './ui';
import type { PageViewerProps } from './PageViewer';
import VideoPicker from './VideoPicker';
import PageFrame from './PageFrame';
import { EMBED_SANDBOX } from '../services/embeddedMedia';
import { isMediaPage } from '../services/pageNavigation';

export default function PageViewer({ page, onClose, onError, backLabel, onHome }: PageViewerProps) {
  const [videoIndex, setVideoIndex] = useState(0);
  useEffect(() => { setVideoIndex(0); }, [page.url]);
  const website = !isMediaPage(page);
  const video = page.videos?.[videoIndex];
  const url = video?.url ?? page.url;
  const browserUrl = page.browserUrl ?? video?.browserUrl ?? page.url;
  const title = video?.title ?? page.title;
  const player = React.createElement('iframe', {
    key: url, src: url, title, allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture',
    allowFullScreen: true, referrerPolicy: 'strict-origin-when-cross-origin',
    sandbox: EMBED_SANDBOX,
    style: { border: 0, width: '100%', height: '100%', display: 'block', backgroundColor: page.embed ? c.ink : c.white },
  });
  const picker = page.videos && <VideoPicker videos={page.videos} selected={videoIndex} onSelect={setVideoIndex} />;
  const tools = website && <View style={s.tools}>
    <Pressable accessibilityRole="button" accessibilityLabel="Open in browser" style={s.browser} onPress={() => void openExternal(browserUrl).catch(() => onError('Could not open the browser.'))}><Icon name="external-link" size={16} color={c.blue} /><Text style={s.label}>Open in browser</Text></Pressable>
  </View>;
  return <PageFrame title={title} backLabel={backLabel} onBack={onClose} onHome={onHome}
    website={website} tools={tools} video={url.startsWith('https://www.youtube.com/embed/')} live={!page.embed} player={player} picker={picker} />;
}

const s = StyleSheet.create({
  tools: { alignItems: 'flex-end', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.line },
  browser: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  label: { color: c.blue, fontSize: 12, fontWeight: '600' },
});
