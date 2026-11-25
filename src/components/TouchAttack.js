export default function TouchAttack({ en, onAttack, disabled }) {
  return <button type="button" className="touch-attack" onClick={onAttack} disabled={disabled}
    aria-label={en ? 'Attack with sword' : 'Atacar com espada'}>
    {en ? 'Attack' : 'Atacar'}
  </button>;
}
