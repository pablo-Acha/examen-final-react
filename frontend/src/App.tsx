import { useCallback, useRef, useState } from 'react';
import type { MatchState } from './game/types';
import { createMatch } from './game/engine';
import { gameClient } from './services/gameClient';
import GameCanvas from './components/GameCanvas';
import Scoreboard from './components/Scoreboard';
import EventLog from './components/EventLog';
import StartScreen from './components/StartScreen';
import ResultOverlay from './components/ResultOverlay';
import InstructionsPanel from './components/InstructionsPanel';

// El estado del partido vive en un ref mutable: la física corre a 60fps
// dentro de GameCanvas sin pasar por el ciclo de renderizado de React.
// `view` es una copia liviana que sólo se actualiza en los momentos que
// realmente le importan a la interfaz (cambio de turno, gol, fin de
// partido), para que el HUD se mantenga reactivo sin re-renderizar en
// cada frame de la simulación.
function App() {
  const [view, setView] = useState<MatchState>(() => createMatch('Equipo A', 'Equipo B'));
  const stateRef = useRef<MatchState>(view);

  const syncView = useCallback(() => {
    setView({ ...stateRef.current });
  }, []);

  async function handleStart(teamAName: string, teamBName: string) {
    const match = await gameClient.createMatch({ teamAName, teamBName });
    match.phase = 'aiming';
    stateRef.current = match;
    setView({ ...match });
  }

  async function handleRematch() {
    const match = await gameClient.createMatch({
      teamAName: view.teams.A.name,
      teamBName: view.teams.B.name,
    });
    match.phase = 'aiming';
    stateRef.current = match;
    setView({ ...match });
  }

  return (
    <div className="app">
      {view.phase !== 'start' && (
        <>
          <Scoreboard state={view} />
          <GameCanvas stateRef={stateRef} onSync={syncView} />
          <InstructionsPanel />
          <EventLog entries={view.log} />
        </>
      )}

      {view.phase === 'start' && <StartScreen onStart={handleStart} />}
      {view.phase === 'finished' && <ResultOverlay state={view} onRematch={handleRematch} />}
    </div>
  );
}

export default App;
