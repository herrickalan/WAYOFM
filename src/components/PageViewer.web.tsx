import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { openExternal } from '../services/links';
import { colors as c } from '../theme';
import { Icon } from './ui';
import type { PageViewerProps } from './PageViewer';
import VideoPicker from './VideoPicker';

export default function PageViewer({ page, onClose, onError }: PageViewerProps) {
  const [videoIndex, setVideoIndex] = useState(0);
  useEffect(() => { setVideoIndex(0); }, [page?.url]);
  if (!page) return null;
  const video = page.videos?.[videoIndex];
  const url = video?.url ?? page.url;
  const browserUrl = page.browserUrl ?? video?.browserUrl ?? page.url;
  return <Modal visible animationType="slide" onRequestClose={onClose}>
    <View style={s.root}>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close page" style={s.close} onPress={onClose}><Icon name="x" /></Pressable>
        <Text style={s.title} numberOfLines={1}>{page.title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Open in browser" style={s.close} onPress={() => void openExternal(browserUrl).catch(() => onError('Could not open the browser.'))}><Icon name="external-link" /></Pressable>
      </View>
      <Text style={s.note}>Having trouble viewing this page? Open it in your browser.</Text>
      {React.createElement('iframe', { key: url, src: url, title: video?.title ?? page.title, allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture', allowFullScreen: true, referrerPolicy: 'strict-origin-when-cross-origin', style: { border: 0, width: '100%', flex: 1, minHeight: 200, backgroundColor: page.embed ? c.ink : c.white } })}
      {page.videos && <VideoPicker videos={page.videos} selected={videoIndex} onSelect={setVideoIndex} />}
    </View>
  </Modal>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.paper },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomColor: c.line, borderBottomWidth: 1 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', textAlign: 'center', color: c.ink },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  note: { fontSize: 12, padding: 12, textAlign: 'center', color: c.muted },
});
