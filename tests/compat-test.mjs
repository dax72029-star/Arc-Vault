const TRACKER_KEY = 'watchvault_tracker';
const HISTORY_KEY = 'watchvault_history';
const MAX_TRACKER_ITEMS = 10000;

function createLocalStorageMock() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

const localStorageMock = createLocalStorageMock();

const MOVIE_STATUSES = ['pending', 'completed'];
const SERIES_STATUSES = ['pending', 'watching', 'completed'];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidTrackerItem(item) {
  if (!isPlainObject(item)) return false;
  if (item.type !== 'movie' && item.type !== 'tv') return false;
  if (typeof item.tmdbId !== 'number' || !Number.isFinite(item.tmdbId) || !(item.tmdbId > 0)) return false;
  if (typeof item.title !== 'string') return false;
  if (typeof item.id !== 'string') return false;
  if (!Array.isArray(item.genres)) return false;
  if (!(item.poster === null || typeof item.poster === 'string')) return false;
  if (!(item.backdrop === null || typeof item.backdrop === 'string')) return false;
  if (typeof item.personalRating !== 'number' || !Number.isFinite(item.personalRating)) return false;
  if (typeof item.tmdbRating !== 'number' || !Number.isFinite(item.tmdbRating)) return false;
  if (typeof item.favorite !== 'boolean') return false;
  if (typeof item.dateAdded !== 'string') return false;
  const allowedStatuses = item.type === 'movie' ? MOVIE_STATUSES : SERIES_STATUSES;
  if (!allowedStatuses.includes(item.status)) return false;
  if (item.type === 'tv' && !Array.isArray(item.seasonProgress)) return false;
  return true;
}

function isValidHistoryEntry(entry) {
  if (!isPlainObject(entry)) return false;
  if (typeof entry.id !== 'string') return false;
  if (typeof entry.date !== 'string') return false;
  if (typeof entry.title !== 'string') return false;
  if (typeof entry.action !== 'string') return false;
  if (entry.type !== 'movie' && entry.type !== 'tv') return false;
  if (typeof entry.tmdbId !== 'number' || !Number.isFinite(entry.tmdbId) || !(entry.tmdbId > 0)) return false;
  return true;
}

function readStoredJson(key) {
  const raw = localStorageMock.getItem(key);
  if (raw === null) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function exportData() {
  const envelope = {
    version: 1,
    exportDate: new Date().toISOString(),
    tracker: readStoredJson(TRACKER_KEY),
    history: readStoredJson(HISTORY_KEY),
  };
  return JSON.stringify(envelope, null, 2);
}

function importData(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return { success: false, trackerImported: 0, historyImported: 0, duplicatesSkipped: 0, invalidItems: 0, error: `Invalid JSON: ${err.message}` };
  }
  if (!isPlainObject(parsed)) {
    return { success: false, trackerImported: 0, historyImported: 0, duplicatesSkipped: 0, invalidItems: 0, error: 'Invalid payload: expected an object' };
  }
  if (!Array.isArray(parsed.tracker)) {
    return { success: false, trackerImported: 0, historyImported: 0, duplicatesSkipped: 0, invalidItems: 0, error: 'Invalid payload: missing tracker array' };
  }
  if (parsed.tracker.length >= MAX_TRACKER_ITEMS) {
    return { success: false, trackerImported: 0, historyImported: 0, duplicatesSkipped: 0, invalidItems: 0, error: `Too many tracker items (${parsed.tracker.length}, limit is ${MAX_TRACKER_ITEMS})` };
  }

  const existingTracker = readStoredJson(TRACKER_KEY);
  const existingHistory = readStoredJson(HISTORY_KEY);

  const existingMap = new Map();
  for (const item of existingTracker) {
    if (isValidTrackerItem(item)) {
      existingMap.set(`${item.tmdbId}_${item.type}`, item);
    }
  }

  let duplicatesSkipped = 0;
  let invalidItems = 0;

  for (const candidate of parsed.tracker) {
    if (!isValidTrackerItem(candidate)) {
      invalidItems += 1;
      continue;
    }
    const identityKey = `${candidate.tmdbId}_${candidate.type}`;
    if (existingMap.has(identityKey)) {
      duplicatesSkipped += 1;
    } else {
      existingMap.set(identityKey, candidate);
    }
  }

  const mergedTracker = Array.from(existingMap.values());
  localStorageMock.setItem(TRACKER_KEY, JSON.stringify(mergedTracker));

  const validHistory = Array.isArray(parsed.history) ? parsed.history.filter(isValidHistoryEntry) : [];
  const existingHistoryMap = new Map();
  for (const entry of existingHistory) {
    if (isValidHistoryEntry(entry)) {
      existingHistoryMap.set(entry.id, entry);
    }
  }
  let historyAdded = 0;
  for (const entry of validHistory) {
    if (!existingHistoryMap.has(entry.id)) {
      existingHistoryMap.set(entry.id, entry);
      historyAdded += 1;
    }
  }
  const mergedHistory = Array.from(existingHistoryMap.values());
  localStorageMock.setItem(HISTORY_KEY, JSON.stringify(mergedHistory));

  const storedTracker = readStoredJson(TRACKER_KEY);
  const storedHistory = readStoredJson(HISTORY_KEY);
  if (storedTracker.length !== mergedTracker.length || storedHistory.length !== mergedHistory.length) {
    return { success: false, trackerImported: 0, historyImported: 0, duplicatesSkipped, invalidItems, error: 'Storage verification failed after write' };
  }

  return {
    success: true,
    trackerImported: storedTracker.length,
    historyImported: historyAdded,
    duplicatesSkipped,
    invalidItems,
  };
}

