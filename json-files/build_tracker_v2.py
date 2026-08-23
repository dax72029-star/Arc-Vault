"""
ArcVault tracker builder v2 — pulls REAL data from TMDB for every title.
Movies and TV shows use DIFFERENT schemas (confirmed from a real ArcVault export):

  Movie entry: id prefix "mv_", has runtime + dateWatched
  TV entry:    id prefix "sv_", has numberOfSeasons/numberOfEpisodes,
               dateStarted/dateCompleted, and a full seasonProgress array

USAGE:
  pip install requests
  python build_tracker_v2.py YOUR_TMDB_API_KEY
"""

import sys, json, random, string, time
from datetime import datetime, timedelta
import requests

if len(sys.argv) < 2:
    print("Usage: python build_tracker_v2.py YOUR_TMDB_API_KEY")
    sys.exit(1)

API_KEY = sys.argv[1]
BASE = "https://api.themoviedb.org/3"

# (title, type hint, expected year)
ITEMS = [
("Breaking Bad","tv",2008),
("Game of Thrones","tv",2011),
("House of the Dragon","tv",2022),
("Money Heist","tv",2017),
("Berlin","tv",2023),
("The Boys","tv",2019),
("Lost","tv",2004),
("The Queen's Gambit","tv",2020),
("Stranger Things","tv",2016),
("True Detective","tv",2014),
("The Last of Us","tv",2023),
("All of Us Are Dead","tv",2022),
("The Walking Dead","tv",2010),
("Dark","tv",2017),
("Succession","tv",2018),
("1899","tv",2022),
("Peaky Blinders","tv",2013),
("Mr. Robot","tv",2015),
("Ozark","tv",2017),
("Suits","tv",2011),
("Lucifer","tv",2016),
("Better Call Saul","tv",2015),
("You","tv",2018),
("Inventing Anna","tv",2022),
("Wednesday","tv",2022),
("From","tv",2022),
("Black Mirror","tv",2011),
("Squid Game","tv",2021),
("Alice in Borderland","tv",2020),
("Alien: Earth","tv",2025),
("Farzi","tv",2023),
("Scam 1992","tv",2020),
("Sherlock","tv",2010),
("The Sinner","tv",2017),
("It: Welcome to Derry","tv",2025),
("Eat the Rich: The GameStop Saga","tv",2022),
("Madoff: The Monster of Wall Street","tv",2023),
("Billions","tv",2016),

("Demolition","movie",2015),
("Interstellar","movie",2014),
("Oppenheimer","movie",2023),
("Dunkirk","movie",2017),
("The Prestige","movie",2006),
("Memento","movie",2000),
("Inception","movie",2010),
("Tenet","movie",2020),
("The Dark Knight","movie",2008),
("Batman Begins","movie",2005),
("The Flash","movie",2023),
("Batman v Superman: Dawn of Justice","movie",2016),
("Justice League","movie",2017),
("Fight Club","movie",1999),
("F1","movie",2025),
("Ford v Ferrari","movie",2019),
("Rush","movie",2013),
("Zodiac","movie",2007),
("Gone Girl","movie",2014),
("Se7en","movie",1995),
("Shutter Island","movie",2010),
("The Social Network","movie",2010),
("Blade Runner","movie",1982),
("Dune","movie",2021),
("Dune: Part Two","movie",2024),
("Now You See Me","movie",2013),
("Now You See Me 2","movie",2016),
("Now You See Me: Now You Don't","movie",2025),
("La La Land","movie",2016),
("Marty Supreme","movie",2025),
("Eternals","movie",2021),
("Fifty Shades of Grey","movie",2015),
("Fifty Shades Darker","movie",2017),
("Fifty Shades Freed","movie",2018),
("My Fault","movie",2023),
("Your Fault","movie",2024),
("Our Fault","movie",2025),
("It","movie",2017),
("It Chapter Two","movie",2019),
("The Conjuring","movie",2013),
("The Conjuring 2","movie",2016),
("The Conjuring: The Devil Made Me Do It","movie",2021),
("The Nun","movie",2018),
("The Nun II","movie",2023),
("Titanic","movie",1997),
("Jumanji","movie",1995),
("Jumanji: Welcome to the Jungle","movie",2017),
("Free Guy","movie",2021),
("The Adam Project","movie",2022),
("Jurassic Park","movie",1993),
("The Lost World: Jurassic Park","movie",1997),
("Jurassic Park III","movie",2001),
("Jurassic World","movie",2015),
("Jurassic World: Fallen Kingdom","movie",2018),
("Jurassic World Dominion","movie",2022),
("Jurassic World Rebirth","movie",2025),
("Avatar","movie",2009),
("Avatar: The Way of Water","movie",2022),
("Avatar: Fire and Ash","movie",2025),
("Pirates of the Caribbean: The Curse of the Black Pearl","movie",2003),
("Pirates of the Caribbean: Dead Man's Chest","movie",2006),
("Pirates of the Caribbean: At World's End","movie",2007),
("Pirates of the Caribbean: On Stranger Tides","movie",2011),
("Pirates of the Caribbean: Dead Men Tell No Tales","movie",2017),
("Uncharted","movie",2022),
("The Matrix","movie",1999),
("Transformers","movie",2007),
("Transformers: Revenge of the Fallen","movie",2009),
("Transformers: Dark of the Moon","movie",2011),
("Transformers: Age of Extinction","movie",2014),
("Transformers: The Last Knight","movie",2017),
("Bumblebee","movie",2018),
("Transformers: Rise of the Beasts","movie",2023),
("Transformers One","movie",2024),
("Mission: Impossible","movie",1996),
("Mission: Impossible II","movie",2000),
("Mission: Impossible III","movie",2006),
("Mission: Impossible - Ghost Protocol","movie",2011),
("Mission: Impossible - Rogue Nation","movie",2015),
("Mission: Impossible - Fallout","movie",2018),
("Mission: Impossible - Dead Reckoning Part One","movie",2023),
("Mission: Impossible - The Final Reckoning","movie",2025),
("Final Destination","movie",2000),
("Final Destination 2","movie",2003),
("Final Destination 3","movie",2006),
("The Final Destination","movie",2009),
("Final Destination 5","movie",2011),
("Final Destination Bloodlines","movie",2025),
("The Fast and the Furious","movie",2001),
("2 Fast 2 Furious","movie",2003),
("The Fast and the Furious: Tokyo Drift","movie",2006),
("Fast & Furious","movie",2009),
("Fast Five","movie",2011),
("Fast & Furious 6","movie",2013),
("Furious 7","movie",2015),
("The Fate of the Furious","movie",2017),
("F9","movie",2021),
("Fast X","movie",2023),
("Harry Potter and the Sorcerer's Stone","movie",2001),
("Harry Potter and the Chamber of Secrets","movie",2002),
("Harry Potter and the Prisoner of Azkaban","movie",2004),
("Harry Potter and the Goblet of Fire","movie",2005),
("Harry Potter and the Order of the Phoenix","movie",2007),
("Harry Potter and the Half-Blood Prince","movie",2009),
("Harry Potter and the Deathly Hallows: Part 1","movie",2010),
("Harry Potter and the Deathly Hallows: Part 2","movie",2011),
("Lucy","movie",2014),
("The Shawshank Redemption","movie",1994),
("Red Notice","movie",2021),
("Blue Is the Warmest Colour","movie",2013),
("Trust No One: The Hunt for the Crypto King","movie",2022),
("Cryptopia: Bitcoin, Blockchains and the Future of the Internet","movie",2020),
("Inside Job","movie",2010),
("The Wolf of Wall Street","movie",2013),
("Source Code","movie",2011),
("The Da Vinci Code","movie",2006),
("The Pursuit of Happyness","movie",2006),
("The Lion King","movie",1994),
("Blade Runner 2049","movie",2017),
("Joker","movie",2019),
("Star Wars","movie",1977),
("The Empire Strikes Back","movie",1980),
("Return of the Jedi","movie",1983),
("Star Wars: Episode I - The Phantom Menace","movie",1999),
("Star Wars: Episode II - Attack of the Clones","movie",2002),
("Star Wars: Episode III - Revenge of the Sith","movie",2005),
("Star Wars: The Force Awakens","movie",2015),
("Rogue One: A Star Wars Story","movie",2016),
("Star Wars: The Last Jedi","movie",2017),
("Solo: A Star Wars Story","movie",2018),
("Star Wars: The Rise of Skywalker","movie",2019),
]

