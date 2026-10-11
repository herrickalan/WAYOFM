import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LINKS, type StationPage } from '../config';
import { type Episode, ARCHIVE_URL, episodeDate, episodeDuration, getEpisodes, mergeEpisodes, mixcloudEmbed } from '../services/mixcloud';
import { colors as c } from '../theme';
import { Button, ErrorNotice, Eyebrow, Icon } from '../components/ui';
import LoadingScreen from '../components/LoadingScreen';

export default function ArchivesScreen({ openPage }: { openPage: (page: StationPage) => void }) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const active = useRef<AbortController | null>(null);

  const load = useCallback(async (url = ARCHIVE_URL, append = false) => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setError(null);
    try {
      const page = await getEpisodes(url, controller.signal);
      if (controller.signal.aborted) return;
      setEpisodes(previous => append ? mergeEpisodes(previous, page.episodes) : page.episodes);
      setNext(page.next);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Unable to load the archive.');
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }, []);

  useEffect(() => { void load(); return () => active.current?.abort(); }, [load]);
  const filtered = episodes.filter(episode => episode.name.toLowerCase().includes(search.trim().toLowerCase()));

  return <View style={s.root}>
    <View style={s.titleRow}><Eyebrow>THE WAYO ARCHIVE</Eyebrow><Pressable accessibilityRole="button" accessibilityLabel="Refresh archive" disabled={busy} style={s.refresh} onPress={() => void load()}><Icon name="refresh-cw" size={18} color={c.blue} /></Pressable></View>
    <Text style={s.title}>Good radio.{ '\n' }<Text style={{ color: c.blue }}>On your time.</Text></Text>
    <Text style={s.description}>Replay your favorites and discover something new. Past broadcasts, straight from WAYO on Mixcloud.</Text>
    <View style={s.search}><Icon name="search" color={c.muted} size={19} /><TextInput accessibilityLabel="Search loaded episodes" placeholder="Search loaded episodes" placeholderTextColor={c.muted} value={search} onChangeText={setSearch} style={s.input} autoCapitalize="none" returnKeyType="search" />{search.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')} style={s.clear}><Icon name="x" size={17} /></Pressable>}</View>
    <View style={s.meta}><Text style={s.count}>{search ? `${filtered.length} matching episodes` : `${episodes.length} episodes loaded`}</Text><Pressable accessibilityRole="button" onPress={() => openPage({ title: 'All WAYO episodes', url: LINKS.episodes })}><Text style={s.all}>All episodes ↗</Text></Pressable></View>
    {busy && episodes.length === 0 && <LoadingScreen compact label="Loading the archive…" />}
    {filtered.map(episode => <Pressable accessibilityRole="button" accessibilityLabel={`Play ${episode.name}`} key={episode.key} style={s.episode} onPress={() => openPage({ title: episode.name, url: mixcloudEmbed(episode.key), browserUrl: episode.url, embed: true })}>
      <View style={s.cover}>{episode.image && !failedImages.has(episode.key) ? <Image source={{ uri: episode.image }} style={s.image} onError={() => setFailedImages(previous => new Set([...previous, episode.key]))} /> : <Icon name="disc" size={32} color={c.blue} />}</View>
      <View style={{ flex: 1, gap: 6 }}><Text numberOfLines={2} style={s.episodeName}>{episode.name}</Text><Text style={s.episodeMeta}>{episodeDate(episode.created)} · {episodeDuration(episode.duration)}</Text><Text style={s.mixcloud}>PLAY IN APP · MIXCLOUD</Text></View><View style={s.play}><Icon name="play" size={16} color={c.ink} /></View>
    </Pressable>)}
    {!busy && !error && filtered.length === 0 && <View style={s.empty}><Icon name="disc" size={37} color={c.muted} /><Text style={s.emptyTitle}>{search ? 'No matching episodes loaded' : 'No episodes available yet'}</Text><Text style={s.emptyCopy}>{search ? 'Try another title, load more episodes, or explore the complete archive.' : 'Check back soon or browse the archive on the WAYO website.'}</Text></View>}
    {error && <ErrorNotice message={error} onRetry={() => void load(episodes.length && next ? next : ARCHIVE_URL, Boolean(episodes.length && next))} onWebsite={() => openPage({ title: 'WAYO episodes', url: LINKS.episodes })} />}
    {next && <Button title={busy ? 'Loading episodes…' : 'Load more episodes'} busy={busy} disabled={busy} kind="light" icon="plus" onPress={() => void load(next, true)} />}
    <View style={s.footer}><Icon name="headphones" color={c.muted} size={16} /><Text style={s.footerText}>Archive playback is provided by Mixcloud.</Text></View>
  </View>;
}

const s = StyleSheet.create({
  root: { gap: 17 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -9 },
  refresh: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 39, lineHeight: 44, color: c.ink, fontWeight: '900', letterSpacing: -1.8 },
  description: { color: c.muted, fontSize: 14, lineHeight: 23 },
  search: { backgroundColor: c.white, borderWidth: 1, borderColor: c.line, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingLeft: 15, gap: 10 },
  input: { flex: 1, height: 50, color: c.ink, fontSize: 14, paddingRight: 8 },
  clear: { padding: 12 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 34 },
  count: { fontSize: 11, color: c.muted, fontWeight: '600' },
  all: { fontSize: 12, color: c.blue, fontWeight: '800', paddingVertical: 10 },
  episode: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, backgroundColor: c.white, borderRadius: 16, borderWidth: 1, borderColor: c.line },
  cover: { width: 74, height: 82, borderRadius: 9, backgroundColor: c.paleBlue, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  episodeName: { fontSize: 14, lineHeight: 19, color: c.ink, fontWeight: '800' },
  episodeMeta: { color: c.muted, fontSize: 10 },
  mixcloud: { color: c.blue, fontSize: 8, letterSpacing: 1.1, fontWeight: '800' },
  play: { width: 37, height: 37, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c.paper },
  empty: { alignItems: 'center', paddingVertical: 35, gap: 12 },
  emptyTitle: { color: c.ink, fontSize: 16, fontWeight: '800' },
  emptyCopy: { color: c.muted, fontSize: 13, lineHeight: 21, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 7, paddingTop: 4 },
  footerText: { color: c.muted, fontSize: 11 },
});