const MOVIE_CATALOG = [
  { tmdbId: 550, title: 'Fight Club', releaseDate: '1999-10-15', genres: ['Drama'], runtime: 139, tmdbRating: 8.4 },
  { tmdbId: 27205, title: 'Inception', releaseDate: '2010-07-16', genres: ['Action', 'Science Fiction', 'Thriller'], runtime: 148, tmdbRating: 8.4 },
  { tmdbId: 680, title: 'Pulp Fiction', releaseDate: '1994-09-10', genres: ['Crime', 'Drama'], runtime: 154, tmdbRating: 8.5 },
  { tmdbId: 155, title: 'The Dark Knight', releaseDate: '2008-07-18', genres: ['Action', 'Crime', 'Drama'], runtime: 152, tmdbRating: 8.5 },
  { tmdbId: 13, title: 'Forrest Gump', releaseDate: '1994-07-06', genres: ['Comedy', 'Drama', 'Romance'], runtime: 142, tmdbRating: 8.5 },
  { tmdbId: 157336, title: 'Interstellar', releaseDate: '2014-11-07', genres: ['Adventure', 'Drama', 'Science Fiction'], runtime: 169, tmdbRating: 8.4 },
  { tmdbId: 496243, title: 'Parasite', releaseDate: '2019-10-04', genres: ['Thriller', 'Drama', 'Comedy'], runtime: 132, tmdbRating: 8.5 },
  { tmdbId: 603, title: 'The Matrix', releaseDate: '1999-03-31', genres: ['Action', 'Science Fiction'], runtime: 136, tmdbRating: 8.2 },
  { tmdbId: 769, title: 'Goodfellas', releaseDate: '1990-09-12', genres: ['Biography', 'Crime', 'Drama'], runtime: 145, tmdbRating: 8.5 },
  { tmdbId: 278, title: 'The Shawshank Redemption', releaseDate: '1994-09-23', genres: ['Drama'], runtime: 142, tmdbRating: 8.7 },
];

