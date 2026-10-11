import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import Feather from '@expo/vector-icons/Feather';
import { LINKS, type StationPage } from './config';
import { colors as c } from './theme';
import { openExternal } from './services/links';
import { mediaPageFromUrl } from './services/embeddedMedia';
import { useLiveRadio } from './hooks/useLiveRadio';
import { Icon, Wordmark, type IconName } from './components/ui';
import PageViewer from './components/PageViewer';
import LoadingScreen from './components/LoadingScreen';
import ListenScreen from './screens/ListenScreen';
import ExploreScreen from './screens/ExploreScreen';
import ArchivesScreen from './screens/ArchivesScreen';
import CommunityScreen from './screens/CommunityScreen';

void SplashScreen.preventAutoHideAsync().catch(() => {});

type Tab = 'listen' | 'explore' | 'archives' | 'community';
const tabs: { id: Tab; title: string; icon: IconName }[] = [
  { id: 'listen', title: 'Listen', icon: 'radio' },
  { id: 'explore', title: 'Explore', icon: 'compass' },
  { id: 'archives', title: 'Archives', icon: 'headphones' },
  { id: 'community', title: 'Community', icon: 'users' },
];

function StationApp() {
  const [tab, setTab] = useState<Tab>('listen');
  const [page, setPage] = useState<StationPage | null>(null);
  const [media, setMedia] = useState<StationPage | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [visitedArchives, setVisitedArchives] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const radio = useLiveRadio();
  const [fontsLoaded, fontError] = useFonts(Feather.font);

  useEffect(() => { if (fontsLoaded || fontError) void SplashScreen.hideAsync(); }, [fontsLoaded, fontError]);
  useEffect(() => {
    if (!media) return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => { setMedia(null); return true; });
    return () => listener.remove();
  }, [media]);
  const external = (url: string) => void openExternal(url).catch(() => setMessage('This link could not be opened. Make sure you have an app available for it.'));
  const openPage = (next: StationPage) => {
    const playerPage = next.embed ? next : mediaPageFromUrl(next.url, next.title);
    if (playerPage) {
      radio.pause();
      setPage(null);
      setMedia(playerPage);
    } else {
      if ([LINKS.live, LINKS.listen].includes(next.url)) radio.pause();
      setMedia(null);
      setPage(next);
    }
  };
  const changeTab = (next: Tab) => {
    setMedia(null);
    setTab(next);
    if (next === 'archives') setVisitedArchives(true);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const toggleLive = () => {
    if (media) changeTab('listen');
    void radio.toggle();
  };

  if (!fontsLoaded && !fontError) return <LoadingScreen label="A little different. A lot of WAYO." />;

  return <View style={s.outer}>
    <StatusBar style="dark" />
    <SafeAreaView style={s.app} edges={['top', 'bottom']}>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="WAYO home" onPress={() => changeTab('listen')}><Wordmark /><Text style={s.headerTag}>COMMUNITY POWERED RADIO</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Donate" onPress={() => external(LINKS.donate)} style={s.donate}><Icon name="heart" size={14} /><Text style={s.donateLabel}>Support</Text></Pressable>
      </View>
      {media && <PageViewer key={media.url} page={media} inline backLabel={tabs.find(item => item.id === tab)!.title} onClose={() => setMedia(null)} onHome={() => changeTab('listen')} onMediaPage={openPage} onError={setMessage} />}
      <ScrollView ref={scroll} style={[s.scroll, media && { display: 'none' }]} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {tab === 'listen' && <ListenScreen radio={radio} openPage={openPage} goArchives={() => changeTab('archives')} external={external} />}
        {tab === 'explore' && <ExploreScreen openPage={openPage} />}
        {visitedArchives && <View style={{ display: tab === 'archives' ? 'flex' : 'none' }}><ArchivesScreen openPage={openPage} /></View>}
        {tab === 'community' && <CommunityScreen external={external} openPage={openPage} />}
      </ScrollView>
      {message && <View style={s.message} accessibilityRole="alert"><Text style={s.messageText}>{message}</Text><Pressable accessibilityRole="button" accessibilityLabel="Dismiss message" style={s.dismiss} onPress={() => setMessage(null)}><Icon name="x" size={17} /></Pressable></View>}
      {tab !== 'listen' && radio.error && <Pressable accessibilityRole="button" onPress={() => changeTab('listen')} style={s.errorBar}><Text style={s.errorBarText}>Live radio couldn’t connect. Tap for listening options.</Text></Pressable>}
      <View style={s.miniPlayer}>
        <View style={s.miniArt}><Icon name="radio" size={20} color={c.white} /></View>
        <View style={{ flex: 1, gap: 3 }}><Text style={s.miniTitle}>WAYO 104.3FM</Text><Text style={s.miniLabel} accessibilityLiveRegion="polite">{radio.label}</Text></View>
        <View style={s.liveBadge}><View style={[s.dot, { backgroundColor: radio.playing ? c.green : c.orange }]} /><Text style={s.liveBadgeText}>LIVE</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={radio.busy ? 'Cancel live playback' : radio.playing ? 'Pause broadcast' : 'Listen to broadcast'} style={s.miniPlay} onPress={toggleLive}><Icon name={radio.busy ? 'x' : radio.playing ? 'pause' : 'play'} size={20} /></Pressable>
      </View>
      <View accessibilityRole="tablist" style={s.tabs}>{tabs.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={item.title} accessibilityState={{ selected: tab === item.id }} aria-selected={tab === item.id} onPress={() => changeTab(item.id)} style={s.tab}>
        <View style={[s.tabIcon, tab === item.id && { backgroundColor: c.paleBlue }]}><Icon name={item.icon} color={tab === item.id ? c.blue : c.muted} size={20} /></View><Text style={[s.tabLabel, tab === item.id && { color: c.blue }]}>{item.title}</Text>
      </Pressable>)}</View>
    </SafeAreaView>
    <PageViewer page={page} onClose={() => setPage(null)} onMediaPage={openPage} onError={setMessage} />
  </View>;
}

