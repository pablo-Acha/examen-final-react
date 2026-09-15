import { useEffect, useState } from 'react';
import type { LogEntry } from '../game/types';

interface Props {
  entries: LogEntry[];
}

export default function EventLog({ entries }: Props) {
  const latestEntry = entries[0] ?? null;
  const latestEntryId = latestEntry?.id;
  const [expiredEntryId, setExpiredEntryId] = useState<number | null>(null);

  useEffect(() => {
    if (latestEntryId === undefined) return;

    // Solo se reinicia el tiempo cuando llega un mensaje nuevo.
    const timeoutId = window.setTimeout(() => setExpiredEntryId(latestEntryId), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [latestEntryId]);

  if (!latestEntry || expiredEntryId === latestEntry.id) return null;
  return (
    <ul className="event-log">
      <li className={`event-log-item event-log-item--${latestEntry.tone}`}>
        {latestEntry.text}
      </li>
    </ul>
  );
}