const SERIES_CATALOG = [
  { tmdbId: 169, title: 'Breaking Bad', releaseDate: '2008-01-20', genres: ['Drama', 'Crime'], episodeRuntime: 47, tmdbRating: 8.9 },
  { tmdbId: 1399, title: 'Game of Thrones', releaseDate: '2011-04-17', genres: ['Sci-Fi & Fantasy', 'Drama', 'Action & Adventure'], episodeRuntime: 57, tmdbRating: 8.4 },
  { tmdbId: 2316, title: 'The Office', releaseDate: '2005-03-24', genres: ['Comedy'], episodeRuntime: 22, tmdbRating: 8.5 },
  { tmdbId: 66732, title: 'Stranger Things', releaseDate: '2016-07-15', genres: ['Drama', 'Sci-Fi & Fantasy', 'Mystery'], episodeRuntime: 51, tmdbRating: 8.6 },
  { tmdbId: 82856, title: 'The Mandalorian', releaseDate: '2019-11-12', genres: ['Sci-Fi & Fantasy', 'Action & Adventure'], episodeRuntime: 40, tmdbRating: 8.4 },
  { tmdbId: 1396, title: 'The Sopranos', releaseDate: '1999-01-10', genres: ['Drama'], episodeRuntime: 55, tmdbRating: 8.7 },
  { tmdbId: 60735, title: 'The Flash', releaseDate: '2014-10-07', genres: ['Drama', 'Sci-Fi & Fantasy'], episodeRuntime: 43, tmdbRating: 7.7 },
  { tmdbId: 94997, title: 'Squid Game', releaseDate: '2021-09-17', genres: ['Action & Adventure', 'Mystery', 'Drama'], episodeRuntime: 52, tmdbRating: 7.8 },
  { tmdbId: 63174, title: 'Seinfeld', releaseDate: '1989-07-05', genres: ['Comedy'], episodeRuntime: 22, tmdbRating: 8.3 },
  { tmdbId: 71712, title: 'The Good Place', releaseDate: '2016-09-19', genres: ['Comedy', 'Sci-Fi & Fantasy'], episodeRuntime: 22, tmdbRating: 8.2 },
];

function buildMovie(entry, index) {
  const completed = index < 6;
  const status = completed ? 'completed' : 'pending';
  const item = {
    id: `mv_${entry.tmdbId}_${index + 1}`,
    tmdbId: entry.tmdbId,
    type: 'movie',
    title: entry.title,
    poster: index % 4 === 0 ? null : `/posters/${entry.tmdbId}.jpg`,
    backdrop: index % 5 === 0 ? null : `/backdrops/${entry.tmdbId}.jpg`,
    releaseDate: entry.releaseDate,
    releaseYear: Number(entry.releaseDate.slice(0, 4)),
    genres: [...entry.genres],
    description: `${entry.title}: seeded ArcVault fixture entry.`,
    runtime: entry.runtime,
    tmdbRating: entry.tmdbRating,
    personalRating: (index % 5) + 1,
    status,
    dateAdded: new Date(Date.UTC(2025, 0, 10 + index, 9, 30)).toISOString(),
    favorite: index % 2 === 0,
  };
  if (completed) {
    item.dateWatched = new Date(Date.UTC(2025, 1, 1 + index, 20, 15)).toISOString();
  }
  return item;
}

function buildSeasonProgress(seasonsCount, seed) {
  const seasonProgress = [];
  for (let season = 1; season <= seasonsCount; season += 1) {
    const episodeCount = 8 + ((season + seed) % 3);
    const episodes = [];
    for (let episode = 1; episode <= episodeCount; episode += 1) {
      episodes.push({
        episodeNumber: episode,
        watched: (episode * 7 + season * 3 + seed) % 4 !== 0,
        runtime: 35 + ((episode + season * 2) % 20),
      });
    }
    seasonProgress.push({ seasonNumber: season, episodeCount, episodes });
  }
  return seasonProgress;
}

function buildSeries(entry, index) {
  const status = index < 3 ? 'completed' : index < 7 ? 'watching' : 'pending';
  const seasonsCount = 2 + (index % 2);
  const seasonProgress = buildSeasonProgress(seasonsCount, index);
  const item = {
    id: `tv_${entry.tmdbId}_${index + 1}`,
    tmdbId: entry.tmdbId,
    type: 'tv',
    title: entry.title,
    poster: index % 3 === 0 ? null : `/posters/${entry.tmdbId}.jpg`,
    backdrop: index % 7 === 0 ? null : `/backdrops/${entry.tmdbId}.jpg`,
    releaseDate: entry.releaseDate,
    releaseYear: Number(entry.releaseDate.slice(0, 4)),
    genres: [...entry.genres],
    description: `${entry.title}: seeded ArcVault fixture entry.`,
    runtime: entry.episodeRuntime,
    tmdbRating: entry.tmdbRating,
    personalRating: ((index * 2) % 5) + 1,
    status,
    dateAdded: new Date(Date.UTC(2025, 0, 15 + index, 11, 45)).toISOString(),
    favorite: index % 2 === 1,
    numberOfSeasons: seasonsCount,
    numberOfEpisodes: seasonProgress.reduce((total, season) => total + season.episodeCount, 0),
    dateStarted: status === 'pending' ? null : new Date(Date.UTC(2025, 1, 5 + index, 19)).toISOString(),
    dateCompleted: status === 'completed' ? new Date(Date.UTC(2025, 2, 20 + index, 22)).toISOString() : null,
    seasonProgress,
  };
  return item;
}

