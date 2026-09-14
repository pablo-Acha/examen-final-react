import type { MatchState } from '../game/types';

interface Props {
  state: MatchState;
}

export default function Scoreboard({ state }: Props) {
  const { teams, score, turn, phase } = state;
  return (
    <div className="scoreboard" role="status" aria-live="polite">
      <div className="scoreboard-team" data-team="A">
        <span className="scoreboard-dot" style={{ background: teams.A.color }} />
        <span className="scoreboard-name">{teams.A.name}</span>
      </div>

      <div className="scoreboard-score">
        <span>{score.A}</span>
        <span className="scoreboard-sep">–</span>
        <span>{score.B}</span>
      </div>

      <div className="scoreboard-team scoreboard-team--right" data-team="B">
        <span className="scoreboard-name">{teams.B.name}</span>
        <span className="scoreboard-dot" style={{ background: teams.B.color }} />
      </div>

      {phase !== 'finished' && (
        <div className={`scoreboard-turn scoreboard-turn--${turn}`}>
          Turno de {teams[turn].name}
        </div>
      )}
    </div>
  );
}
