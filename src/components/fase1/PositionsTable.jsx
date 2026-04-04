// =====================================================
// Arbitraje Pro — Tabla de Posiciones
// =====================================================

export default function PositionsTable({ standings, scoreLabel, cupos }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th className="col-center">#</th>
            <th>Equipo</th>
            <th className="col-center">PJ</th>
            <th className="col-center">PG</th>
            <th className="col-center">PE</th>
            <th className="col-center">PP</th>
            <th className="col-center">{scoreLabel === 'Goles' ? 'GF' : 'SF'}</th>
            <th className="col-center">{scoreLabel === 'Goles' ? 'GC' : 'SC'}</th>
            <th className="col-center">{scoreLabel === 'Goles' ? 'DG' : 'DS'}</th>
            <th className="col-center">PTS</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, index) => {
            const isClassified = index < cupos;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : null;
            return (
              <tr
                key={team.team_id}
                className={`${isClassified ? 'row-classified' : ''} ${index === 0 ? 'row-first' : ''}`}
              >
                <td className="col-center" style={{ fontWeight: 900, fontFamily: 'var(--font-title)' }}>
                  {medal || (index + 1)}
                </td>
                <td style={{ fontWeight: 700 }}>
                  {team.name}
                  {isClassified && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '0.72em',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      padding: '2px 7px',
                      borderRadius: '50px',
                      background: 'var(--accent)',
                      color: 'var(--text-on-accent)',
                      verticalAlign: 'middle',
                    }}>
                      Clasifica
                    </span>
                  )}
                </td>
                <td className="col-center">{team.pj}</td>
                <td className="col-center">{team.pg}</td>
                <td className="col-center">{team.pe}</td>
                <td className="col-center">{team.pp}</td>
                <td className="col-center">{team.gf}</td>
                <td className="col-center">{team.gc}</td>
                <td className="col-center" style={{
                  color: team.dg > 0 ? 'var(--success)' : team.dg < 0 ? 'var(--danger)' : 'var(--text-secondary)',
                  fontWeight: 700,
                }}>
                  {team.dg > 0 ? '+' : ''}{team.dg}
                </td>
                <td className="col-center" style={{
                  fontWeight: 900,
                  fontSize: '1.1em',
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-title)',
                }}>
                  {team.pts}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}