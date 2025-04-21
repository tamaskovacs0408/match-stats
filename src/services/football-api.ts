import {
  MatchesResponse,
  CompetitionsResponse,
  HeadToHeadResponse,
} from "@/types/football.types";

// Környezeti változók beállítása
// FOOTBALL_API_KEY: Csak a szerveren érhető el
const BASE_URL = process.env.FOOTBALL_API_BASE_URL;
const API_KEY = process.env.FOOTBALL_API_KEY;

// API kérések rate limite: 10 kérés / perc
const MAX_REQUESTS_PER_MINUTE = 10;
const MINUTE_IN_MS = 60 * 1000;

// API hívások nyilvántartása
let requestTimestamps: number[] = [];

// Fejléc beállítása az API kérésekhez
const getHeaders = () => {
  if (!API_KEY) {
    throw new Error("Missing API key.");
  }
  return {
    "X-Auth-Token": API_KEY,
    "Content-Type": "application/json",
  };
};

/**
 * Ellenőrzi, hogy túlléptük-e a rate limitet
 * @returns Igaz, ha már elértük a percenkénti limitet
 */
const isRateLimited = (): boolean => {
  const now = Date.now();

  // Töröljük az egy percnél régebbi kéréseket a listából
  requestTimestamps = requestTimestamps.filter(
    timestamp => now - timestamp < MINUTE_IN_MS
  );

  // Ellenőrizzük, hogy elértük-e a limitet
  return requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE;
};

/**
 * Várakozás, amíg az API rate limit feloldódik
 */
const waitForRateLimitReset = async (): Promise<void> => {
  const now = Date.now();

  if (requestTimestamps.length === 0) return;

  // Az első kérés időbélyege
  const oldestRequest = requestTimestamps[0];

  // Számítsuk ki, mennyi idő múlva lesz újra elérhető kérés (amikor az első kérés már egy percnél régebbi lesz)
  const timeUntilReset = MINUTE_IN_MS - (now - oldestRequest);

  if (timeUntilReset > 0) {
    await new Promise(resolve => setTimeout(resolve, timeUntilReset + 100)); // 100ms extra biztonság
  }
};

/**
 * API hívás végrehajtása hibakezeléssel és rate limit kezeléssel
 * @param url API végpont URL-je
 * @param useCache Használjon-e cache-elést (alapértelmezetten true)
 */
const fetchWithErrorHandling = async <T = unknown>(url: string, useCache: boolean = true): Promise<T> => {
  try {
    // Ellenőrizzük a rate limitet
    if (isRateLimited()) {
      console.warn(
        "API rate limit reached! Waiting for the next time window..."
      );
      await waitForRateLimitReset();
    }
    
    // Ellenőrizzük az API kulcs meglétét
    if (!API_KEY) {
      throw new Error("Missing API key.");
    }

    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
      cache: useCache ? "force-cache" : "no-store", // Cache használata, ha engedélyezve van
      next: { revalidate: useCache ? 3600 : 0 } // 1 órás revalidáció a cache-hez, ha használjuk
    });

    // Rögzítjük a kérés időpontját
    requestTimestamps.push(Date.now());

    // Rate limit hibaellenőrzés
    if (response.status === 429) {
      console.error(
        "API Rate limit error: Too many requests. Waiting for the next time window..."
      );

      // Várakozás 61 másodpercig a következő kérés előtt (hogy biztosan lejárjon a rate limit ablak)
      await new Promise(resolve => setTimeout(resolve, MINUTE_IN_MS + 1000));

      // Újrapróbálkozás
      return fetchWithErrorHandling(url, useCache);
    }

    if (!response.ok) {
      // Megpróbáljuk kiolvasni a részletes hibaüzenetet
      let errorDetails = "";
      try {
        const errorData = await response.json();
        errorDetails = JSON.stringify(errorData);
        console.error("API error:", errorData);
      } catch (e) {
        // Ha nem sikerül kiolvasni a JSON-t, használjuk az eredeti állapotot
        errorDetails = response.statusText || "Unknown error";
        console.error("Error:", e);
      }

      throw new Error(
        `API hiba: ${response.status} - ${errorDetails}`
      );
    }

    return response.json();
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};

/**
 * Mérkőzések lekérése dátum tartomány és bajnokság alapján
 * @param dateFrom Kezdő dátum (YYYY-MM-DD formátumban)
 * @param dateTo Végdátum (YYYY-MM-DD formátumban)
 * @param competitionCode Opcionális bajnokság kód (pl. "PL" Premier League-hez)
 * @param useCache Használjon-e cache-elést (alapértelmezetten true)
 * @returns API válasz a mérkőzésekkel
 */
export const getMatches = async (
  dateFrom: string,
  dateTo: string,
  competitionCode?: string,
  useCache: boolean = true
): Promise<MatchesResponse> => {
  let endpoint = `${BASE_URL}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
  
  if (competitionCode) {
    endpoint += `&competitions=${competitionCode}`;
  }
  
  return fetchWithErrorHandling(endpoint, useCache);
};

/**
 * Bajnokságok listájának lekérése
 * @param useCache Használjon-e cache-elést (alapértelmezetten true)
 * @returns API válasz az elérhető bajnokságokkal
 */
export const getCompetitions = async (useCache: boolean = true): Promise<CompetitionsResponse> => {
  return fetchWithErrorHandling(`${BASE_URL}/competitions`, useCache);
};

/**
 * Két csapat közötti korábbi mérkőzések lekérése
 * @param team1Id Első csapat azonosítója
 * @param team2Id Második csapat azonosítója
 * @param limit Opcionális limit a visszaadott mérkőzések számára
 * @param useCache Használjon-e cache-elést (alapértelmezetten true)
 * @returns API válasz a fejfej elleni mérkőzésekkel
 */
export const getHeadToHead = async (
  team1Id: number,
  team2Id: number,
  limit: number = 10,
  useCache: boolean = true
): Promise<HeadToHeadResponse> => {
  return fetchWithErrorHandling(
    `${BASE_URL}/teams/${team1Id}/matches?limit=${limit}&status=FINISHED&toTeam=${team2Id}`,
    useCache
  );
};
