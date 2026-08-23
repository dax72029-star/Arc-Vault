const TRACKER_KEY = 'watchvault_tracker';
const HISTORY_KEY = 'watchvault_history';

function createLocalStorageMock() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); },
  };
}

const ls = createLocalStorageMock();

function readJson(key) {
  const raw = ls.getItem(key);
  if (raw === null) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
}

function getTracker() { return readJson(TRACKER_KEY); }
function saveTracker(items) { ls.setItem(TRACKER_KEY, JSON.stringify(items)); }
function getHistory() { return readJson(HISTORY_KEY); }
function saveHistory(h) { ls.setItem(HISTORY_KEY, JSON.stringify(h)); }

function isValidTrackerItem(item) {
  if (typeof item !== 'object' || item === null) return false;
  if (item.type !== 'movie' && item.type !== 'tv') return false;
  if (typeof item.tmdbId !== 'number' || !Number.isFinite(item.tmdbId) || item.tmdbId <= 0) return false;
  if (typeof item.title !== 'string') return false;
  if (typeof item.id !== 'string') return false;
  if (!Array.isArray(item.genres)) return false;
  if (typeof item.personalRating !== 'number' || !Number.isFinite(item.personalRating)) return false;
  if (typeof item.tmdbRating !== 'number' || !Number.isFinite(item.tmdbRating)) return false;
  if (typeof item.favorite !== 'boolean') return false;
  if (typeof item.dateAdded !== 'string') return false;
  const allowedMovieStatuses = ['pending', 'completed'];
  const allowedSeriesStatuses = ['pending', 'watching', 'completed'];
  const allowedStatuses = item.type === 'movie' ? allowedMovieStatuses : allowedSeriesStatuses;
  if (!allowedStatuses.includes(item.status)) return false;
  if (item.type === 'tv' && !Array.isArray(item.seasonProgress)) return false;
  return true;
}

function isValidHistoryEntry(entry) {
  if (typeof entry !== 'object' || entry === null) return false;
  if (typeof entry.id !== 'string') return false;
  if (typeof entry.date !== 'string') return false;
  if (typeof entry.title !== 'string') return false;
  if (typeof entry.action !== 'string') return false;
  if (entry.type !== 'movie' && entry.type !== 'tv') return false;
  if (typeof entry.tmdbId !== 'number' || !Number.isFinite(entry.tmdbId) || entry.tmdbId <= 0) return false;
  return true;
}

function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data.tracker || !Array.isArray(data.tracker)) {
      return { success: false, trackerImported: 0, historyImported: 0, duplicatesSkipped: 0, invalidItems: 0, error: 'Invalid' };
    }
    const existingTracker = getTracker();
    const existingHistory = getHistory();
    const validItems = data.tracker.filter(isValidTrackerItem);
    const invalidItems = data.tracker.length - validItems.length;
    const existingMap = new Map();
    for (const item of existingTracker) { existingMap.set(item.tmdbId + '_' + item.type, item); }
    let duplicatesSkipped = 0;
    for (const item of validItems) {
      const key = item.tmdbId + '_' + item.type;
      if (existingMap.has(key)) { duplicatesSkipped++; } else { existingMap.set(key, item); }
    }
    const mergedTracker = Array.from(existingMap.values());
    ls.setItem(TRACKER_KEY, JSON.stringify(mergedTracker));
    let historyImported = 0;
    if (data.history && Array.isArray(data.history)) {
      const validHistory = data.history.filter(isValidHistoryEntry);
      const existingHistoryMap = new Map();
      for (const entry of existingHistory) { existingHistoryMap.set(entry.id, entry); }
      for (const entry of validHistory) { if (!existingHistoryMap.has(entry.id)) { existingHistoryMap.set(entry.id, entry); historyImported++; } }
      ls.setItem(HISTORY_KEY, JSON.stringify(Array.from(existingHistoryMap.values())));
    }
    return { success: true, trackerImported: getTracker().length, historyImported, duplicatesSkipped, invalidItems };
  } catch (err) {
    return { success: false, trackerImported: 0, historyImported: 0, duplicatesSkipped: 0, invalidItems: 0, error: err.message };
  }
}

function exportData() {
  return JSON.stringify({ version: 1, exportDate: new Date().toISOString(), tracker: getTracker(), history: getHistory() }, null, 2);
}

