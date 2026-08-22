export type TitleType = 'movie' | 'tv';

export type MovieStatus = 'pending' | 'completed';
export type SeriesStatus = 'pending' | 'watching' | 'completed';

export type ContentStatus = 'pending' | 'watching' | 'completed';

export interface TrackerMovie {
  id: string;
  tmdbId: number;
  type: 'movie';
  title: string;
  poster: string | null;
  backdrop: string | null;
  releaseDate: string;
  releaseYear: number;
  genres: string[];
  description: string;
  runtime: number;
  tmdbRating: number;
  personalRating: number;
  status: MovieStatus;
  dateAdded: string;
  dateWatched: string | null;
  favorite: boolean;
}

export interface EpisodeProgress {
  episodeNumber: number;
  watched: boolean;
  runtime: number | null;
}

export interface SeasonProgress {
  seasonNumber: number;
  episodeCount: number;
  episodes: EpisodeProgress[];
}

export interface TrackerSeries {
  id: string;
  tmdbId: number;
  type: 'tv';
  title: string;
  poster: string | null;
  backdrop: string | null;
  releaseDate: string;
  releaseYear: number;
  genres: string[];
  description: string;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  tmdbRating: number;
  personalRating: number;
  status: SeriesStatus;
  dateAdded: string;
  dateStarted: string | null;
  dateCompleted: string | null;
  favorite: boolean;
  seasonProgress: SeasonProgress[];
}

export type TrackerItem = TrackerMovie | TrackerSeries;

export interface HistoryEntry {
  id: string;
  date: string;
  title: string;
  action: string;
  type: 'movie' | 'tv';
  tmdbId: number;
}

export interface TMDBSearchResult {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  vote_average: number;
  genre_ids?: number[];
}

export interface TMDBMovieDetail {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  overview: string;
  runtime: number | null;
  vote_average: number;
  genres: { id: number; name: string }[];
}

export interface TMDBEpisode {
  episode_number: number;
  name: string;
  overview: string;
  runtime: number | null;
  still_path: string | null;
  vote_average: number;
}

export interface TMDBSeason {
  season_number: number;
  name: string;
  episode_count: number;
  overview: string;
  air_date: string;
  episodes?: TMDBEpisode[];
}

export interface TMDBTVDetail {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  overview: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: TMDBSeason[];
}

export interface TMDBPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface WatchStats {
  totalMovies: number;
  moviesCompleted: number;
  totalSeries: number;
  seriesCompleted: number;
  seriesWatching: number;
  pendingTitles: number;
  totalCompleted: number;
  totalWatchTimeMinutes: number;
  movieWatchTimeMinutes: number;
  seriesWatchTimeMinutes: number;
  completionPercentage: number;
}

export interface WatchStreak {
  current: number;
  longest: number;
  days: { date: string; watched: boolean }[];
}