const HISTORY_ACTIONS = [
  'Added to watchlist',
  'Marked as watched',
  'Rated 4 stars',
  'Marked as pending',
  'Removed from watchlist',
  'Started watching',
];

function buildHistoryEntries(trackerItems) {
  const entries = [];
  for (let i = 0; i < 25; i += 1) {
    const source = trackerItems[i % trackerItems.length];
    entries.push({
      id: `hist_${source.tmdbId}_${source.type}_${i + 1}`,
      date: new Date(Date.UTC(2025, 0, 5 + i, 8 + (i % 12), 30)).toISOString(),
      title: source.title,
      action: HISTORY_ACTIONS[i % HISTORY_ACTIONS.length],
      type: source.type,
      tmdbId: source.tmdbId,
    });
  }
  return entries;
}

function buildBulkMovie(index) {
  const tmdbId = 900000 + index + 1;
  const status = index % 2 === 0 ? 'completed' : 'pending';
  const genreSets = [['Drama'], ['Action', 'Adventure'], ['Comedy'], ['Thriller', 'Crime']];
  const item = {
    id: `mv_bulk_${tmdbId}_${index + 1}`,
    tmdbId,
    type: 'movie',
    title: `Bulk Movie ${index + 1}`,
    poster: index % 6 === 0 ? null : `/bulk/posters/${tmdbId}.jpg`,
    backdrop: index % 8 === 0 ? null : `/bulk/backdrops/${tmdbId}.jpg`,
    releaseDate: `20${String(20 + (index % 5))}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
    releaseYear: 2020 + (index % 5),
    genres: [...genreSets[index % genreSets.length]],
    description: `Bulk stress-test movie number ${index + 1}.`,
    runtime: 88 + (index % 72),
    tmdbRating: (60 + (index % 38)) / 10,
    personalRating: ((index * 3) % 5) + 1,
    status,
    dateAdded: new Date(Date.UTC(2024, index % 12, (index % 27) + 1, 12)).toISOString(),
    favorite: index % 4 === 0,
  };
  if (status === 'completed') {
    item.dateWatched = new Date(Date.UTC(2024, index % 12, (index % 27) + 1, 21)).toISOString();
  }
  return item;
}

function buildBulkSeries(index) {
  const tmdbId = 800000 + index + 1;
  const status = index % 3 === 0 ? 'completed' : index % 3 === 1 ? 'watching' : 'pending';
  const seasonsCount = 2 + (index % 2);
  const seasonProgress = buildSeasonProgress(seasonsCount, index + 101);
  const genreSets = [['Drama'], ['Comedy'], ['Sci-Fi & Fantasy'], ['Crime', 'Mystery']];
  const item = {
    id: `tv_bulk_${tmdbId}_${index + 1}`,
    tmdbId,
    type: 'tv',
    title: `Bulk Series ${index + 1}`,
    poster: index % 5 === 0 ? null : `/bulk/posters/${tmdbId}.jpg`,
    backdrop: index % 9 === 0 ? null : `/bulk/backdrops/${tmdbId}.jpg`,
    releaseDate: `20${String(15 + (index % 9))}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
    releaseYear: 2015 + (index % 9),
    genres: [...genreSets[index % genreSets.length]],
    description: `Bulk stress-test series number ${index + 1}.`,
    runtime: 38 + (index % 17),
    tmdbRating: (62 + (index % 36)) / 10,
    personalRating: ((index * 7) % 5) + 1,
    status,
    dateAdded: new Date(Date.UTC(2024, index % 12, (index % 27) + 1, 14)).toISOString(),
    favorite: index % 5 === 1,
    numberOfSeasons: seasonsCount,
    numberOfEpisodes: seasonProgress.reduce((total, season) => total + season.episodeCount, 0),
    dateStarted: status === 'pending' ? null : new Date(Date.UTC(2024, index % 12, (index % 27) + 1, 20)).toISOString(),
    dateCompleted: status === 'completed' ? new Date(Date.UTC(2025, index % 6, (index % 27) + 1, 22)).toISOString() : null,
    seasonProgress,
  };
  return item;
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((value, index) => deepEqual(value, b[index]));
  }
  if (isPlainObject(a)) {
    if (!isPlainObject(b)) return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]));
  }
  return false;
}

