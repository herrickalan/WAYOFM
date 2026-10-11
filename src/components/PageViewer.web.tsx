import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { openExternal } from '../services/links';
import { colors as c } from '../theme';
import { Icon } from './ui';
import type { PageViewerProps } from './PageViewer';

export default function PageViewer({ page, onClose, onError }: PageViewerProps) {
  if (!page) return null;
  return <Modal visible animationType="slide" onRequestClose={onClose}>
    <View style={s.root}>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close page" style={s.close} onPress={onClose}><Icon name="x" /></Pressable>
        <Text style={s.title} numberOfLines={1}>{page.title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Open in browser" style={s.close} onPress={() => void openExternal(page.url).catch(() => onError('Could not open the browser.'))}><Icon name="external-link" /></Pressable>
      </View>
      <Text style={s.note}>Having trouble viewing this page? Open it in your browser.</Text>
      {React.createElement('iframe', { src: page.url, title: page.title, allow: 'autoplay; fullscreen', referrerPolicy: 'strict-origin-when-cross-origin', style: { border: 0, width: '100%', flex: 1, backgroundColor: c.white } })}
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
