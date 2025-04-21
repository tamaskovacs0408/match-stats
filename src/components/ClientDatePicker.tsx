"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./styles/ClientDatePicker.module.scss";

interface ClientDatePickerProps {
  initialDateFrom?: string;
  initialDateTo?: string;
}

const ClientDatePicker: React.FC<ClientDatePickerProps> = ({
  initialDateFrom = "",
  initialDateTo = "",
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [maxDate, setMaxDate] = useState<string>("");
  
  // Komponens betöltésekor állítsuk be a max dátumot (mai nap + 7 nap)
  useEffect(() => {
    const today = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(today.getDate() + 7);
    
    // Formázás YYYY-MM-DD formátumra
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    setMaxDate(formatDate(oneWeekLater));
  }, []);

  // Dátum kiválasztás kezelése
  const handleDateChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    isStartDate: boolean
  ) => {
    const value = event.target.value;

    const params = new URLSearchParams(searchParams.toString());

    if (isStartDate) {
      params.set("dateFrom", value);
    } else {
      params.set("dateTo", value);
    }

    // Frissítjük az URL-t a kiválasztott dátumokkal
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className={styles.dateSelector}>
      <div className={styles.dateGroup}>
        <label htmlFor='dateFrom'>Mérkőzések ettől:</label>
        <input
          type='date'
          id='dateFrom'
          className={styles.dateInput}
          defaultValue={initialDateFrom}
          onChange={e => handleDateChange(e, true)}
          min={new Date().toISOString().split('T')[0]}
          max={maxDate}
        />
      </div>

      <div className={styles.dateGroup}>
        <label htmlFor='dateTo'>Mérkőzések eddig:</label>
        <input
          type='date'
          id='dateTo'
          className={styles.dateInput}
          defaultValue={initialDateTo}
          onChange={e => handleDateChange(e, false)}
          min={initialDateFrom || new Date().toISOString().split('T')[0]}
          max={maxDate}
        />
      </div>
    </div>
  );
};

export default ClientDatePicker;
