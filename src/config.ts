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

export type StationPage = { title: string; url: string; embed?: boolean };
