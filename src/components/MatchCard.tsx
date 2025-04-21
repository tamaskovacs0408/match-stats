"use client";

import React from "react";
import styles from "./styles/MatchCard.module.scss";
import Image from "next/image";
import { Match } from "@/types/football.types";
import { useQuery } from "@tanstack/react-query";

interface MatchCardProps {
  match: Match;
  lazyLoad?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function MatchCard({ match, lazyLoad = false }: MatchCardProps) {
  const homeId = match.homeTeam.id;
  const awayId = match.awayTeam.id;

  const {
    data: predictionData,
    isLoading: isPredictionLoading,
    isError: isPredictionError,
  } = useQuery({
    queryKey: ["prediction", match.id, homeId, awayId],
    queryFn: async () => {
      if (!homeId || !awayId) {
        return { matches: [], prediction: null };
      }
      const response = await fetch(
        `/api/predictions?homeTeamId=${homeId}&awayTeamId=${awayId}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `API request failed with status ${response.status}`
        );
      }
      return response.json();
    },
    enabled: !!homeId && !!awayId,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const matchDate = new Date(match.utcDate);
  const formattedTime = matchDate.toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "Tervezett";
      case "LIVE":
        return "Élő";
      case "IN_PLAY":
        return "Folyamatban";
      case "PAUSED":
        return "Szünet";
      case "FINISHED":
        return "Befejezett";
      case "POSTPONED":
        return "Elhalasztva";
      case "SUSPENDED":
        return "Felfüggesztve";
      case "CANCELED":
        return "Törölve";
      default:
        return status;
    }
  };

  return (
    <div className={styles.matchCard}>
      <div className={styles.header}>
        <div className={styles.competition}>
          <Image
            src={match.competition.emblem}
            alt={match.competition.name}
            width={20}
            height={20}
          />
          <span>{match.competition.name}</span>
        </div>
        <div className={styles.time}>{formattedTime}</div>
      </div>
      <div className={styles.teams}>
        <div className={styles.team}>
          <Image
            src={match.homeTeam.crest}
            alt={match.homeTeam.shortName || match.homeTeam.name}
            width={30}
            height={30}
          />
          <span>{match.homeTeam.name}</span>
        </div>
        <div className={styles.vs}>vs</div>
        <div className={styles.team}>
          <Image
            src={match.awayTeam.crest}
            alt={match.awayTeam.shortName || match.awayTeam.name}
            width={30}
            height={30}
          />
          <span>{match.awayTeam.name}</span>
        </div>
      </div>
      <div className={styles.status}>
        <span>{getStatusText(match.status)}</span>
        {match.status === "FINISHED" && (
          <span className={styles.score}>
            {match.score?.fullTime?.home ?? 0} :{" "}
            {match.score?.fullTime?.away ?? 0}
          </span>
        )}
      </div>

      <div className={styles.prediction}>
        {isPredictionLoading && (
          <>
            <div className={styles.predictionHeader}>
              Előrejelzés betöltése...
            </div>
            <div className={styles.loading}>⏳</div>
          </>
        )}

        {isPredictionError && (
          <>
            <div className={styles.predictionHeader}>
              Hiba az előrejelzésben
            </div>
            <div className={styles.error}>
              ⚠️ Hiba történt az adatok lekérése közben.
            </div>
          </>
        )}

        {!isPredictionLoading &&
          !isPredictionError &&
          predictionData?.prediction && (
            <>
              <div className={styles.predictionHeader}>
                Előrejelzés
                {predictionData.matches.length > 0 && (
                  <span className={styles.dataSource}>
                    {` (${predictionData.matches.length} korábbi mérkőzés alapján)`}
                  </span>
                )}
              </div>
              <div className={styles.predictionDetails}>
                <div className={styles.homePredict}>
                  <div className={styles.teamName}>
                    {match.homeTeam.shortName || match.homeTeam.name}
                  </div>
                  <div className={styles.percent}>
                    {predictionData.prediction.homeWinChance}%
                  </div>
                  <div className={styles.avgGoals}>
                    Átlag: {predictionData.prediction.homeGoalChance} gól
                  </div>
                </div>
                <div className={styles.drawPredict}>
                  <div className={styles.drawText}>Döntetlen</div>
                  <div className={styles.percent}>
                    {predictionData.prediction.drawChance}%
                  </div>
                </div>
                <div className={styles.awayPredict}>
                  <div className={styles.teamName}>
                    {match.awayTeam.shortName || match.awayTeam.name}
                  </div>
                  <div className={styles.percent}>
                    {predictionData.prediction.awayWinChance}%
                  </div>
                  <div className={styles.avgGoals}>
                    Átlag: {predictionData.prediction.awayGoalChance} gól
                  </div>
                </div>
              </div>
              <div className={styles.totalGoals}>
                Várható gólok összesen:{" "}
                {predictionData.prediction.totalGoalsExpected}
              </div>
            </>
          )}

        {!isPredictionLoading &&
          !isPredictionError &&
          !predictionData?.prediction && (
            <>
              <div className={styles.predictionHeader}>Előrejelzés</div>
              <div className={styles.noPrediction}>
                Nem áll rendelkezésre elég adat az előrejelzéshez.
              </div>
            </>
          )}
      </div>
    </div>
  );
}