session = requests.Session()

def tmdb_get(path, params):
    p = dict(params)
    p["api_key"] = API_KEY
    r = session.get(f"{BASE}{path}", params=p, timeout=15)
    r.raise_for_status()
    return r.json()

def pick_best(results, expected_year, date_field):
    if not results:
        return None
    def year_of(r):
        d = r.get(date_field) or ""
        return int(d[:4]) if len(d) >= 4 and d[:4].isdigit() else None
    exact = [r for r in results if year_of(r) == expected_year]
    if exact:
        return max(exact, key=lambda r: r.get("popularity", 0))
    with_year = [r for r in results if year_of(r) is not None]
    if with_year:
        return min(with_year, key=lambda r: abs(year_of(r) - expected_year))
    return results[0]

def search_title(title, kind, expected_year):
    endpoint = "/search/movie" if kind == "movie" else "/search/tv"
    date_field = "release_date" if kind == "movie" else "first_air_date"
    data = tmdb_get(endpoint, {"query": title, "include_adult": "false"})
    best = pick_best(data.get("results", []), expected_year, date_field)
    if not best:
        return None
    detail_endpoint = f"/movie/{best['id']}" if kind == "movie" else f"/tv/{best['id']}"
    return tmdb_get(detail_endpoint, {})

def rand_suffix(n=6):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))