function addTitle(item) {
  const tracker = getTracker();
  const exists = tracker.some((t) => t.tmdbId === item.tmdbId && t.type === item.type);
  if (exists) return false;
  tracker.push(item);
  saveTracker(tracker);
  return true;
}

function makeMovie(title, tmdbId, runtime, dateWatched, status) {
  return {
    id: 'mv_' + tmdbId + '_' + Math.floor(Math.random() * 99999),
    tmdbId: tmdbId, type: 'movie', title: title,
    poster: null, backdrop: null, releaseDate: '2024-01-01', releaseYear: 2024,
    genres: ['Drama'], description: title, runtime: runtime, tmdbRating: 8.0,
    personalRating: 0, status: status || 'completed',
    dateAdded: '2026-08-01T10:00:00.000Z', dateWatched: dateWatched || null, favorite: false,
  };
}

function makeSeries(title, tmdbId, episodes, seasons, dateCompleted) {
  var sp = [];
  for (var s = 1; s <= seasons; s++) {
    var n = Math.ceil(episodes / seasons);
    var eps = [];
    for (var e = 1; e <= n; e++) { eps.push({ episodeNumber: e, watched: false, runtime: null }); }
    sp.push({ seasonNumber: s, episodeCount: n, episodes: eps });
  }
  return {
    id: 'sv_' + tmdbId + '_' + Math.floor(Math.random() * 99999),
    tmdbId: tmdbId, type: 'tv', title: title,
    poster: null, backdrop: null, releaseDate: '2020-01-01', releaseYear: 2020,
    genres: ['Drama'], description: title, numberOfSeasons: seasons, numberOfEpisodes: episodes,
    tmdbRating: 8.5, personalRating: 0, status: 'completed',
    dateAdded: '2026-08-01T10:00:00.000Z', dateStarted: '2026-07-01T10:00:00.000Z',
    dateCompleted: dateCompleted || null, favorite: false, seasonProgress: sp,
  };
}

function makeHistory(id, tmdbId, type, title, action, date) {
  return { id: id, date: date, title: title, action: action, type: type, tmdbId: tmdbId };
}

