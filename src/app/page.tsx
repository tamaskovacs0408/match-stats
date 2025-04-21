import { Suspense } from "react";
import styles from "./page.module.scss";
import { getCompetitions, getMatches } from "@/services/football-api";
import { Competition, Match } from "@/types/football.types";
import MatchCard from "@/components/MatchCard";
import ClientFilterBar from "@/components/ClientFilterBar";
import ClientDatePicker from "@/components/ClientDatePicker";

const MAJOR_LEAGUE_CODES = ["PL", "BL1", "SA", "PD", "FL1", "NB1"];

// Segédfüggvény a dátumformázáshoz
const formatDateForApi = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// Mérkőzések csoportosítása dátum szerint
const groupMatchesByDate = (matches: Match[]): Record<string, Match[]> => {
  const result: Record<string, Match[]> = {};

  matches.forEach(match => {
    // A dátum csak a napi részt tartalmazza, óra, perc nélkül
    const matchDate = match.utcDate.split("T")[0];

    if (!result[matchDate]) {
      result[matchDate] = [];
    }

    result[matchDate].push(match);
  });

  return result;
};

// Formázott dátum a csoportokhoz
const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("hu-HU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

// Mérkőzések betöltése - előrejelzések nélkül
async function loadMatches(
  dateFrom: string,
  dateTo: string,
  competitionsFilter?: string
): Promise<{
  matches: Match[];
  matchesByDate: Record<string, Match[]>;
  error?: string;
}> {
  // Ha nincs liga kiválasztva, üres eredményt adunk vissza
  if (!competitionsFilter || competitionsFilter.length === 0) {
    return { matches: [], matchesByDate: {} };
  }

  try {
    // Mérkőzések lekérése
    const matchesResponse = await getMatches(
      dateFrom,
      dateTo,
      competitionsFilter
    );

    // Mérkőzések csoportosítása dátum szerint
    const matchesByDate = groupMatchesByDate(matchesResponse.matches);

    return {
      matches: matchesResponse.matches,
      matchesByDate,
    };
  } catch (error: unknown) {
    console.error("Error while loading matches:", error);
    return {
      matches: [],
      matchesByDate: {},
      error:
      error instanceof Error
        ? error.message
        : "An unknown error occurred while loading the matches.",
    };
  }
}

// Csak kompetíciók cache-t használunk statikusan
let cachedCompetitions: Competition[] = [];

// Define props type for the page
type HomePageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

// Server Component
export default async function Home({ searchParams }: HomePageProps) {
  // URL paraméterek feldolgozása - átnevezzük, hogy ne használja közvetlenül a searchParams-t
  const urlParams = Object.fromEntries(
    Object.entries(searchParams || {}).map(([key, value]) => [
      key,
      typeof value === "string" ? value : undefined,
    ])
  );

  // Dátumok beállítása (ha nincs megadva, az aktuális naptól egy hétig)
  const today = new Date();
  const oneWeekLater = new Date();
  oneWeekLater.setDate(today.getDate() + 7); // 14 napról 7 napra csökkentve

  const dateFrom = urlParams.dateFrom || formatDateForApi(today);
  const dateTo = urlParams.dateTo || formatDateForApi(oneWeekLater);

  // Competíciók betöltése - csak ha még nincs cache-elve
  let competitions: Competition[] = [];

  if (cachedCompetitions.length === 0) {
    try {
      const competitionsResponse = await getCompetitions();
      // Ne szűrjük csak a LEAGUE típusúakra, hogy a La Liga is megjelenjen
      cachedCompetitions = competitionsResponse.competitions;
    } catch (error) {
      console.error("Error, failed to load the ligues:", error);
      cachedCompetitions = [];
    }
  }

  // Használjuk a cache-elt kompetíciókat
  competitions = cachedCompetitions;

  // Prioritást adunk a főbb ligáknak (PL, BL1, SA, PD=La Liga, FL1, stb.)
  competitions = [
    ...competitions.filter(comp => MAJOR_LEAGUE_CODES.includes(comp.code)),
    ...competitions.filter(comp => !MAJOR_LEAGUE_CODES.includes(comp.code)),
  ];

  // A kiválasztott ligák alapján szűrünk
  const selectedCompetitions = urlParams.competitions
    ? (urlParams.competitions as string).split(",")
    : [];
  const competitionsFilter =
    selectedCompetitions.length > 0
      ? selectedCompetitions.join(",")
      : undefined;

  // Meccsek betöltése - csak ha van kiválasztott liga
  const {
    matches,
    matchesByDate,
    error: matchesError,
  } = competitionsFilter
    ? await loadMatches(dateFrom, dateTo, competitionsFilter)
    : { matches: [], matchesByDate: {}, error: undefined };

  // A matchesSection tartalom meghatározása a kiválasztás alapján
  let matchesSectionContent;

  if (matchesError) {
    matchesSectionContent = (
      <div className={styles.errorLoadingMatches}>
        <h3>Hiba történt</h3>
        <p>
          Nem sikerült betölteni a mérkőzéseket. Kérjük, próbálja újra később.
        </p>
        <p className={styles.errorMessage}>Hiba részletei: {matchesError}</p>
      </div>
    );
  } else if (selectedCompetitions.length === 0) {
    matchesSectionContent = (
      <div className={styles.selectLeaguePrompt}>
        <div className={styles.promptIcon}>⬅️</div>
        <h3>Válassz ligát a mérkőzések megjelenítéséhez</h3>
        <p>
          Kattints a bal oldalon található ligák valamelyikére a közelgő
          mérkőzések betöltéséhez.
        </p>
      </div>
    );
  } else if (matches.length === 0) {
    matchesSectionContent = (
      <div className={styles.noMatches}>
        <p>Nincsenek mérkőzések a kiválasztott időszakban vagy ligákban.</p>
      </div>
    );
  } else {
    matchesSectionContent = (
      <div className={styles.matchDayGroups}>
        {Object.keys(matchesByDate)
          .sort()
          .map(date => (
            <div key={date} className={styles.matchDayGroup}>
              <h3 className={styles.matchDayTitle}>
                {formatDisplayDate(date)}
              </h3>
              <div className={styles.matchDayMatches}>
                {matchesByDate[date].map(match => (
                  <MatchCard key={match.id} match={match} lazyLoad={true} />
                ))}
              </div>
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <div className={styles.pageHeader}>
        <h1>Közelgő mérkőzések előrejelzései</h1>
        <p className={styles.subtitle}>
          Nézd meg a következő napok mérkőzéseit és a várható eredményeket
        </p>
      </div>

      {/* Kliens oldali dátumválasztó */}
      <ClientDatePicker initialDateFrom={dateFrom} initialDateTo={dateTo} />

      <div className={styles.content}>
        <div className={styles.sidebar}>
          {/* Kliens oldali szűrő */}
          <ClientFilterBar
            competitions={competitions}
            initialSelectedCompetitions={selectedCompetitions}
          />
        </div>

        <div className={styles.matchesSection}>
          <div className={styles.matchesHeader}>
            <h2>Mérkőzések</h2>
            {!matchesError && matches.length > 0 && (
              <div className={styles.matchCount}>{matches.length} mérkőzés</div>
            )}
          </div>

          <Suspense
            fallback={
              <div className={styles.loadingIndicator}>
                Mérkőzések listájának betöltése...
              </div>
            }
          >
            {matchesSectionContent}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
