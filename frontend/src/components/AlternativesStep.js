import React, { useState } from "react";

export default function AlternativesStep({ criteria, alternatives, setAlternatives, onNext, onBack }) {
  const [name, setName]   = useState("");
  const [scores, setScores] = useState({});

  const add = () => {
    if (!name.trim()) return alert("Entrez un nom d'alternative");
    const s = {};
    criteria.forEach(c => {
      s[c.name] = c.is_categorical ? (scores[c.name] || "") : (parseFloat(scores[c.name]) || 0);
    });
    setAlternatives([...alternatives, { name: name.trim(), scores: s }]);
    setName(""); setScores({});
  };

  const remove = (i) => setAlternatives(alternatives.filter((_, idx) => idx !== i));

  return (
    <div className="card">
      <h2>Étape 2 — Définir les alternatives</h2>
      <p className="hint">Exemple du cours : M1 (20GHz, 100Go, Acer, 16Go), M2, M3, M4…</p>

      <input className="inp" placeholder="Nom de l'alternative (ex: Machine 1)"
        value={name} onChange={e => setName(e.target.value)} />

      <div className="scores-grid">
        {criteria.map(c => (
          <div key={c.name} className="score-item">
            <label>{c.name}</label>
            {c.is_categorical ? (
              <select className="inp" value={scores[c.name] || ""}
                onChange={e => setScores({ ...scores, [c.name]: e.target.value })}>
                <option value="">— Sélectionner —</option>
                {Object.keys(c.category_preferences || {}).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            ) : (
              <input className="inp" type="number" placeholder="Valeur"
                value={scores[c.name] || ""}
                onChange={e => setScores({ ...scores, [c.name]: e.target.value })} />
            )}
          </div>
        ))}
      </div>

      <button className="btn" onClick={add}>+ Ajouter alternative</button>

      {alternatives.length > 0 && (
        <div className="list">
          <h3>Alternatives ({alternatives.length})</h3>
          <div className="alt-table-wrap">
            <table className="alt-table">
              <thead>
                <tr>
                  <th>Alternative</th>
                  {criteria.map(c => <th key={c.name}>{c.name}</th>)}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {alternatives.map((a, i) => (
                  <tr key={i}>
                    <td><strong>{a.name}</strong></td>
                    {criteria.map(c => <td key={c.name}>{a.scores[c.name]}</td>)}
                    <td><button className="btn-danger" onClick={() => remove(i)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="nav">
        <button className="btn-sec" onClick={onBack}>← Retour</button>
        <button className="btn" onClick={onNext} disabled={alternatives.length < 2}>Suivant →</button>
      </div>
    </div>
  );
}