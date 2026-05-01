import React, { useState } from "react";
import CriteriaStep    from "./components/CriteriaStep";
import AlternativesStep from "./components/AlternativesStep";
import PairwiseStep    from "./components/PairwiseStep";
import ResultStep      from "./components/ResultStep";
import "./App.css";

const STEPS = ["1. Critères", "2. Alternatives", "3. Matrice", "4. Résultats"];

export default function App() {
  const [step, setStep]               = useState(0);
  const [criteria, setCriteria]       = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [pairwise, setPairwise]       = useState([]);
  const [result, setResult]           = useState(null);

  const next = () => setStep(s => Math.min(s + 1, 3));
  const back = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎯 AHP — Aide à la Décision Multicritères</h1>
        <p>Analytical Hierarchy Process ·</p>
      </header>

      <div className="stepper">
        {STEPS.map((s, i) => (
          <div key={i} className={`step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
            <div className="step-dot">{i < step ? "✓" : i + 1}</div>
            <span>{s}</span>
            {i < STEPS.length - 1 && <div className="step-line" />}
          </div>
        ))}
      </div>

      <main>
        {step === 0 && <CriteriaStep    criteria={criteria} setCriteria={setCriteria} onNext={next} />}
        {step === 1 && <AlternativesStep criteria={criteria} alternatives={alternatives}
                          setAlternatives={setAlternatives} onNext={next} onBack={back} />}
        {step === 2 && <PairwiseStep    criteria={criteria} alternatives={alternatives}
                          pairwise={pairwise} setPairwise={setPairwise}
                          setResult={setResult} onNext={next} onBack={back} />}
        {step === 3 && <ResultStep      result={result} criteria={criteria}
                          alternatives={alternatives} onBack={back} />}
      </main>
    </div>
  );
}