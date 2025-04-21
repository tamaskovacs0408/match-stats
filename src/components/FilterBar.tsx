import React from "react";
import { Competition } from "@/types/football.types";
import styles from "./styles/FilterBar.module.scss";
import Image from "next/image";

interface FilterBarProps {
  competitions: Competition[];
  selectedCompetitions: string[];
  onCompetitionToggle: (competitionCode: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  competitions,
  selectedCompetitions,
  onCompetitionToggle,
  onSelectAll,
  onClearAll,
}) => {
  return (
    <div className={styles.filterBar}>
      <h3 className={styles.title}>Ligák szűrése</h3>

      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={onSelectAll}>
          Összes
        </button>
        <button className={styles.actionBtn} onClick={onClearAll}>
          Törlés
        </button>
      </div>

      <div className={styles.competitionList}>
        {competitions.map(competition => (
          <div
            key={competition.code}
            className={`${styles.competitionItem} ${
              selectedCompetitions.includes(competition.code)
                ? styles.active
                : ""
            }`}
            onClick={() => onCompetitionToggle(competition.code)}
          >
            {competition.emblem && (
              <Image
                src={competition.emblem}
                alt={competition.name}
                width={36}
                height={36}
                className={styles.emblem}
              />
            )}
            <span className={styles.name}>{competition.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterBar;