export default function App() {
  return <SafeAreaProvider><StationApp /></SafeAreaProvider>;
}

const s = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#EAEDEB', alignItems: 'center' },
  app: { flex: 1, width: '100%', maxWidth: 600, backgroundColor: c.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 17, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: c.line },
  headerTag: { color: c.muted, fontSize: 7, fontWeight: '800', letterSpacing: 1.75, marginTop: 4 },
  donate: { minHeight: 42, flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 13, borderRadius: 24, backgroundColor: c.orange },
  donateLabel: { color: c.ink, fontSize: 11, fontWeight: '800' },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 23, paddingBottom: 34 },
  miniPlayer: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.white },
  miniArt: { width: 38, height: 38, backgroundColor: c.ink, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  miniTitle: { color: c.ink, fontSize: 12, fontWeight: '800' },
  miniLabel: { fontSize: 10, color: c.muted },
  miniPlay: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 24, backgroundColor: c.paper },
  liveBadge: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3 },
  liveBadgeText: { fontSize: 8, letterSpacing: 1, fontWeight: '800', color: c.muted },
  tabs: { flexDirection: 'row', backgroundColor: c.white, borderTopWidth: 1, borderTopColor: '#F1F0EB', paddingTop: 6, paddingBottom: 9 },
  tab: { flex: 1, gap: 4, alignItems: 'center', paddingVertical: 2, minHeight: 55 },
  tabIcon: { width: 46, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 9, fontWeight: '700', color: c.muted },
  message: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.paleOrange, paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  messageText: { flex: 1, color: c.ink, fontSize: 12, lineHeight: 18 },
  dismiss: { padding: 10 },
  errorBar: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: c.paleOrange },
  errorBarText: { color: c.ink, fontSize: 11, lineHeight: 17 },
});
