"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Competition } from "@/types/football.types";
import FilterBar from "./FilterBar";
import styles from "./styles/ClientFilterBar.module.scss";

interface ClientFilterBarProps {
  competitions: Competition[];
  initialSelectedCompetitions?: string[];
}

const ClientFilterBar: React.FC<ClientFilterBarProps> = ({
  competitions,
  initialSelectedCompetitions = [],
}) => {
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>(
    initialSelectedCompetitions
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  // Liga szűrő kezelése
  const handleCompetitionToggle = (competitionCode: string) => {
    const newSelectedCompetitions = selectedCompetitions.includes(
      competitionCode
    )
      ? selectedCompetitions.filter(code => code !== competitionCode)
      : [...selectedCompetitions, competitionCode];

    setSelectedCompetitions(newSelectedCompetitions);
    updateQueryParams(newSelectedCompetitions);
  };

  // Összes liga kiválasztása
  const handleSelectAllCompetitions = () => {
    const allCompetitionCodes = competitions.map(comp => comp.code);
    setSelectedCompetitions(allCompetitionCodes);
    updateQueryParams(allCompetitionCodes);
  };

  // Összes liga törlése
  const handleClearCompetitions = () => {
    setSelectedCompetitions([]);
    updateQueryParams([]);
  };

  // URL paraméterek frissítése
  const updateQueryParams = (competitions: string[]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (competitions.length > 0) {
      params.set("competitions", competitions.join(","));
    } else {
      params.delete("competitions");
    }

    // Frissítjük az URL-t a kiválasztott ligákkal
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.selectionPrompt}>
        <h3>Válassz ligát a mérkőzések megjelenítéséhez</h3>
        <p>Kattints az alábbi ligák valamelyikére a mérkőzések betöltéséhez</p>
      </div>

      <FilterBar
        competitions={competitions}
        selectedCompetitions={selectedCompetitions}
        onCompetitionToggle={handleCompetitionToggle}
        onSelectAll={handleSelectAllCompetitions}
        onClearAll={handleClearCompetitions}
      />
    </div>
  );
};

export default ClientFilterBar;
