import { useState } from 'react';

export default function InstructionsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`instructions ${open ? 'instructions--open' : ''}`}>
      <button className="instructions-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? 'Cerrar instrucciones' : 'Cómo se juega aaaaaa'}
      </button>
      {open && (
        <div className="instructions-body">
          <ul>
            <li>Arrastra desde uno de tus discos hacia atrás para apuntar.</li>
            <li>La línea amarilla marca la fuerza: mientras más larga, más fuerte el disparo.</li>
            <li>Suelta para disparar. Solo puedes mover discos de tu equipo en tu turno.</li>
            <li>Empuja el balón a la portería contraria para anotar.</li>
            <li>Gana quien llegue primero a 5 goles, o quien vaya ganando al agotarse los tiros.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
