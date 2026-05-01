// ============================================================
// AHP Decision Tool — Composant Résultats
// Auteur   : MAAMOC KENGUIM RONEL
// Matricule: 22T2942
// Description: Affichage des résultats AHP en 5 onglets :
//   1. Matrice initiale
//   2. Matrice normalisée
//   3. Tableau criteria weight somme
//   4. Cohérence (λmax, CI, RI, CR)
//   5. Classement des alternatives
//   + Téléchargement rapport PDF
// ============================================================

import React, { useState, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const fmt4 = (v) => (typeof v === "number" ? v.toFixed(4) : v ?? "-");

export default function ResultStep({ result, criteria, alternatives, onBack }) {
  const [tab, setTab] = useState("pairwise");
  const reportRef = useRef();

  if (!result) return <div className="card">Aucun résultat.</div>;

  const isOk   = result.status === "consistent";
  const cnames = criteria.map((c) => c.name);

  const radarData = cnames.map((c) => ({
    criterion: c,
    poids: result.criteria_weights?.[c] || 0,
  }));

  const barData = Object.entries(result.alternative_scores || {})
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score);

  const tabs = [
    { id: "pairwise",    label: "1. Matrice initiale" },
    { id: "normalized",  label: "2. Matrice normalisée(Criteria weight)" },
    { id: "weights",     label: "3. Criteria weight somme" },
    { id: "consistency", label: "4. Cohérence" },
    { id: "ranking",     label: "5. Classement" },
  ];

  const downloadPDF = () => {
    const html = buildPrintHTML(result, criteria, alternatives, isOk);
    const win  = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  return (
    <div className="card result-card" ref={reportRef}>
      <div className="result-header">
        <h2>Étape 4 — Résultats AHP</h2>
        <button className="btn-pdf" onClick={downloadPDF}>
          📄 Télécharger rapport PDF
        </button>
      </div>

      <div className={`banner ${isOk ? "ok" : "err"}`}>{result.message}</div>

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "tab-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 1. Matrice initiale ── */}
      {tab === "pairwise" && (
        <div>
          <h3>Matrice de comparaisons par paires</h3>
          <p className="hint">
            Valeurs saisies sur l'échelle de Saaty. Somme des colonnes en bas.
          </p>
          <MatrixTable
            data={result.pairwise_table}
            keys={cnames}
            colSums={result.col_sums}
          />
        </div>
      )}

      {/* ── 2. Matrice normalisée ── */}
      {tab === "normalized" && (
        <div>
          <h3>Matrice normalisée</h3>
          <p className="hint">
            Chaque cellule = valeur / Σ colonne.
            Σ lignes et Σ colonnes affichées. Poids = Σ ligne / n.
          </p>
          <NormalizedTable
            data={result.normalized_table}
            keys={cnames}
            colSums={result.normalized_col_sums}
            weights={result.criteria_weights}
          />
        </div>
      )}

      {/* ── 3. Criteria weight somme ── */}
      {tab === "weights" && (
        <div>
          <h3>Tableau Criteria Weight Somme</h3>
          <p className="hint">
            Chaque cellule (i, j) = valeur initiale[i][j] × poids du critère[j].
            La Σ ligne = vecteur pondéré utilisé pour calculer λ.
          </p>
          <WeightSumTable
            data={result.consistency?.weight_sum_table}
            keys={cnames}
            weights={result.criteria_weights}
            lambdaVec={result.consistency?.lambda_vector}
          />
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="criterion" />
                <PolarRadiusAxis angle={30} domain={[0, 1]} tickCount={4} />
                <Radar
                  dataKey="poids"
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.45}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── 4. Cohérence ── */}
      {tab === "consistency" && result.consistency && (
        <ConsistencyTab
          consistency={result.consistency}
          criteria={criteria}
          criteriaWeights={result.criteria_weights}
          isOk={isOk}
        />
      )}

      {/* ── 5. Classement ── */}
      {tab === "ranking" && (
        <div>
          <h3>Classement des alternatives</h3>
          {!isOk && (
            <div className="warn-box">
              ⚠️ La matrice est incohérente (CR ≥ 0.10). Le classement est
              fourni à titre indicatif et peut ne pas être totalement fiable.
            </div>
          )}
          <div className="winner">
            🥇 Meilleur choix{!isOk ? " suggéré" : ""} :{" "}
            <strong>{result.best_alternative}</strong>
          </div>

          <h4 style={{ margin: "16px 0 8px" }}>Détail du calcul des scores</h4>
          <div className="matrix-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Alternative</th>
                  {cnames.map((c) => (
                    <th key={c}>
                      {c}
                      <br />
                      <span className="weight-sub">
                        w={fmt4(result.criteria_weights?.[c])}
                      </span>
                    </th>
                  ))}
                  <th>Score Total</th>
                </tr>
              </thead>
              <tbody>
                {barData.map((a, i) => {
                  const bd = result.alternative_breakdown?.[a.name] || {};
                  return (
                    <tr key={a.name} className={i === 0 ? "best-row" : ""}>
                      <td>
                        <strong>
                          {i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : ""}
                          {a.name}
                        </strong>
                      </td>
                      {cnames.map((c) => (
                        <td key={c} className="mono">
                          <span
                            title={`${bd[c]?.raw_score} × ${bd[c]?.weight} = ${bd[c]?.contribution}`}
                          >
                            {fmt4(bd[c]?.contribution)}
                          </span>
                        </td>
                      ))}
                      <td className="mono">
                        <strong>{fmt4(a.score)}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => fmt4(v)} />
                <Legend />
                <Bar
                  dataKey="score"
                  fill={isOk ? "#4f46e5" : "#f59e0b"}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="nav">
        <button className="btn-sec" onClick={onBack}>
          ← Réviser la matrice
        </button>
        <button className="btn-pdf" onClick={downloadPDF}>
          📄 Rapport PDF
        </button>
      </div>
    </div>
  );
}

// ── Sous-composants ──────────────────────────────────────────────────────────

function MatrixTable({ data, keys, colSums }) {
  return (
    <div className="matrix-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th></th>
            {keys.map((k) => <th key={k}>{k}</th>)}
          </tr>
        </thead>
        <tbody>
          {keys.map((row) => (
            <tr key={row}>
              <td className="row-head">{row}</td>
              {keys.map((col) => (
                <td key={col} className={`mono ${row === col ? "diag" : ""}`}>
                  {fmt4(data?.[row]?.[col])}
                </td>
              ))}
            </tr>
          ))}
          {colSums && (
            <tr className="sum-row">
              <td className="row-head">Σ col</td>
              {keys.map((k) => (
                <td key={k} className="mono">
                  <strong>{fmt4(colSums[k])}</strong>
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function NormalizedTable({ data, keys, colSums, weights }) {
  return (
    <div className="matrix-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th></th>
            {keys.map((k) => <th key={k}>{k}</th>)}
            <th className="highlight-col">Σ ligne</th>
            <th className="highlight-col">Poids (÷{keys.length})</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((row) => (
            <tr key={row}>
              <td className="row-head">{row}</td>
              {keys.map((col) => (
                <td key={col} className={`mono ${row === col ? "diag" : ""}`}>
                  {fmt4(data?.[row]?.[col])}
                </td>
              ))}
              <td className="mono highlight-col">
                <strong>{fmt4(data?.[row]?.row_sum)}</strong>
              </td>
              <td className="mono highlight-col" style={{ color: "#4f46e5" }}>
                <strong>{fmt4(weights?.[row])}</strong>
              </td>
            </tr>
          ))}
          <tr className="sum-row">
            <td className="row-head">Σ col</td>
            {keys.map((k) => (
              <td key={k} className="mono">
                <strong>{fmt4(colSums?.[k])}</strong>
              </td>
            ))}
            <td className="mono highlight-col">—</td>
            <td className="mono highlight-col">
              <strong>
                {fmt4(Object.values(weights || {}).reduce((a, b) => a + b, 0))}
              </strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Tableau criteria weight somme ────────────────────────────────────────────
// cellule(i,j) = matrice_initiale[i][j] × poids[j]
// Σ ligne[i]   = weighted_sum[i]
// λi           = Σ ligne[i] / poids[i]
function WeightSumTable({ data, keys, weights, lambdaVec }) {
  return (
    <div className="matrix-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>Critère</th>
            {keys.map((k) => (
              <th key={k}>
                {k}
                <br />
                <span className="weight-sub">×w={fmt4(weights?.[k])}</span>
              </th>
            ))}
            <th className="highlight-col">Σ ligne (AW)</th>
            <th className="highlight-col">Poids (W)</th>
            <th className="highlight-col">λ = AW/W</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((row, i) => {
            const w = weights?.[row] || 0;
            const aw = data?.[row]?.row_sum ?? 0;
            const lam = lambdaVec?.[i] ?? 0;
            return (
              <tr key={row}>
                <td className="row-head">{row}</td>
                {keys.map((col) => (
                  <td key={col} className={`mono ${row === col ? "diag" : ""}`}>
                    {fmt4(data?.[row]?.[col])}
                  </td>
                ))}
                <td className="mono highlight-col">
                  <strong>{fmt4(aw)}</strong>
                </td>
                <td className="mono highlight-col" style={{ color: "#4f46e5" }}>
                  <strong>{fmt4(w)}</strong>
                </td>
                <td className="mono highlight-col" style={{ color: "#059669" }}>
                  <strong>{fmt4(lam)}</strong>
                </td>
              </tr>
            );
          })}
          <tr className="sum-row">
            <td className="row-head">Σ / moyenne</td>
            {keys.map((k) => <td key={k}></td>)}
            <td className="mono highlight-col">—</td>
            <td className="mono highlight-col">
              <strong>
                {fmt4(Object.values(weights || {}).reduce((a, b) => a + b, 0))}
              </strong>
            </td>
            <td className="mono highlight-col" style={{ color: "#059669" }}>
              <strong>
                {fmt4(
                  (lambdaVec || []).reduce((a, b) => a + b, 0) /
                    (lambdaVec?.length || 1)
                )}
              </strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ConsistencyTab({ consistency, criteria, criteriaWeights, isOk }) {
  const cnames = criteria.map((c) => c.name);
  return (
    <div>
      <h3>Vérification de la cohérence</h3>
      <p className="hint">
        λmax = moyenne des λi &nbsp;|&nbsp; CI = (λmax − n) / (n − 1)
        &nbsp;|&nbsp; CR = CI / RI → cohérent si CR &lt; 0.10
      </p>

      <table className="tbl">
        <thead>
          <tr>
            <th>Critère</th>
            <th>Σ Pondérée (AW)</th>
            <th>Poids (W)</th>
            <th>λ = AW / W</th>
          </tr>
        </thead>
        <tbody>
          {cnames.map((c, i) => (
            <tr key={c}>
              <td className="row-head">{c}</td>
              <td className="mono">
                {fmt4(consistency.weighted_sum_vector?.[i])}
              </td>
              <td className="mono">{fmt4(criteriaWeights?.[c])}</td>
              <td className="mono">{fmt4(consistency.lambda_vector?.[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="stats-row">
        {[
          { label: "λmax", val: consistency.lambda_max, sub: "Moyenne des λi" },
          { label: "n",    val: consistency.n,          sub: "Nb critères" },
          { label: "CI",   val: consistency.CI,         sub: "(λmax−n)/(n−1)" },
          { label: "RI",   val: consistency.RI,         sub: "Table de Saaty" },
          { label: "CR",   val: consistency.CR,         sub: "CI / RI", highlight: true },
        ].map((s) => (
          <div
            key={s.label}
            className={`stat ${
              s.highlight ? (isOk ? "stat-ok" : "stat-err") : ""
            }`}
          >
            <span className="stat-label">{s.label}</span>
            <strong>{fmt4(s.val)}</strong>
            <span className="stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className={`cr-verdict ${isOk ? "ok" : "err"}`}>
        {isOk
          ? `✅ CR = ${consistency.CR} < 0.10 → Matrice COHÉRENTE`
          : `❌ CR = ${consistency.CR} ≥ 0.10 → Matrice INCOHÉRENTE — résultats indicatifs`}
      </div>

      <div className="ri-table">
        <p>
          <strong>Table des Index Aléatoires RI (Saaty) :</strong>
        </p>
        <table className="tbl">
          <thead>
            <tr>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <th key={n}>n={n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {[0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49].map(
                (v, i) => (
                  <td
                    key={i}
                    className={`mono ${
                      consistency.n === i + 1 ? "highlight-cell" : ""
                    }`}
                  >
                    {v}
                  </td>
                )
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {!isOk && consistency.inconsistent_pairs?.length > 0 && (
        <div className="incoherent-box">
          <h4>⚠️ Comparaisons les plus incohérentes :</h4>
          {consistency.inconsistent_pairs.map((p, i) => (
            <div key={i} className="pair">
              <strong>{p.crit_i}</strong> vs <strong>{p.crit_j}</strong> :
              vous avez saisi <em className="mono">{p.entered}</em>,
              les poids suggèrent <em className="mono">{p.expected}</em>
              <span className="ratio">(écart ×{p.ratio})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Génération HTML pour impression / export PDF ─────────────────────────────
function buildPrintHTML(result, criteria, alternatives, isOk) {
  const cnames  = criteria.map((c) => c.name);
  const barData = Object.entries(result.alternative_scores || {})
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score);

  const f = (v) => (typeof v === "number" ? v.toFixed(4) : v ?? "-");

  const ts  = `border-collapse:collapse;width:100%;margin-bottom:20px;font-size:12px;`;
  const th  = `border:1px solid #ccc;padding:7px 10px;background:#e8e8f8;color:#3730a3;text-align:center;`;
  const td  = `border:1px solid #ccc;padding:6px 10px;text-align:center;`;
  const tdH = `border:1px solid #ccc;padding:6px 10px;text-align:center;background:#f0f0ff;font-weight:bold;`;
  const sum = `border:1px solid #ccc;padding:6px 10px;text-align:center;background:#e8e8f8;font-weight:bold;`;
  const hl  = `border:1px solid #ccc;padding:6px 10px;text-align:center;background:#ede9fe;color:#4f46e5;font-weight:bold;`;
  const grn = `border:1px solid #ccc;padding:6px 10px;text-align:center;background:#d1fae5;color:#065f46;font-weight:bold;`;

  // 1. Matrice initiale
  let pairHTML = `<table style="${ts}"><thead><tr><th style="${th}"></th>`;
  cnames.forEach((c) => { pairHTML += `<th style="${th}">${c}</th>`; });
  pairHTML += `</tr></thead><tbody>`;
  cnames.forEach((row) => {
    pairHTML += `<tr><td style="${tdH}">${row}</td>`;
    cnames.forEach((col) => {
      pairHTML += `<td style="${td}">${f(result.pairwise_table?.[row]?.[col])}</td>`;
    });
    pairHTML += `</tr>`;
  });
  pairHTML += `<tr><td style="${sum}">Σ col</td>`;
  cnames.forEach((c) => { pairHTML += `<td style="${sum}">${f(result.col_sums?.[c])}</td>`; });
  pairHTML += `</tr></tbody></table>`;

  // 2. Matrice normalisée
  let normHTML = `<table style="${ts}"><thead><tr><th style="${th}"></th>`;
  cnames.forEach((c) => { normHTML += `<th style="${th}">${c}</th>`; });
  normHTML += `<th style="${hl}">Σ ligne</th><th style="${hl}">Poids (÷${cnames.length})</th></tr></thead><tbody>`;
  cnames.forEach((row) => {
    normHTML += `<tr><td style="${tdH}">${row}</td>`;
    cnames.forEach((col) => {
      normHTML += `<td style="${td}">${f(result.normalized_table?.[row]?.[col])}</td>`;
    });
    normHTML += `<td style="${hl}">${f(result.normalized_table?.[row]?.row_sum)}</td>`;
    normHTML += `<td style="${hl}">${f(result.criteria_weights?.[row])}</td></tr>`;
  });
  normHTML += `<tr><td style="${sum}">Σ col</td>`;
  cnames.forEach((c) => { normHTML += `<td style="${sum}">${f(result.normalized_col_sums?.[c])}</td>`; });
  normHTML += `<td style="${sum}">—</td>`;
  normHTML += `<td style="${sum}">${f(Object.values(result.criteria_weights || {}).reduce((a, b) => a + b, 0))}</td>`;
  normHTML += `</tr></tbody></table>`;

  // 3. Criteria weight somme
  const wst = result.consistency?.weight_sum_table;
  const lv  = result.consistency?.lambda_vector || [];
  let wstHTML = `<table style="${ts}"><thead><tr><th style="${th}">Critère</th>`;
  cnames.forEach((c) => {
    wstHTML += `<th style="${th}">${c}<br/><small>×w=${f(result.criteria_weights?.[c])}</small></th>`;
  });
  wstHTML += `<th style="${hl}">Σ ligne (AW)</th><th style="${hl}">Poids (W)</th><th style="${grn}">λ=AW/W</th>`;
  wstHTML += `</tr></thead><tbody>`;
  cnames.forEach((row, i) => {
    wstHTML += `<tr><td style="${tdH}">${row}</td>`;
    cnames.forEach((col) => {
      wstHTML += `<td style="${td}">${f(wst?.[row]?.[col])}</td>`;
    });
    wstHTML += `<td style="${hl}">${f(wst?.[row]?.row_sum)}</td>`;
    wstHTML += `<td style="${hl}">${f(result.criteria_weights?.[row])}</td>`;
    wstHTML += `<td style="${grn}">${f(lv[i])}</td></tr>`;
  });
  const lambdaMean = f(lv.reduce((a, b) => a + b, 0) / (lv.length || 1));
  wstHTML += `<tr><td style="${sum}">Σ / moy.</td>`;
  cnames.forEach(() => { wstHTML += `<td style="${sum}"></td>`; });
  wstHTML += `<td style="${sum}">—</td>`;
  wstHTML += `<td style="${sum}">${f(Object.values(result.criteria_weights || {}).reduce((a, b) => a + b, 0))}</td>`;
  wstHTML += `<td style="${grn}"><strong>${lambdaMean}</strong> = λmax</td></tr>`;
  wstHTML += `</tbody></table>`;

  // 4. Cohérence
  const cons = result.consistency;
  let consHTML = `<table style="${ts}"><thead><tr>
    <th style="${th}">λmax</th><th style="${th}">n</th>
    <th style="${th}">CI</th><th style="${th}">RI</th>
    <th style="${th}">CR</th>
  </tr></thead><tbody><tr>
    <td style="${td}">${f(cons.lambda_max)}</td>
    <td style="${td}">${cons.n}</td>
    <td style="${td}">${f(cons.CI)}</td>
    <td style="${td}">${f(cons.RI)}</td>
    <td style="${isOk
      ? "border:1px solid #ccc;padding:6px;text-align:center;background:#d1fae5;color:#065f46;font-weight:bold;"
      : "border:1px solid #ccc;padding:6px;text-align:center;background:#fee2e2;color:#991b1b;font-weight:bold;"
    }">${f(cons.CR)}</td>
  </tr></tbody></table>`;

  consHTML += `<p style="font-size:11px;margin-bottom:6px;"><strong>Table RI de Saaty :</strong></p>
  <table style="${ts}"><thead><tr>`;
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((n) => {
    consHTML += `<th style="${th}">n=${n}</th>`;
  });
  consHTML += `</tr></thead><tbody><tr>`;
  [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49].forEach((v, i) => {
    consHTML += `<td style="${cons.n === i + 1 ? hl : td}">${v}</td>`;
  });
  consHTML += `</tr></tbody></table>`;

  if (!isOk && cons.inconsistent_pairs?.length > 0) {
    consHTML += `<div style="background:#fff5f5;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-top:10px;">
      <p style="color:#dc2626;font-weight:bold;margin-bottom:8px;">⚠️ Comparaisons incohérentes :</p>`;
    cons.inconsistent_pairs.forEach((p) => {
      consHTML += `<p style="font-size:11px;margin-bottom:4px;">
        <strong>${p.crit_i}</strong> vs <strong>${p.crit_j}</strong> :
        saisi = ${p.entered}, suggéré = ${p.expected} (écart ×${p.ratio})
      </p>`;
    });
    consHTML += `</div>`;
  }

  // 5. Classement
  let rankHTML = `<table style="${ts}"><thead><tr>
    <th style="${th}">Rang</th><th style="${th}">Alternative</th>`;
  cnames.forEach((c) => {
    rankHTML += `<th style="${th}">${c}<br/><small>w=${f(result.criteria_weights?.[c])}</small></th>`;
  });
  rankHTML += `<th style="${th}">Score Total</th></tr></thead><tbody>`;
  barData.forEach((a, i) => {
    const bd    = result.alternative_breakdown?.[a.name] || {};
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
    const rowBg = i === 0 ? "background:#f0fdf4;" : "";
    rankHTML += `<tr style="${rowBg}">
      <td style="${td}">${medal}</td>
      <td style="${tdH}">${a.name}</td>`;
    cnames.forEach((c) => {
      rankHTML += `<td style="${td}">${f(bd[c]?.contribution)}</td>`;
    });
    rankHTML += `<td style="${i === 0 ? hl : td}"><strong>${f(a.score)}</strong></td></tr>`;
  });
  rankHTML += `</tbody></table>`;

  const statusBg    = isOk ? "#d1fae5" : "#fee2e2";
  const statusColor = isOk ? "#065f46" : "#991b1b";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Rapport AHP — MAAMOC KENGUIM RONEL</title>
  <style>
    body  { font-family: Arial, sans-serif; margin: 30px; color: #1e1e2e; font-size: 13px; }
    h1    { color: #4f46e5; text-align: center; margin-bottom: 4px; }
    h2    { color: #4f46e5; border-bottom: 2px solid #e0e0ff; padding-bottom: 4px;
            margin: 22px 0 10px; font-size: 14px; }
    .sub  { text-align: center; color: #888; margin-bottom: 4px; font-size: 12px; }
    .auth { text-align: center; color: #4f46e5; font-weight: bold;
            margin-bottom: 20px; font-size: 12px; }
    .banner { padding: 10px 16px; border-radius: 6px; font-weight: 600;
              margin-bottom: 18px; background: ${statusBg};
              color: ${statusColor}; font-size: 12px; }
    .footer { text-align: center; color: #aaa; font-size: 10px;
              margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
    @media print {
      body  { margin: 10mm; }
      table { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>📊 Rapport AHP — Analyse Multicritères</h1>
  <p class="sub">Généré le ${new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })}</p>
  <p class="auth">Auteur : MAAMOC KENGUIM RONEL &nbsp;|&nbsp; Matricule : 22T2942</p>

  <div class="banner">${result.message}</div>

  <h2>1. Matrice de comparaisons par paires</h2>
  ${pairHTML}

  <h2>2. Matrice normalisée (Σ lignes et colonnes)</h2>
  ${normHTML}

  <h2>3. Tableau Criteria Weight Somme — cellule(i,j) = initial[i][j] × poids[j]</h2>
  ${wstHTML}

  <h2>4. Vérification de la cohérence (CI, RI, CR)</h2>
  ${consHTML}

  <h2>5. Classement des alternatives${!isOk ? " (indicatif — matrice incohérente)" : ""}</h2>
  ${rankHTML}

  <div class="footer">
    Rapport généré par AHP Decision Tool &nbsp;·&nbsp;
    MAAMOC KENGUIM RONEL — Matricule 22T2942
  </div>
</body>
</html>`;
}