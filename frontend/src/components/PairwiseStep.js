import React, { useEffect, useState } from "react";
import { computeAHP } from "../api/ahp";

// Échelle de Saaty comme dans le cours
const SAATY = [
  { v: 9,       l: "9 — Importance extrême" },
  { v: 8,       l: "8" },
  { v: 7,       l: "7 — Très fortement important" },
  { v: 6,       l: "6" },
  { v: 5,       l: "5 — Fortement important" },
  { v: 4,       l: "4" },
  { v: 3,       l: "3 — Modérément important" },
  { v: 2,       l: "2" },
  { v: 1,       l: "1 — Égale importance" },
  { v: 1/2,     l: "1/2" },
  { v: 1/3,     l: "1/3 — Modérément moins" },
  { v: 1/4,     l: "1/4" },
  { v: 1/5,     l: "1/5 — Fortement moins" },
  { v: 1/6,     l: "1/6" },
  { v: 1/7,     l: "1/7 — Très fortement moins" },
  { v: 1/8,     l: "1/8" },
  { v: 1/9,     l: "1/9 — Extrêmement moins" },
];

export default function PairwiseStep({ criteria, alternatives, pairwise, setPairwise, setResult, onNext, onBack }) {
  const n = criteria.length;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const m = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 1 : 1))
    );
    setPairwise(m);
  }, [n]);

  const update = (i, j, val) => {
    const v = parseFloat(val);
    if (!v || v <= 0) return;
    const m = pairwise.map(r => [...r]);
    m[i][j] = v;
    m[j][i] = parseFloat((1 / v).toFixed(6));
    setPairwise(m);
  };

  const fmt = (v) => {
    if (!v) return "-";
    if (v >= 1) return v % 1 === 0 ? v.toString() : v.toFixed(3);
    // Afficher comme fraction
    const fracs = [[1,2],[1,3],[1,4],[1,5],[1,6],[1,7],[1,8],[1,9]];
    for (const [a,b] of fracs) {
      if (Math.abs(v - a/b) < 0.001) return `${a}/${b}`;
    }
    return v.toFixed(3);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await computeAHP({ criteria, alternatives, pairwise_matrix: pairwise });
      setResult(res);
      onNext();
    } catch (e) {
      alert("Erreur : " + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  if (!pairwise.length) return <div className="card">Chargement…</div>;

  return (
    <div className="card">
      <h2>Étape 3 — Matrice de comparaisons par paires</h2>
      <p className="hint">
        Remplissez la partie supérieure (triangle haut). La diagonale = 1, le triangle bas est calculé automatiquement (1/valeur).
      </p>

      {/* Rappel échelle */}
      <div className="scale-reminder">
        <strong>Échelle de Saaty :</strong>
        {[1,3,5,7,9].map(v => (
          <span key={v} className="scale-badge">{v}</span>
        ))}
        <span className="scale-desc">1=Égal · 3=Modéré · 5=Fort · 7=Très fort · 9=Extrême</span>
      </div>

      <div className="matrix-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <th className="corner"></th>
              {criteria.map(c => <th key={c.name} className="col-head">{c.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {criteria.map((row, i) => (
              <tr key={row.name}>
                <td className="row-head">{row.name}</td>
                {criteria.map((col, j) => (
                  <td key={col.name} className={i === j ? "diag" : i < j ? "upper" : "lower"}>
                    {i === j ? (
                      <span className="one">1</span>
                    ) : i < j ? (
                      <select className="sel"
                        value={pairwise[i]?.[j] || 1}
                        onChange={e => update(i, j, e.target.value)}>
                        {SAATY.map(s => (
                          <option key={s.v} value={s.v}>{s.l}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="auto">{fmt(pairwise[i]?.[j])}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="nav">
        <button className="btn-sec" onClick={onBack}>← Retour</button>
        <button className="btn" onClick={submit} disabled={loading}>
          {loading ? "Calcul en cours…" : "Calculer AHP →"}
        </button>
      </div>
    </div>
  );
}