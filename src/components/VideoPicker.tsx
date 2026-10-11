import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { type EmbeddedVideo } from '../config';
import { colors as c } from '../theme';
import { Icon } from './ui';

export default function VideoPicker({ videos, selected, onSelect }: {
  videos: readonly EmbeddedVideo[]; selected: number; onSelect: (index: number) => void;
}) {
  return <View style={s.root}>
    <Text style={s.heading}>LIVE AT WAYO · FEATURED PERFORMANCES</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.list}>
      {videos.map((video, index) => <Pressable key={video.url} accessibilityRole="button" accessibilityLabel={`Play ${video.title}`} accessibilityState={{ selected: selected === index }} onPress={() => onSelect(index)} style={[s.video, selected === index && s.selected]}>
        <Icon name="play" size={16} color={selected === index ? c.white : c.blue} />
        <Text style={[s.title, selected === index && { color: c.white }]}>{video.title}</Text>
      </Pressable>)}
    </ScrollView>
  </View>;
}

const s = StyleSheet.create({
  root: { paddingVertical: 16, gap: 12, borderTopWidth: 1, borderTopColor: c.line },
  heading: { color: c.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1, paddingHorizontal: 20 },
  list: { paddingHorizontal: 20, gap: 10 },
  video: { width: 205, minHeight: 70, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: c.line, borderRadius: 12, backgroundColor: c.white },
  selected: { backgroundColor: c.blue, borderColor: c.blue },
  title: { flex: 1, color: c.ink, fontSize: 12, fontWeight: '700', lineHeight: 18 },
});
