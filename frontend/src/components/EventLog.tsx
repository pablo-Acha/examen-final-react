import type { LogEntry } from '../game/types';

interface Props {
  entries: LogEntry[];
}

export default function EventLog({ entries }: Props) {
  if (entries.length === 0) return null;
  return (
    <ul className="event-log">
      {entries.map((entry) => (
        <li key={entry.id} className={`event-log-item event-log-item--${entry.tone}`}>
          {entry.text}
        </li>
      ))}
    </ul>
  );
}