function check(name, fn) {
  try {
    fn();
    passCount += 1;
    console.log(`PASS: ${name}`);
  } catch (err) {
    failCount += 1;
    console.log(`FAIL: ${name}`);
    console.log(`      ${err.message}`);
  }
}

function runRoundtripTest() {
  console.log('--- Test 1: export -> clear -> import -> export roundtrip ---');

  const trackerSeed = [
    ...MOVIE_CATALOG.map((entry, index) => buildMovie(entry, index)),
    ...SERIES_CATALOG.map((entry, index) => buildSeries(entry, index)),
  ];
  const historySeed = buildHistoryEntries(trackerSeed);
  const statusByKey = new Map(trackerSeed.map((item) => [`${item.tmdbId}_${item.type}`, item.status]));

  check('fixture builds 10 movies, 10 series, 25 history entries with variety', () => {
    assertEqual(trackerSeed.filter((item) => item.type === 'movie').length, 10, 'movie count');
    assertEqual(trackerSeed.filter((item) => item.type === 'tv').length, 10, 'series count');
    assertEqual(historySeed.length, 25, 'history count');
    assert(trackerSeed.some((item) => item.favorite), 'fixture should contain favorites');
    assert(trackerSeed.some((item) => !item.favorite), 'fixture should contain non-favorites');
    assert(trackerSeed.some((item) => item.poster === null), 'fixture should contain null posters');
    assert(trackerSeed.some((item) => item.backdrop === null), 'fixture should contain null backdrops');
  });

  check('seed writes tracker and history into localStorage', () => {
    localStorageMock.setItem(TRACKER_KEY, JSON.stringify(trackerSeed));
    localStorageMock.setItem(HISTORY_KEY, JSON.stringify(historySeed));
    assertEqual(readStoredJson(TRACKER_KEY).length, 20, 'stored tracker size');
    assertEqual(readStoredJson(HISTORY_KEY).length, 25, 'stored history size');
  });

  const exportBefore = {};
  check('first export emits a version-1 envelope holding all data', () => {
    exportBefore.json = exportData();
    const parsed = JSON.parse(exportBefore.json);
    assertEqual(parsed.version, 1, 'version');
    assert(typeof parsed.exportDate === 'string' && !Number.isNaN(Date.parse(parsed.exportDate)), 'exportDate must be an ISO timestamp');
    assertEqual(parsed.tracker.length, 20, 'tracker length');
    assertEqual(parsed.history.length, 25, 'history length');
    assert(exportBefore.json.includes('\n'), 'export must be pretty-printed');
  });

  check('clear empties localStorage completely', () => {
    localStorageMock.clear();
    assertEqual(localStorageMock.getItem(TRACKER_KEY), null, 'tracker key after clear');
    assertEqual(localStorageMock.getItem(HISTORY_KEY), null, 'history key after clear');
  });

  const importOutcome = {};
  check('importData accepts the exported envelope', () => {
    importOutcome.result = importData(exportBefore.json);
    assertEqual(importOutcome.result.success, true, 'success');
    assert(importOutcome.result.error === undefined, `unexpected error: ${importOutcome.result.error}`);
    assertEqual(importOutcome.result.trackerImported, 20, 'trackerImported');
    assertEqual(importOutcome.result.historyImported, 25, 'historyImported');
    assertEqual(importOutcome.result.duplicatesSkipped, 0, 'duplicatesSkipped');
    assertEqual(importOutcome.result.invalidItems, 0, 'invalidItems');
  });

  check('import repopulates localStorage', () => {
    assertEqual(readStoredJson(TRACKER_KEY).length, 20, 'stored tracker size');
    assertEqual(readStoredJson(HISTORY_KEY).length, 25, 'stored history size');
  });

  const exportAfter = {};
  check('second export emits a fresh version-1 envelope', () => {
    exportAfter.json = exportData();
    const parsed = JSON.parse(exportAfter.json);
    assertEqual(parsed.version, 1, 'version');
    assert(typeof parsed.exportDate === 'string' && !Number.isNaN(Date.parse(parsed.exportDate)), 'exportDate must be an ISO timestamp');
    assertEqual(parsed.tracker.length, 20, 'tracker length');
    assertEqual(parsed.history.length, 25, 'history length');
  });

  check('both exports are structurally identical apart from exportDate', () => {
    const before = JSON.parse(exportBefore.json);
    const after = JSON.parse(exportAfter.json);
    delete before.exportDate;
    delete after.exportDate;
    assert(deepEqual(before, after), 'the roundtrip altered the payload');
  });

  check('all 10 tracker movies survived the roundtrip', () => {
    const movies = readStoredJson(TRACKER_KEY).filter((item) => item.type === 'movie');
    assertEqual(movies.length, 10, 'movie count');
    const seenIds = new Set(movies.map((movie) => movie.tmdbId));
    for (const entry of MOVIE_CATALOG) {
      assert(seenIds.has(entry.tmdbId), `missing movie tmdbId ${entry.tmdbId} (${entry.title})`);
    }
  });

  check('all 10 tracker series survived the roundtrip', () => {
    const series = readStoredJson(TRACKER_KEY).filter((item) => item.type === 'tv');
    assertEqual(series.length, 10, 'series count');
    const seenIds = new Set(series.map((show) => show.tmdbId));
    for (const entry of SERIES_CATALOG) {
      assert(seenIds.has(entry.tmdbId), `missing series tmdbId ${entry.tmdbId} (${entry.title})`);
    }
  });

  check('every surviving series owns a well-formed seasonProgress array', () => {
    const series = readStoredJson(TRACKER_KEY).filter((item) => item.type === 'tv');
    for (const show of series) {
      assert(Array.isArray(show.seasonProgress), `${show.title}: seasonProgress is not an array`);
      assert(show.seasonProgress.length >= 2 && show.seasonProgress.length <= 3, `${show.title}: expected 2-3 tracked seasons, found ${show.seasonProgress.length}`);
      for (const season of show.seasonProgress) {
        assert(Number.isInteger(season.seasonNumber) && season.seasonNumber >= 1, `${show.title}: invalid seasonNumber`);
        assert(Array.isArray(season.episodes), `${show.title} S${season.seasonNumber}: episodes is not an array`);
        assertEqual(season.episodes.length, season.episodeCount, `${show.title} S${season.seasonNumber}: episodes vs episodeCount`);
        assert(season.episodeCount >= 8 && season.episodeCount <= 10, `${show.title} S${season.seasonNumber}: expected 8-10 episodes, found ${season.episodeCount}`);
        const watchedTally = season.episodes.filter((episode) => episode.watched === true).length;
        assert(watchedTally >= 1 && watchedTally <= season.episodes.length - 1, `${show.title} S${season.seasonNumber}: watch mix broken (${watchedTally}/${season.episodes.length} watched)`);
        assert(season.episodes.every((episode) => typeof episode.runtime === 'number'), `${show.title} S${season.seasonNumber}: episode runtime missing`);
      }
    }
  });

  check('statuses are preserved with the expected mix', () => {
    for (const item of readStoredJson(TRACKER_KEY)) {
      assertEqual(item.status, statusByKey.get(`${item.tmdbId}_${item.type}`), `${item.title} status`);
    }
    const movies = readStoredJson(TRACKER_KEY).filter((item) => item.type === 'movie');
    const series = readStoredJson(TRACKER_KEY).filter((item) => item.type === 'tv');
    assertEqual(movies.filter((movie) => movie.status === 'completed').length, 6, 'completed movies');
    assertEqual(movies.filter((movie) => movie.status === 'pending').length, 4, 'pending movies');
    assertEqual(series.filter((show) => show.status === 'completed').length, 3, 'completed series');
    assertEqual(series.filter((show) => show.status === 'watching').length, 4, 'watching series');
    assertEqual(series.filter((show) => show.status === 'pending').length, 3, 'pending series');
    for (const movie of movies.filter((entry) => entry.status === 'completed')) {
      assert(typeof movie.dateWatched === 'string', `${movie.title}: completed movie lost dateWatched`);
    }
    for (const movie of movies.filter((entry) => entry.status === 'pending')) {
      assert(movie.dateWatched === undefined, `${movie.title}: pending movie gained a dateWatched`);
    }
  });

  check('all 25 history entries survived intact', () => {
    const storedHistory = readStoredJson(HISTORY_KEY);
    assertEqual(storedHistory.length, 25, 'history count');
    const seededById = new Map(historySeed.map((entry) => [entry.id, entry]));
    const actionsSeen = new Set();
    for (const entry of storedHistory) {
      const original = seededById.get(entry.id);
      assert(original, `unexpected history id ${entry.id}`);
      assert(deepEqual(entry, original), `history entry drifted: ${entry.id}`);
      actionsSeen.add(entry.action);
    }
    for (const action of HISTORY_ACTIONS) {
      assert(actionsSeen.has(action), `action missing from restored history: ${action}`);
    }
  });
}

