const TRACKER_KEY = 'watchvault_tracker';
const ls = new Map();
function readJson(k) { const r = ls.get(k); if (!r) return []; try { const p = JSON.parse(r); return Array.isArray(p) ? p : []; } catch { return []; } }
function getTracker() { return readJson(TRACKER_KEY); }
function saveTracker(items) { ls.set(TRACKER_KEY, JSON.stringify(items)); }
function addTitle(item) { const t = getTracker(); if (t.some(x => x.tmdbId === item.tmdbId && x.type === item.type)) return false; t.push(item); saveTracker(t); return true; }
function updateTitle(tmdbId, type, updates) { const t = getTracker(); const i = t.findIndex(x => x.tmdbId === tmdbId && x.type === type); if (i === -1) return null; const keys = type === 'movie' ? ['personalRating','status','dateWatched','favorite','runtime'] : ['personalRating','status','dateStarted','dateCompleted','favorite','seasonProgress','numberOfEpisodes']; const u = {}; for (const k of keys) { if (k in updates) u[k] = updates[k]; } t[i] = {...t[i], ...u}; saveTracker(t); return t[i]; }
function exportData() { return JSON.stringify({version:1, exportDate:new Date().toISOString(), tracker:getTracker(), history:[]}, null, 2); }
function importData(json) { const d = JSON.parse(json); if (!d.tracker || !Array.isArray(d.tracker)) throw new Error('Invalid'); const v = d.tracker.filter(isValid); ls.set(TRACKER_KEY, JSON.stringify(v)); return {success:true, count:v.length}; }
function isValid(i) { return i && typeof i==='object' && (i.type==='movie'||i.type==='tv') && typeof i.tmdbId==='number' && i.tmdbId>0 && typeof i.title==='string' && typeof i.id==='string'; }
function reset() { ls.clear(); }
function mkId(prefix, tmdbId) { return prefix + '_' + tmdbId + '_' + Math.floor(Math.random() * 99999); }
function mkMovie(title, tmdbId, runtime, dateWatched) { return {id:mkId('mv',tmdbId), tmdbId:tmdbId, type:'movie', title:title, poster:null, backdrop:null, releaseDate:'2024-01-01', releaseYear:2024, genres:['Drama'], description:title, runtime:runtime, tmdbRating:8.0, personalRating:0, status:'completed', dateAdded:dateWatched||'2026-08-01T10:00:00.000Z', dateWatched:dateWatched, favorite:false}; }
function mkNormalMovie(title, tmdbId, runtime, dateWatched) { const item = {id:mkId('mv',tmdbId), tmdbId:tmdbId, type:'movie', title:title, poster:null, backdrop:null, releaseDate:'2024-01-01', releaseYear:2024, genres:['Drama'], description:title, runtime:runtime, tmdbRating:8.0, personalRating:0, status:'pending', dateAdded:'2026-08-01T10:00:00.000Z', dateWatched:null, favorite:false}; addTitle(item); updateTitle(tmdbId, 'movie', {status:'completed', dateWatched:dateWatched}); return getTracker().find(t => t.tmdbId === tmdbId); }
function mkSeries(title, tmdbId, eps, seasons, dateCompleted) { const sp = []; for (let s=1; s<=seasons; s++) { const n = Math.ceil(eps/seasons); const episodes = []; for (let e=1; e<=n; e++) { episodes.push({episodeNumber:e, watched:false, runtime:null}); } sp.push({seasonNumber:s, episodeCount:n, episodes:episodes}); } return {id:mkId('sv',tmdbId), tmdbId:tmdbId, type:'tv', title:title, poster:null, backdrop:null, releaseDate:'2020-01-01', releaseYear:2020, genres:['Drama'], description:title, numberOfSeasons:seasons, numberOfEpisodes:eps, tmdbRating:8.5, personalRating:0, status:'completed', dateAdded:dateCompleted||'2026-08-01T10:00:00.000Z', dateStarted:'2026-07-01T10:00:00.000Z', dateCompleted:dateCompleted, favorite:false, seasonProgress:sp}; }
function getMovieWatchTime(m) { return m.status==='completed' ? (m.runtime||0) : 0; }
function getSeriesWatchTime(s) { let t=0; for (const sn of s.seasonProgress) for (const e of sn.episodes) if (e.watched && e.runtime) t+=e.runtime; if (t>0) return t; if (s.status==='completed' && s.numberOfEpisodes>0) return s.numberOfEpisodes*45; return 0; }
function calcStats(items) { const mv=items.filter(i=>i.type==='movie'), sv=items.filter(i=>i.type==='tv'); return {moviesCompleted:mv.filter(m=>m.status==='completed').length, seriesCompleted:sv.filter(s=>s.status==='completed').length, movieTime:mv.reduce((s,m)=>s+getMovieWatchTime(m),0), seriesTime:sv.reduce((s,sx)=>s+getSeriesWatchTime(sx),0)}; }
function getMonthly(items) { const mm=new Map(); items.filter(i=>(i.type==='movie'&&i.status==='completed')||(i.type==='tv'&&i.status==='completed')).forEach(i=>{ const ds=i.type==='movie'?i.dateWatched:i.dateCompleted; if(!ds) return; const d=new Date(ds); const mk=d.toLocaleDateString('en-US',{year:'numeric',month:'short'}); const t=i.type==='movie'?getMovieWatchTime(i):getSeriesWatchTime(i); mm.set(mk,(mm.get(mk)||0)+t); }); return Array.from(mm.entries()).map(([m,mi])=>({month:m,minutes:mi})); }
let P=0,F=0;
function check(n,fn) { try{fn();P++;console.log('PASS: '+n)}catch(e){F++;console.log('FAIL: '+n);console.log('      '+e.message)} }
function eq(a,b,l){if(a!==b)throw new Error(l+': expected '+JSON.stringify(b)+', got '+JSON.stringify(a));}
function assert(c,l){if(!c)throw new Error(l||'assertion failed');}