def fmt(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond//1000:03d}Z"

now = datetime(2026, 8, 23, 10, 0, 0)
two_years_ago = now - timedelta(days=730)

tracker = []
history = []
not_found = []

for idx, (title, kind, year) in enumerate(ITEMS):
    try:
        detail = search_title(title, kind, year)
    except Exception as e:
        print(f"ERROR fetching '{title}': {e}")
        not_found.append(title)
        continue

    if not detail:
        print(f"NOT FOUND: {title}")
        not_found.append(title)
        continue

    tmdb_id = detail["id"]
    real_title = detail.get("title") or detail.get("name")
    poster = detail.get("poster_path") or ""
    backdrop = detail.get("backdrop_path") or ""
    release_date = detail.get("release_date") or detail.get("first_air_date") or ""
    release_year = int(release_date[:4]) if len(release_date) >= 4 else year
    genres = [g["name"] for g in detail.get("genres", [])]
    description = detail.get("overview") or ""
    rating = round(detail.get("vote_average", 0), 3)

    # base timestamps
    added = two_years_ago + timedelta(days=random.randint(0, 700),
                                       hours=random.randint(0, 23), minutes=random.randint(0, 59))

    if kind == "movie":
        runtime = detail.get("runtime") or 0
        watched = added + timedelta(minutes=random.randint(2, 90))
        entry_id = f"mv_{tmdb_id}_{int(watched.timestamp()*1000)}"

        entry = {
            "tmdbId": tmdb_id, "type": "movie", "title": real_title,
            "poster": poster, "backdrop": backdrop,
            "releaseDate": release_date, "releaseYear": release_year,
            "genres": genres, "description": description,
            "runtime": runtime, "tmdbRating": rating, "personalRating": 0,
            "status": "completed", "dateWatched": fmt(watched), "favorite": False,
            "id": entry_id, "dateAdded": fmt(added)
        }
        tracker.append(entry)
        history.append({"title": real_title, "action": "Completed", "type": "movie",
                         "tmdbId": tmdb_id, "id": f"hist_{int(watched.timestamp()*1000)}_{rand_suffix()}",
                         "date": entry["dateWatched"]})
        history.append({"title": real_title, "action": "Added to watchlist", "type": "movie",
                         "tmdbId": tmdb_id, "id": f"hist_{int(added.timestamp()*1000)}_{rand_suffix()}",
                         "date": entry["dateAdded"]})

    else:  # tv
        seasons_raw = [s for s in detail.get("seasons", []) if s.get("season_number", 0) > 0]
        number_of_seasons = len(seasons_raw) if seasons_raw else detail.get("number_of_seasons", 0)
        number_of_episodes = sum(s.get("episode_count", 0) for s in seasons_raw) or detail.get("number_of_episodes", 0)

        entry_id = f"sv_{tmdb_id}_{int(added.timestamp()*1000)}"
        history.append({"title": real_title, "action": "Added to watchlist", "type": "tv",
                         "tmdbId": tmdb_id, "id": f"hist_{int(added.timestamp()*1000)}_{rand_suffix()}",
                         "date": fmt(added)})

        cursor = added + timedelta(hours=random.randint(1, 12))
        season_progress = []
        last_season_ts = cursor
        for s in seasons_raw:
            season_number = s.get("season_number")
            episode_count = s.get("episode_count", 0)
            episodes = [{"episodeNumber": e + 1, "watched": True, "runtime": None}
                        for e in range(episode_count)]
            season_progress.append({
                "seasonNumber": season_number,
                "episodeCount": episode_count,
                "episodes": episodes
            })
            cursor = cursor + timedelta(days=random.randint(1, 6), hours=random.randint(0, 23))
            last_season_ts = cursor
            history.append({"title": real_title, "action": f"Season {season_number} completed", "type": "tv",
                             "tmdbId": tmdb_id, "id": f"hist_{int(cursor.timestamp()*1000)}_{rand_suffix()}",
                             "date": fmt(cursor)})

        date_started = added + timedelta(hours=random.randint(1, 12))
        date_completed = last_season_ts

        entry = {
            "tmdbId": tmdb_id, "type": "tv", "title": real_title,
            "poster": poster, "backdrop": backdrop,
            "releaseDate": release_date, "releaseYear": release_year,
            "genres": genres, "description": description,
            "numberOfSeasons": number_of_seasons, "numberOfEpisodes": number_of_episodes,
            "tmdbRating": rating, "personalRating": 0,
            "status": "completed",
            "dateStarted": fmt(date_started), "dateCompleted": fmt(date_completed),
            "favorite": False, "id": entry_id, "dateAdded": fmt(added),
            "seasonProgress": season_progress
        }
        tracker.append(entry)

    print(f"OK  [{idx+1}/{len(ITEMS)}] {title} ({kind}) -> tmdbId {tmdb_id}")
    time.sleep(0.05)

def sort_key(x):
    return x.get("dateCompleted") or x.get("dateWatched") or x.get("dateAdded")

tracker.sort(key=sort_key, reverse=True)
history.sort(key=lambda x: x["date"], reverse=True)

output = {
    "version": 1,
    "exportDate": fmt(now),
    "tracker": tracker,
    "history": history
}

with open("tracker-export-v2.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"\nDone. {len(tracker)} titles written to tracker-export-v2.json")
if not_found:
    print(f"\nCould not confidently match {len(not_found)} titles:")
    for t in not_found:
        print(f"  - {t}")
