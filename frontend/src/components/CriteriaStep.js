import React, { useState } from "react";

export default function CriteriaStep({ criteria, setCriteria, onNext }) {
  const [name, setName]     = useState("");
  const [isCat, setIsCat]   = useState(false);
  const [cats, setCats]     = useState([{ label: "", score: "" }]);

  const addCat  = () => setCats([...cats, { label: "", score: "" }]);
  const updCat  = (i, f, v) => { const c = [...cats]; c[i][f] = v; setCats(c); };
  const remCat  = (i) => setCats(cats.filter((_, idx) => idx !== i));

  const add = () => {
    if (!name.trim()) return alert("Entrez un nom de critère");
    const catPrefs = isCat
      ? Object.fromEntries(cats.filter(c => c.label).map(c => [c.label, parseFloat(c.score) || 0]))
      : null;
    setCriteria([...criteria, {
      name: name.trim(), is_categorical: isCat, category_preferences: catPrefs
    }]);
    setName(""); setIsCat(false); setCats([{ label: "", score: "" }]);
  };

  const remove = (i) => setCriteria(criteria.filter((_, idx) => idx !== i));

  return (
    <div className="card">
      <h2>Étape 1 — Définir les critères</h2>
      <p className="hint">Exemple du cours : Processor Speed, Storage Capacity, Brand, RAM Capacity</p>

      <div className="row">
        <input className="inp" placeholder="Nom du critère (ex: Processor Speed)"
          value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()} />
        <label className="chk">
          <input type="checkbox" checked={isCat} onChange={e => setIsCat(e.target.checked)} />
          Catégoriel
        </label>
      </div>

      {isCat && (
        <div className="cat-box">
          <p>Échelle de préférence (label → score numérique) :</p>
          {cats.map((c, i) => (
            <div key={i} className="row">
              <input className="inp" placeholder="Label (ex: Dell)" value={c.label}
                onChange={e => updCat(i, "label", e.target.value)} />
              <input className="inp" placeholder="Score (ex: 9)" type="number"
                value={c.score} onChange={e => updCat(i, "score", e.target.value)} />
              <button className="btn-icon" onClick={() => remCat(i)}>✕</button>
            </div>
          ))}
          <button className="btn-sm" onClick={addCat}>+ Catégorie</button>
        </div>
      )}

      <button className="btn" onClick={add}>+ Ajouter critère</button>

      {criteria.length > 0 && (
        <div className="list">
          <h3>Critères ajoutés ({criteria.length})</h3>
          {criteria.map((c, i) => (
            <div key={i} className="list-item">
              <div>
                <strong>{c.name}</strong>
                {c.is_categorical && (
                  <span className="badge">
                    catégoriel : {Object.entries(c.category_preferences || {})
                      .map(([k, v]) => `${k}→${v}`).join(", ")}
                  </span>
                )}
              </div>
              <button className="btn-danger" onClick={() => remove(i)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="nav">
        <span />
        <button className="btn" onClick={onNext} disabled={criteria.length < 2}>
          Suivant →
        </button>
      </div>
    </div>
  );
}