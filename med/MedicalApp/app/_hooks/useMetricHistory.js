import { useEffect, useState } from 'react';
import { getHistory, subscribe } from '../_services/mockHealthStore';

/**
 * Subscribe to mock metric history for detail screens.
 * @param {string} field - metric key (bpm, spo2, lm35_temp, ...)
 */
export default function useMetricHistory(field, limitCount = 10) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apply = (_latest, all) => {
      const rows = (all || getHistory(limitCount)).slice(-limitCount).map((row) => ({
        value: row[field],
        [field]: row[field],
        timestamp: row.timestamp,
        ...row,
      }));
      setHistory(rows);
      setLoading(false);
    };
    const unsub = subscribe(apply);
    return () => unsub();
  }, [field, limitCount]);

  return { history, loading, latest: history[history.length - 1] || null };
}
