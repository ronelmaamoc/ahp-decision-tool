// ============================================================
// AHP Decision Tool — API Client
// Auteur   : MAAMOC KENGUIM RONEL
// Matricule: 22T2942
// ============================================================

import axios from "axios";

const BASE = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api/ahp`
  : "http://localhost:8000/api/ahp";

export const computeAHP = (payload) =>
  axios.post(`${BASE}/compute/`, payload).then((r) => r.data);