function runTest1() {
  console.log('');
  console.log('--- Test 1: Controlled case - 2 imported movies ---');
  reset();
  addTitle(mkMovie('Interstellar', 157336, 169, '2026-08-20T18:30:00.000Z'));
  addTitle(mkMovie('Oppenheimer', 872585, 180, '2026-07-15T20:00:00.000Z'));
  const items = getTracker();
  check('2 items in tracker', () => eq(items.length, 2, 'count'));
  check('both completed', () => eq(items.filter(i=>i.status==='completed').length, 2, 'completed'));
  const stats = calcStats(items);
  check('Movies Watched = 2', () => eq(stats.moviesCompleted, 2, 'moviesCompleted'));
  check('Movie Watch Time = 349 min', () => eq(stats.movieTime, 349, 'movieTime'));
  check('Total Watch Time = 349 min', () => eq(stats.movieTime + stats.seriesTime, 349, 'total'));
  const monthly = getMonthly(items);
  check('Monthly has 2 entries', () => eq(monthly.length, 2, 'monthly count'));
  const aug = monthly.find(m => m.month === 'Aug 2026');
  const jul = monthly.find(m => m.month === 'Jul 2026');
  check('Aug 2026 = 169 min', () => { assert(aug, 'Aug exists'); eq(aug.minutes, 169, 'aug'); });
  check('Jul 2026 = 180 min', () => { assert(jul, 'Jul exists'); eq(jul.minutes, 180, 'jul'); });
  check('Interstellar runtime = 169', () => eq(getTracker().find(t=>t.tmdbId===157336).runtime, 169, 'rt'));
  check('Oppenheimer runtime = 180', () => eq(getTracker().find(t=>t.tmdbId===872585).runtime, 180, 'rt'));
}

function runTest2() {
  console.log('');
  console.log('--- Test 2: Normal + Imported mixed ---');
  reset();
  mkNormalMovie('Interstellar', 157336, 169, '2026-08-20T18:30:00.000Z');
  addTitle(mkMovie('Oppenheimer', 872585, 180, '2026-08-22T20:00:00.000Z'));
  const stats = calcStats(getTracker());
  check('Mixed Movie Watch Time = 349', () => eq(stats.movieTime, 349, 'movieTime'));
  const monthly = getMonthly(getTracker());
  const aug = monthly.find(m => m.month === 'Aug 2026');
  check('Aug 2026 = 349 (both in same month)', () => { assert(aug, 'Aug exists'); eq(aug.minutes, 349, 'aug'); });
}

function runTest3() {
  console.log('');
  console.log('--- Test 3: Duplicate import protection ---');
  reset();
  addTitle(mkMovie('Interstellar', 157336, 169, '2026-08-20T18:30:00.000Z'));
  addTitle(mkMovie('Interstellar', 157336, 169, '2026-08-20T18:30:00.000Z'));
  check('only 1 item (no duplicate)', () => eq(getTracker().length, 1, 'count'));
  check('Watch Time still 169', () => eq(calcStats(getTracker()).movieTime, 169, 'time'));
}

function runTest4() {
  console.log('');
  console.log('--- Test 4: Export -> Import -> Export roundtrip ---');
  reset();
  addTitle(mkMovie('Interstellar', 157336, 169, '2026-08-20T18:30:00.000Z'));
  addTitle(mkMovie('Oppenheimer', 872585, 180, '2026-07-15T20:00:00.000Z'));
  const e1 = exportData();
  reset();
  importData(e1);
  const e2 = exportData();
  check('exports match (minus date)', () => { const a=JSON.parse(e1), b=JSON.parse(e2); delete a.exportDate; delete b.exportDate; assert(JSON.stringify(a)===JSON.stringify(b), 'mismatch'); });
  check('after roundtrip, Watch Time = 349', () => eq(calcStats(getTracker()).movieTime, 349, 'time'));
  const monthly = getMonthly(getTracker());
  check('Aug 2026 = 169', () => { const a=monthly.find(m=>m.month==='Aug 2026'); assert(a,'exists'); eq(a.minutes,169,'aug'); });
  check('Jul 2026 = 180', () => { const j=monthly.find(m=>m.month==='Jul 2026'); assert(j,'exists'); eq(j.minutes,180,'jul'); });
}