function buildEnvelope(tracker, history) {
  return JSON.stringify({ version: 1, exportDate: new Date().toISOString(), tracker: tracker || [], history: history || [] }, null, 2);
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(label + ': expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
}

function check(name, fn) {
  try {
    fn();
    passCount++;
    console.log('PASS: ' + name);
  } catch (err) {
    failCount++;
    console.log('FAIL: ' + name);
    console.log('      ' + err.message);
  }
}

function reset() { ls.clear(); }

function test1_emptyExistingPlusImport() {
  console.log('');
  console.log('--- Test 1: Empty existing tracker + import ---');
  reset();
  var json = buildEnvelope([
    makeMovie('Movie A', 1001, 120, '2026-01-15T20:00:00.000Z'),
    makeMovie('Movie B', 1002, 130, '2026-02-15T20:00:00.000Z'),
  ]);
  var result = importData(json);
  check('import succeeds', function() { assertEqual(result.success, true, 'success'); });
  check('2 items imported', function() { assertEqual(getTracker().length, 2, 'count'); });
  check('no duplicates skipped', function() { assertEqual(result.duplicatesSkipped, 0, 'dupes'); });
}

function test2_existingPlusNewImport() {
  console.log('');
  console.log('--- Test 2: Existing tracker + new import ---');
  reset();
  addTitle(makeMovie('Movie A', 1001, 120, '2026-01-15T20:00:00.000Z'));
  addTitle(makeMovie('Movie B', 1002, 130, '2026-02-15T20:00:00.000Z'));
  assertEqual(getTracker().length, 2, 'precondition');
  var json = buildEnvelope([
    makeMovie('Movie C', 1003, 140, '2026-03-15T20:00:00.000Z'),
    makeMovie('Movie D', 1004, 150, '2026-04-15T20:00:00.000Z'),
  ]);
  var result = importData(json);
  check('import succeeds', function() { assertEqual(result.success, true, 'success'); });
  check('4 items total (2 existing + 2 new)', function() { assertEqual(getTracker().length, 4, 'count'); });
  check('Movie A still exists', function() { assert(getTracker().some(function(t) { return t.tmdbId === 1001; }), 'Movie A'); });
  check('Movie C added', function() { assert(getTracker().some(function(t) { return t.tmdbId === 1003; }), 'Movie C'); });
}

function test3_twoConsecutiveDifferentImports() {
  console.log('');
  console.log('--- Test 3: Two consecutive different imports ---');
  reset();
  addTitle(makeMovie('Movie A', 1001, 120, '2026-01-15T20:00:00.000Z'));
  var json1 = buildEnvelope([
    makeMovie('Movie B', 1002, 130, '2026-02-15T20:00:00.000Z'),
    makeMovie('Movie C', 1003, 140, '2026-03-15T20:00:00.000Z'),
  ]);
  importData(json1);
  assertEqual(getTracker().length, 3, 'after import 1');
  var json2 = buildEnvelope([
    makeMovie('Movie D', 1004, 150, '2026-04-15T20:00:00.000Z'),
    makeMovie('Movie E', 1005, 160, '2026-05-15T20:00:00.000Z'),
  ]);
  importData(json2);
  check('5 items total after import 2', function() { assertEqual(getTracker().length, 5, 'count'); });
  check('all movies present', function() {
    var ids = getTracker().map(function(t) { return t.tmdbId; });
    assert(ids.indexOf(1001) !== -1, '1001');
    assert(ids.indexOf(1002) !== -1, '1002');
    assert(ids.indexOf(1003) !== -1, '1003');
    assert(ids.indexOf(1004) !== -1, '1004');
    assert(ids.indexOf(1005) !== -1, '1005');
  });
}

function test4_sameImportTwice() {
  console.log('');
  console.log('--- Test 4: Same import twice ---');
  reset();
  var json = buildEnvelope([
    makeMovie('Movie A', 1001, 120, '2026-01-15T20:00:00.000Z'),
    makeMovie('Movie B', 1002, 130, '2026-02-15T20:00:00.000Z'),
  ]);
  importData(json);
  assertEqual(getTracker().length, 2, 'after first import');
  var result2 = importData(json);
  check('still 2 items after second import', function() { assertEqual(getTracker().length, 2, 'count'); });
  check('2 duplicates skipped on second import', function() { assertEqual(result2.duplicatesSkipped, 2, 'dupes'); });
}

function test5_existingPlusImportedDuplicate() {
  console.log('');
  console.log('--- Test 5: Existing + imported duplicate ---');
  reset();
  var existing = makeMovie('Movie A', 1001, 120, '2026-01-15T20:00:00.000Z');
  existing.personalRating = 5;
  existing.favorite = true;
  existing.status = 'completed';
  addTitle(existing);
  var json = buildEnvelope([
    makeMovie('Movie A', 1001, 99, null, 'pending'),
  ]);
  var result = importData(json);
  check('still 1 item', function() { assertEqual(getTracker().length, 1, 'count'); });
  check('duplicate skipped', function() { assertEqual(result.duplicatesSkipped, 1, 'dupes'); });
  check('existing personalRating preserved', function() { assertEqual(getTracker()[0].personalRating, 5, 'rating'); });
  check('existing favorite preserved', function() { assertEqual(getTracker()[0].favorite, true, 'favorite'); });
  check('existing status preserved', function() { assertEqual(getTracker()[0].status, 'completed', 'status'); });
  check('existing runtime preserved (120 not 99)', function() { assertEqual(getTracker()[0].runtime, 120, 'runtime'); });
}

function test6_normalPlusImportedRecords() {
  console.log('');
  console.log('--- Test 6: Normal + imported records coexist ---');
  reset();
  addTitle(makeMovie('Normal Movie 1', 2001, 100, '2026-06-01T20:00:00.000Z'));
  var json1 = buildEnvelope([makeMovie('Import Movie 1', 3001, 110, '2026-06-02T20:00:00.000Z')]);
  importData(json1);
  addTitle(makeMovie('Normal Movie 2', 2002, 105, '2026-06-03T20:00:00.000Z'));
  var json2 = buildEnvelope([makeMovie('Import Movie 2', 3002, 115, '2026-06-04T20:00:00.000Z')]);
  importData(json2);
  check('4 items total', function() { assertEqual(getTracker().length, 4, 'count'); });
  check('normal movies present', function() {
    assert(getTracker().some(function(t) { return t.tmdbId === 2001; }), 'Normal 1');
    assert(getTracker().some(function(t) { return t.tmdbId === 2002; }), 'Normal 2');
  });
  check('imported movies present', function() {
    assert(getTracker().some(function(t) { return t.tmdbId === 3001; }), 'Import 1');
    assert(getTracker().some(function(t) { return t.tmdbId === 3002; }), 'Import 2');
  });
}

function test7_historyMerging() {
  console.log('');
  console.log('--- Test 7: History merging ---');
  reset();
  var h1 = [makeHistory('h1', 1001, 'movie', 'Movie A', 'Added to watchlist', '2026-01-01T10:00:00.000Z')];
  importData(buildEnvelope([], h1));
  assertEqual(getHistory().length, 1, 'after first import history');
  var h2 = [
    makeHistory('h2', 1002, 'movie', 'Movie B', 'Marked as watched', '2026-02-01T10:00:00.000Z'),
    makeHistory('h3', 1003, 'tv', 'Series C', 'Started watching', '2026-03-01T10:00:00.000Z'),
  ];
  importData(buildEnvelope([], h2));
  check('3 history entries after second import', function() { assertEqual(getHistory().length, 3, 'count'); });
  importData(buildEnvelope([], h1));
  check('still 3 after re-importing same history (no duplicate)', function() { assertEqual(getHistory().length, 3, 'count'); });
  check('original h1 preserved', function() { assert(getHistory().some(function(e) { return e.id === 'h1'; }), 'h1'); });
  check('h2 preserved', function() { assert(getHistory().some(function(e) { return e.id === 'h2'; }), 'h2'); });
  check('h3 preserved', function() { assert(getHistory().some(function(e) { return e.id === 'h3'; }), 'h3'); });
}

function test8_statisticsAfterMultipleImports() {
  console.log('');
  console.log('--- Test 8: Statistics after multiple imports ---');
  reset();
  var json1 = buildEnvelope([
    makeMovie('Interstellar', 157336, 169, '2026-08-20T18:30:00.000Z'),
    makeMovie('Oppenheimer', 872585, 180, '2026-07-15T20:00:00.000Z'),
  ]);
  importData(json1);
  var json2 = buildEnvelope([
    makeMovie('Dunkirk', 378249, 107, '2026-06-10T20:00:00.000Z'),
  ]);
  importData(json2);
  var items = getTracker();
  check('3 movies total', function() { assertEqual(items.length, 3, 'count'); });
  var completed = items.filter(function(i) { return i.status === 'completed'; });
  check('3 movies completed', function() { assertEqual(completed.length, 3, 'completed'); });
  var totalTime = completed.reduce(function(s, m) { return s + m.runtime; }, 0);
  check('total watch time = 456 (169+180+107)', function() { assertEqual(totalTime, 456, 'time'); });
  var movieTimes = completed.map(function(m) { return { title: m.title, runtime: m.runtime }; });
  check('Interstellar runtime = 169', function() {
    var m = movieTimes.find(function(x) { return x.title === 'Interstellar'; });
    assert(m, 'found'); assertEqual(m.runtime, 169, 'runtime');
  });
  check('Dunkirk runtime = 107', function() {
    var m = movieTimes.find(function(x) { return x.title === 'Dunkirk'; });
    assert(m, 'found'); assertEqual(m.runtime, 107, 'runtime');
  });
}

function test9_clearAllData() {
  console.log('');
  console.log('--- Test 9: Clear All Data ---');
  reset();
  addTitle(makeMovie('Movie A', 1001, 120, '2026-01-15T20:00:00.000Z'));
  importData(buildEnvelope([], [makeHistory('h1', 1001, 'movie', 'Movie A', 'Added', '2026-01-01T10:00:00.000Z')]));
  assertEqual(getTracker().length, 1, 'precondition tracker');
  assertEqual(getHistory().length, 1, 'precondition history');
  ls.removeItem(TRACKER_KEY);
  ls.removeItem(HISTORY_KEY);
  check('tracker empty after clear', function() { assertEqual(getTracker().length, 0, 'tracker'); });
  check('history empty after clear', function() { assertEqual(getHistory().length, 0, 'history'); });
  var json = buildEnvelope([makeMovie('Movie B', 1002, 130, '2026-02-15T20:00:00.000Z')]);
  importData(json);
  check('new import works after clear', function() { assertEqual(getTracker().length, 1, 'count'); });
  check('imported movie is B not A', function() { assertEqual(getTracker()[0].tmdbId, 1002, 'tmdbId'); });
}

function test10_failedImportPreservesExisting() {
  console.log('');
  console.log('--- Test 10: Failed import preserves existing data ---');
  reset();
  addTitle(makeMovie('Movie A', 1001, 120, '2026-01-15T20:00:00.000Z'));
  addTitle(makeMovie('Movie B', 1002, 130, '2026-02-15T20:00:00.000Z'));
  assertEqual(getTracker().length, 2, 'precondition');
  var badJson = 'not valid json {{{';
  var result = importData(badJson);
  check('import reports failure', function() { assertEqual(result.success, false, 'success'); });
  check('existing data preserved', function() { assertEqual(getTracker().length, 2, 'count'); });
  check('Movie A still there', function() { assert(getTracker().some(function(t) { return t.tmdbId === 1001; }), 'A'); });
  check('Movie B still there', function() { assert(getTracker().some(function(t) { return t.tmdbId === 1002; }), 'B'); });
  var badJson2 = JSON.stringify({ tracker: 'not an array' });
  result = importData(badJson2);
  check('malformed envelope preserves data', function() { assertEqual(getTracker().length, 2, 'count'); });
}

function test11_bulkImportIntoNonEmpty() {
  console.log('');
  console.log('--- Test 11: 185-item import into non-empty tracker ---');
  reset();
  addTitle(makeMovie('Existing Movie', 500, 100, '2026-01-01T20:00:00.000Z'));
  addTitle(makeMovie('Existing Movie 2', 501, 110, '2026-01-02T20:00:00.000Z'));
  assertEqual(getTracker().length, 2, 'precondition');
  var bulkTracker = [];
  for (var i = 0; i < 100; i++) {
    bulkTracker.push(makeMovie('Bulk M' + (i + 1), 900000 + i + 1, 88 + (i % 72), '2025-01-01T20:00:00.000Z'));
  }
  for (var i = 0; i < 85; i++) {
    bulkTracker.push(makeSeries('Bulk S' + (i + 1), 800000 + i + 1, 62, 5, '2025-06-01T22:00:00.000Z'));
  }
  var result = importData(buildEnvelope(bulkTracker));
  check('import succeeds', function() { assertEqual(result.success, true, 'success'); });
  check('187 items (2 existing + 185 new)', function() { assertEqual(getTracker().length, 187, 'count'); });
  check('existing movies still present', function() {
    assert(getTracker().some(function(t) { return t.tmdbId === 500; }), '500');
    assert(getTracker().some(function(t) { return t.tmdbId === 501; }), '501');
  });
}

function test12_exportImportSecondImport() {
  console.log('');
  console.log('--- Test 12: Export -> import -> second import ---');
  reset();
  addTitle(makeMovie('Movie A', 1001, 120, '2026-01-15T20:00:00.000Z'));
  addTitle(makeMovie('Movie B', 1002, 130, '2026-02-15T20:00:00.000Z'));
  var exported = exportData();
  var json2 = buildEnvelope([makeMovie('Movie C', 1003, 140, '2026-03-15T20:00:00.000Z')]);
  importData(json2);
  assertEqual(getTracker().length, 3, 'after second import');
  importData(exported);
  check('still 3 items (A, B, C) - no duplicates from re-import', function() { assertEqual(getTracker().length, 3, 'count'); });
  check('all movies present', function() {
    var ids = getTracker().map(function(t) { return t.tmdbId; }).sort();
    assertEqual(ids.join(','), '1001,1002,1003', 'ids');
  });
}

function test13_importAfterClearAllData() {
  console.log('');
  console.log('--- Test 13: Import after Clear All Data ---');
  reset();
  addTitle(makeMovie('Movie A', 1001, 120, '2026-01-15T20:00:00.000Z'));
  importData(buildEnvelope([], [makeHistory('h1', 1001, 'movie', 'Movie A', 'Added', '2026-01-01T10:00:00.000Z')]));
  assertEqual(getTracker().length, 1, 'precondition tracker');
  assertEqual(getHistory().length, 1, 'precondition history');
  ls.removeItem(TRACKER_KEY);
  ls.removeItem(HISTORY_KEY);
  var json = buildEnvelope(
    [makeMovie('Movie B', 1002, 130, '2026-02-15T20:00:00.000Z')],
    [makeHistory('h2', 1002, 'movie', 'Movie B', 'Added', '2026-02-01T10:00:00.000Z')]
  );
  var result = importData(json);
  check('import succeeds after clear', function() { assertEqual(result.success, true, 'success'); });
  check('1 tracker item', function() { assertEqual(getTracker().length, 1, 'tracker'); });
  check('1 history entry', function() { assertEqual(getHistory().length, 1, 'history'); });
  check('tracker is Movie B', function() { assertEqual(getTracker()[0].tmdbId, 1002, 'tmdbId'); });
  check('history is h2', function() { assertEqual(getHistory()[0].id, 'h2', 'history id'); });
}

function test14_acceptanceFlow() {
  console.log('');
  console.log('--- Test 14: Final acceptance test ---');
  reset();
  addTitle(makeMovie('Movie A', 1001, 120, '2026-01-15T20:00:00.000Z'));
  addTitle(makeMovie('Movie B', 1002, 130, '2026-02-15T20:00:00.000Z'));
  check('start: A, B', function() { assertEqual(getTracker().length, 2, 'start'); });
  importData(buildEnvelope([makeMovie('Movie C', 1003, 140, '2026-03-15T20:00:00.000Z'), makeMovie('Movie D', 1004, 150, '2026-04-15T20:00:00.000Z')]));
  check('after import 1: A, B, C, D', function() { assertEqual(getTracker().length, 4, 'after import 1'); });
  importData(buildEnvelope([makeMovie('Movie E', 1005, 160, '2026-05-15T20:00:00.000Z'), makeMovie('Movie F', 1006, 170, '2026-06-15T20:00:00.000Z')]));
  check('after import 2: A, B, C, D, E, F', function() { assertEqual(getTracker().length, 6, 'after import 2'); });
  importData(buildEnvelope([makeMovie('Movie C', 1003, 140, '2026-03-15T20:00:00.000Z'), makeMovie('Movie D', 1004, 150, '2026-04-15T20:00:00.000Z')]));
  check('after re-import 1: STILL A, B, C, D, E, F', function() { assertEqual(getTracker().length, 6, 'after re-import 1'); });
  ls.removeItem(TRACKER_KEY);
  ls.removeItem(HISTORY_KEY);
  check('after clear: EMPTY', function() { assertEqual(getTracker().length, 0, 'after clear'); });
  importData(buildEnvelope([makeMovie('Movie E', 1005, 160, '2026-05-15T20:00:00.000Z'), makeMovie('Movie F', 1006, 170, '2026-06-15T20:00:00.000Z')]));
  check('after final import: E, F', function() { assertEqual(getTracker().length, 2, 'final'); });
  check('E present', function() { assert(getTracker().some(function(t) { return t.tmdbId === 1005; }), 'E'); });
  check('F present', function() { assert(getTracker().some(function(t) { return t.tmdbId === 1006; }), 'F'); });
}

function test15_mixedSeriesAndMovies() {
  console.log('');
  console.log('--- Test 15: Mixed series + movies across imports ---');
  reset();
  addTitle(makeMovie('Existing Movie', 1001, 120, '2026-01-15T20:00:00.000Z'));
  importData(buildEnvelope([
    makeSeries('Breaking Bad', 169, 62, 5, '2026-08-10T22:00:00.000Z'),
    makeMovie('Dunkirk', 378249, 107, '2026-06-10T20:00:00.000Z'),
  ]));
  importData(buildEnvelope([
    makeSeries('Game of Thrones', 1399, 73, 8, '2026-09-10T22:00:00.000Z'),
  ]));
  check('4 items total', function() { assertEqual(getTracker().length, 4, 'count'); });
  check('2 movies', function() { assertEqual(getTracker().filter(function(t) { return t.type === 'movie'; }).length, 2, 'movies'); });
  check('2 series', function() { assertEqual(getTracker().filter(function(t) { return t.type === 'tv'; }).length, 2, 'series'); });
}

function main() {
  console.log('=== ArcVault Additive Import Test ===');
  test1_emptyExistingPlusImport();
  test2_existingPlusNewImport();
  test3_twoConsecutiveDifferentImports();
  test4_sameImportTwice();
  test5_existingPlusImportedDuplicate();
  test6_normalPlusImportedRecords();
  test7_historyMerging();
  test8_statisticsAfterMultipleImports();
  test9_clearAllData();
  test10_failedImportPreservesExisting();
  test11_bulkImportIntoNonEmpty();
  test12_exportImportSecondImport();
  test13_importAfterClearAllData();
  test14_acceptanceFlow();
  test15_mixedSeriesAndMovies();
  console.log('');
  console.log('Summary: ' + passCount + ' passed, ' + failCount + ' failed');
  process.exit(failCount === 0 ? 0 : 1);
}

try {
  main();
} catch (err) {
  console.log('FAIL: unhandled error: ' + err.message);
  failCount++;
  console.log('Summary: ' + passCount + ' passed, ' + failCount + ' failed');
  process.exit(1);
}
