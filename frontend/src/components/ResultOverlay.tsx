import type { MatchState } from '../game/types';

interface Props {
  state: MatchState;
  onRematch: () => void;
}

export default function ResultOverlay({ state, onRematch }: Props) {
  const { teams, score, winner } = state;
  const winnerLabel = winner === 'draw' ? 'Empate' : winner ? `Gana ${teams[winner].name}` : '';

  return (
    <div className="overlay result-screen">
      <div className="result-card">
        <p className="result-eyebrow">Tiempo cumplido</p>
        <div className="result-score">
          <span>{score.A}</span>
          <span className="result-sep">–</span>
          <span>{score.B}</span>
        </div>
        <h2 className="result-winner">{winnerLabel}</h2>
        <button className="start-button" onClick={onRematch}>
          Revancha
        </button>
      </div>
    </div>
  );
}