function runTest5() {
  console.log('');
  console.log('--- Test 5: Imported series watch time (fallback path) ---');
  reset();
  addTitle(mkSeries('Breaking Bad', 169, 62, 5, '2026-08-10T22:00:00.000Z'));
  const items = getTracker();
  check('series completed', () => eq(items[0].status, 'completed', 'status'));
  check('dateCompleted set', () => assert(items[0].dateCompleted, 'dateCompleted'));
  const stats = calcStats(items);
  check('Series Completed = 1', () => eq(stats.seriesCompleted, 1, 'sc'));
  check('Series Watch Time = 62*45 = 2790', () => eq(stats.seriesTime, 2790, 'st'));
  const monthly = getMonthly(items);
  check('Aug 2026 = 2790', () => { const a=monthly.find(m=>m.month==='Aug 2026'); assert(a,'exists'); eq(a.minutes,2790,'aug'); });
}

function runTest6() {
  console.log('');
  console.log('--- Test 6: 185-item bulk import + statistics ---');
  reset();
  let expectedMovieTime = 0;
  for (let i = 0; i < 100; i++) { const rt = 88+(i%72); expectedMovieTime += rt; addTitle(mkMovie('BM'+i, 900000+i+1, rt, '2025-'+String((i%12)+1).padStart(2,'0')+'-'+String((i%27)+1).padStart(2,'0')+'T20:00:00.000Z')); }
  for (let i = 0; i < 85; i++) { addTitle(mkSeries('BS'+i, 800000+i+1, 62, 5, '2025-'+String((i%6)+1).padStart(2,'0')+'-'+String((i%27)+1).padStart(2,'0')+'T22:00:00.000Z')); }
  const items = getTracker();
  check('185 items stored', () => eq(items.length, 185, 'count'));
  check('100 movies', () => eq(items.filter(i=>i.type==='movie').length, 100, 'movies'));
  check('85 series', () => eq(items.filter(i=>i.type==='tv').length, 85, 'series'));
  const stats = calcStats(items);
  check('100 movies completed', () => eq(stats.moviesCompleted, 100, 'mc'));
  check('85 series completed', () => eq(stats.seriesCompleted, 85, 'sc'));
  check('Movie Watch Time > 0', () => { assert(stats.movieTime > 0, 'movieTime should be > 0, got '+stats.movieTime); });
  check('Movie Watch Time = expected sum', () => eq(stats.movieTime, expectedMovieTime, 'movieTime'));
  check('Series Watch Time > 0', () => { assert(stats.seriesTime > 0, 'seriesTime should be > 0, got '+stats.seriesTime); });
  check('Series Watch Time = 85*62*45 = 237150', () => eq(stats.seriesTime, 237150, 'seriesTime'));
  const total = stats.movieTime + stats.seriesTime;
  check('Total Watch Time > 0', () => { assert(total > 0, 'total should be > 0'); });
}

function runTest7() {
  console.log('');
  console.log('--- Test 7: Re-import same JSON twice ---');
  reset();
  addTitle(mkMovie('Interstellar', 157336, 169, '2026-08-20T18:30:00.000Z'));
  const json = exportData();
  reset();
  importData(json);
  importData(json);
  check('still 1 item after double import', () => eq(getTracker().length, 1, 'count'));
  check('Watch Time still 169', () => eq(calcStats(getTracker()).movieTime, 169, 'time'));
}

function runTest8() {
  console.log('');
  console.log('--- Test 8: Movie without dateWatched shows 0 monthly ---');
  reset();
  addTitle(mkMovie('NoDate', 999999, 120, null));
  const items = getTracker();
  check('movie has null dateWatched', () => eq(items[0].dateWatched, null, 'dateWatched'));
  check('Watch Time = 120 (runtime still counted)', () => eq(calcStats(items).movieTime, 120, 'time'));
  const monthly = getMonthly(items);
  check('no monthly entry (dateWatched is null)', () => eq(monthly.length, 0, 'monthly'));
}

let passCount = 0, failCount = 0;
function main() {
  console.log('=== ArcVault Statistics Verification Test ===');
  runTest1(); runTest2(); runTest3(); runTest4(); runTest5(); runTest6(); runTest7(); runTest8();
  console.log('');
  console.log('Summary: ' + (P) + ' passed, ' + (F) + ' failed');
  process.exit(F === 0 ? 0 : 1);
}
try { main(); } catch(e) { console.log('FATAL: '+e.message); process.exit(1); }
