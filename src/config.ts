export const STATION = {
  name: 'WAYO 104.3FM',
  frequency: '104.3 FM',
  location: 'Rochester, New York',
  phoneDisplay: '(585) 203-WAYO',
  phone: '+15852039296',
  email: 'info@wayofm.org',
  address: '1237 E Main St\nRochester, NY 14609',
  mixcloudUser: 'wayoradio',
  // Published by WAYO's official flat.audio.js player configuration.
  liveStream: 'https://streaming.wayofm.org/wayo-192',
};

export const LINKS = {
  listen: 'https://wayofm.org/shows/live-wayo#',
  watch: 'https://www.mixcloud.com/live/wayoradio/',
  live: 'https://wayofm.org/shows/live-wayo',
  shows: 'https://wayofm.org/shows/all',
  schedule: 'https://wayofm.org/schedule/day',
  about: 'https://wayofm.org/about',
  news: 'https://wayofm.org/news',
  supporters: 'https://wayofm.org/supporters',
  volunteer: 'https://wayofm.org/volunteer',
  dj: 'https://docs.google.com/forms/d/e/1FAIpQLSdmHKALZsuWzFYtc_mLzh97DCdFkDMOrm2UxQOZLShJslnfzA/viewform',
  donate: 'https://donate.wayofm.org',
  episodes: 'https://wayofm.org/episodes',
  subscribe: 'https://wayofm.org/signup',
  contact: 'https://wayofm.org/contact',
  youtube: 'https://www.youtube.com/@wayoradio',
  facebook: 'https://www.facebook.com/wayoradio',
  instagram: 'https://www.instagram.com/wayoradio/',
  email: `mailto:${STATION.email}`,
  musicEmail: 'mailto:music@wayofm.org',
  mediaEmail: 'mailto:communications@wayofm.org',
  call: `tel:${STATION.phone}`,
  text: `sms:${STATION.phone}`,
  map: 'https://www.google.com/maps/search/?api=1&query=WAYO+104.3FM+1237+E+Main+St+Rochester+NY+14609',
};

export type EmbeddedVideo = { title: string; url: string; browserUrl: string };
export type StationPage = {
  title: string;
  url: string;
  embed?: boolean;
  browserUrl?: string;
  videos?: readonly EmbeddedVideo[];
};

// Featured by https://wayofm.org/shows/live-wayo; verified October 11, 2026.
// Add performances here as the station publishes them. No YouTube API key is needed.
export const YOUTUBE_VIDEOS: readonly EmbeddedVideo[] = [
  { title: 'The Thriffs · Live at WAYO', id: 'JWuorF9K-b8' },
  { title: 'Rayanna and the Feral Dogs · Live at WAYO', id: '6T_sRQx2x94' },
  { title: 'East Esker · Live at WAYO', id: 'sbnGTNNe0FQ' },
].map(video => ({
  title: video.title,
  url: `https://www.youtube.com/embed/${video.id}?playsinline=1&rel=0`,
  browserUrl: `https://www.youtube.com/watch?v=${video.id}`,
}));

export const YOUTUBE_PAGE: StationPage = {
  title: 'WAYO on YouTube', url: YOUTUBE_VIDEOS[0]!.url,
  embed: true, browserUrl: LINKS.youtube, videos: YOUTUBE_VIDEOS,
};
