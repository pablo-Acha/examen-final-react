import { useState } from 'react';

interface Props {
  onStart: (teamAName: string, teamBName: string) => void;
}

export default function StartScreen({ onStart }: Props) {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');

  return (
    <div className="overlay start-screen">
      <div className="start-card">
        <p className="start-eyebrow">Duelo de discos, un solo balón</p>
        <h1 className="start-title">
          SOCCER
          <br />
          STARS
        </h1>
        <p className="start-copy">
          Elige un disco, estira para apuntar y suelta para disparar. Empuja al balón hasta la
          portería contraria antes de que se acaben los tiros.
        </p>

        <div className="start-form">
          <label className="start-field">
            <span>Equipo azul</span>
            <input
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
              placeholder="Equipo A"
              maxLength={16}
            />
          </label>
          <label className="start-field">
            <span>Equipo rojo</span>
            <input
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
              placeholder="Equipo B"
              maxLength={16}
            />
          </label>
        </div>

        <button className="start-button" onClick={() => onStart(teamA.trim(), teamB.trim())}>
          Iniciar partido
        </button>
      </div>
    </div>
  );
}
