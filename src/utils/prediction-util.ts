import { Match } from "@/types/football.types";

interface MatchPrediction {
  homeGoalChance: number; // Átlagos hazai gólok száma
  awayGoalChance: number; // Átlagos vendég gólok száma
  totalGoalsExpected: number; // Összes várható gólok száma
  homeWinChance: number; // Hazai győzelem valószínűsége %
  awayWinChance: number; // Vendég győzelem valószínűsége %
  drawChance: number; // Döntetlen valószínűsége %
}

/**
 * Mérkőzés előrejelzés számítása korábbi mérkőzések alapján
 * @param previousMatches A két csapat korábbi mérkőzései egymás ellen
 * @returns Előrejelzési statisztikák
 */
export const calculateMatchPrediction = (
  previousMatches: Match[]
): MatchPrediction => {
  // Ha nincs elég adat, akkor default értékeket adunk vissza
  if (!previousMatches || previousMatches.length === 0) {
    return {
      homeGoalChance: 1.5,
      awayGoalChance: 1.2,
      totalGoalsExpected: 2.7,
      homeWinChance: 45,
      awayWinChance: 30,
      drawChance: 25,
    };
  }

  // Számoljuk ki a mérkőzések eredményeit
  let homeTeamId: number | null = null;
  let homeTeamWins = 0;
  let awayTeamWins = 0;
  let draws = 0;
  let homeTeamGoals = 0;
  let awayTeamGoals = 0;

  // Az első mérkőzésből kivesszük a hazai csapat azonosítóját
  if (previousMatches.length > 0) {
    homeTeamId = previousMatches[0].homeTeam.id;
  }

  // Számoljuk össze a korábbi eredményeket
  previousMatches.forEach(match => {
    // Csak befejezett mérkőzéseket veszünk figyelembe
    if (match.status !== "FINISHED") return;

    const homeScore = match.score.fullTime.home || 0;
    const awayScore = match.score.fullTime.away || 0;

    // Ellenőrizzük, hogy az aktuális hazai csapat volt-e a hazai vagy vendég az adott mérkőzésen
    if (match.homeTeam.id === homeTeamId) {
      homeTeamGoals += homeScore;
      awayTeamGoals += awayScore;

      if (homeScore > awayScore) homeTeamWins++;
      else if (homeScore < awayScore) awayTeamWins++;
      else draws++;
    } else {
      // Ha a csapatok fel voltak cserélve, akkor korrigáljuk a számlálást
      homeTeamGoals += awayScore;
      awayTeamGoals += homeScore;

      if (awayScore > homeScore) homeTeamWins++;
      else if (awayScore < homeScore) awayTeamWins++;
      else draws++;
    }
  });

  // Az átlagos gólok számítása
  const totalMatches = previousMatches.length;
  const avgHomeGoals = homeTeamGoals / totalMatches;
  const avgAwayGoals = awayTeamGoals / totalMatches;
  const totalAvgGoals = avgHomeGoals + avgAwayGoals;

  // Győzelmi esélyek számítása
  const homeWinPercentage = (homeTeamWins / totalMatches) * 100;
  const awayWinPercentage = (awayTeamWins / totalMatches) * 100;
  const drawPercentage = (draws / totalMatches) * 100;

  return {
    homeGoalChance: Number(avgHomeGoals.toFixed(2)),
    awayGoalChance: Number(avgAwayGoals.toFixed(2)),
    totalGoalsExpected: Number(totalAvgGoals.toFixed(2)),
    homeWinChance: Number(homeWinPercentage.toFixed(1)),
    awayWinChance: Number(awayWinPercentage.toFixed(1)),
    drawChance: Number(drawPercentage.toFixed(1)),
  };
};

/**
 * Két szám közötti véletlen egész szám generálása
 * @param min Minimum érték (beleértve)
 * @param max Maximum érték (beleértve)
 */
export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Poisson eloszlás alapján szimulálja a gólok számát
 * @param lambda Az átlagos érték
 */
export const getPoissonRandom = (lambda: number): number => {
  const L = Math.exp(-lambda);
  let p = 1.0;
  let k = 0;

  do {
    k++;
    p *= Math.random();
  } while (p > L);

  return k - 1;
};

/**
 * Mérkőzés eredmény szimulálása a gólszám előrejelzés alapján
 * @param homeGoalChance Átlagos hazai gólok száma
 * @param awayGoalChance Átlagos vendég gólok száma
 */
export const simulateMatchScore = (
  homeGoalChance: number,
  awayGoalChance: number
): { home: number; away: number } => {
  const homeGoals = getPoissonRandom(homeGoalChance);
  const awayGoals = getPoissonRandom(awayGoalChance);

  return { home: homeGoals, away: awayGoals };
};

export default {
  calculateMatchPrediction,
  simulateMatchScore,
};