function runBulkImportTest() {
  console.log('--- Test 2: bulk import of 185 items (100 movies + 85 series) ---');

  const bulkTracker = [
    ...Array.from({ length: 100 }, (_, index) => buildBulkMovie(index)),
    ...Array.from({ length: 85 }, (_, index) => buildBulkSeries(index)),
  ];

  check('bulk fixture builds 185 unique items', () => {
    assertEqual(bulkTracker.length, 185, 'fixture size');
    assertEqual(bulkTracker.filter((item) => item.type === 'movie').length, 100, 'bulk movie count');
    assertEqual(bulkTracker.filter((item) => item.type === 'tv').length, 85, 'bulk series count');
    const identityKeys = new Set(bulkTracker.map((item) => `${item.tmdbId}_${item.type}`));
    assertEqual(identityKeys.size, 185, 'unique tmdbId_type keys');
  });

  const bulkEnvelope = {};
  check('bulk envelope assembles with all 185 items', () => {
    bulkEnvelope.json = JSON.stringify(
      { version: 1, exportDate: new Date().toISOString(), tracker: bulkTracker, history: [] },
      null,
      2,
    );
    assertEqual(JSON.parse(bulkEnvelope.json).tracker.length, 185, 'envelope tracker length');
  });

  const bulkOutcome = {};
  check('bulk import succeeds end to end', () => {
    localStorageMock.clear();
    bulkOutcome.result = importData(bulkEnvelope.json);
    assertEqual(bulkOutcome.result.success, true, 'success');
    assert(bulkOutcome.result.error === undefined, `unexpected error: ${bulkOutcome.result.error}`);
    assertEqual(bulkOutcome.result.trackerImported, 185, 'trackerImported');
    assertEqual(bulkOutcome.result.duplicatesSkipped, 0, 'duplicatesSkipped');
    assertEqual(bulkOutcome.result.invalidItems, 0, 'invalidItems');
  });

  check('storage holds all 185 bulk items afterwards', () => {
    const stored = readStoredJson(TRACKER_KEY);
    assertEqual(stored.length, 185, 'stored tracker size');
    assertEqual(stored.filter((item) => item.type === 'movie').length, 100, 'stored movies');
    assertEqual(stored.filter((item) => item.type === 'tv').length, 85, 'stored series');
    assert(stored.every((item) => item.type === 'movie' || Array.isArray(item.seasonProgress)), 'every stored series kept its seasonProgress');
  });

  check('second bulk export matches the imported fixture', () => {
    const reExported = JSON.parse(exportData());
    delete reExported.exportDate;
    assert(deepEqual(reExported, { version: 1, tracker: bulkTracker, history: [] }), 'bulk export drifted from the fixture');
  });
}

function main() {
  console.log('=== ArcVault compatibility test ===');
  console.log('');
  runRoundtripTest();
  console.log('');
  runBulkImportTest();
  console.log('');
  console.log(`Summary: ${passCount} passed, ${failCount} failed`);
  process.exit(failCount === 0 ? 0 : 1);
}

try {
  main();
} catch (err) {
  console.log(`FAIL: unhandled error: ${err.message}`);
  failCount += 1;
  console.log(`Summary: ${passCount} passed, ${failCount} failed`);
  process.exit(1);
}
