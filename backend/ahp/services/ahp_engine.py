# ============================================================
# AHP Decision Tool — Backend Engine
# Auteur  : MAAMOC KENGUIM RONEL
# Matricule: 22T2942
# Description: Moteur de calcul AHP (Analytical Hierarchy
#              Process) — normalisation, poids critères,
#              tableau criteria weight somme, cohérence,
#              classement des alternatives.
# ============================================================

import numpy as np

RI_TABLE = {
    1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90,  5: 1.12,
    6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49
}

class AHPEngine:
    """
    Moteur AHP.
    Étapes :
      1. Normalisation de la matrice de comparaisons par paires
      2. Calcul du vecteur de priorité (poids des critères)
      3. Tableau criteria weight somme
         (matrice initiale × poids de la colonne)
      4. Calcul de λmax, CI, RI, CR → vérification cohérence
      5. Classement des alternatives (même si matrice incohérente)
    """

    def __init__(self, criteria, alternatives, pairwise_matrix):
        self.criteria     = criteria        # liste de dicts {name, is_categorical, ...}
        self.alternatives = alternatives    # liste de dicts {name, scores: {}}
        self.matrix       = np.array(pairwise_matrix, dtype=float)
        self.n            = len(criteria)

    # ----------------------------------------------------------
    # ÉTAPE 1 & 2 : Normalisation + vecteur de priorité
    #   - col_sums   : somme de chaque colonne du tableau initial
    #   - normalized : chaque cellule / somme de sa colonne
    #   - row_sums   : somme de chaque ligne du tableau normalisé
    #   - weights    : moyenne de chaque ligne = poids du critère
    # ----------------------------------------------------------
    def _compute_criteria_weights(self):
        col_sums   = self.matrix.sum(axis=0)
        normalized = self.matrix / col_sums
        row_sums   = normalized.sum(axis=1)
        weights    = normalized.mean(axis=1)
        return col_sums, normalized, row_sums, weights

    # ----------------------------------------------------------
    # ÉTAPE 3 & 4 : Tableau criteria weight somme + cohérence
    #
    #   Tableau criteria weight somme :
    #     cellule(i,j) = matrice_initiale[i][j] × poids[j]
    #     Σ ligne i    = weighted_sum[i]  (= matrice @ weights)
    #
    #   λi      = Σligne_i / poids_i
    #   λmax    = moyenne des λi
    #   CI      = (λmax - n) / (n - 1)
    #   CR      = CI / RI   →  cohérent si CR < 0.10
    # ----------------------------------------------------------
    def _compute_consistency(self, weights):
        # Σ pondérée = produit matrice × vecteur poids
        weighted_sum = self.matrix @ weights
        lambda_vec   = weighted_sum / weights
        lambda_max   = float(np.mean(lambda_vec))

        ci = (lambda_max - self.n) / (self.n - 1)
        ri = RI_TABLE.get(self.n, 1.49)
        cr = ci / ri if ri != 0 else 0.0

        # ── Tableau criteria weight somme ──────────────────────
        # cellule(i,j) = matrice_initiale[i][j] × poids[j]
        weight_sum_table = {}
        for i in range(self.n):
            row = {}
            for j in range(self.n):
                row[self.criteria[j]["name"]] = round(
                    float(self.matrix[i][j]) * float(weights[j]), 4
                )
            # Σ ligne = weighted_sum[i]
            row["row_sum"] = round(float(weighted_sum[i]), 4)
            weight_sum_table[self.criteria[i]["name"]] = row

        # ── Paires les plus incohérentes ───────────────────────
        inconsistent_pairs = []
        for i in range(self.n):
            for j in range(i + 1, self.n):
                expected = weights[i] / weights[j]
                actual   = self.matrix[i][j]
                ratio    = max(expected, actual) / min(expected, actual)
                if ratio > 1.5:
                    inconsistent_pairs.append({
                        "crit_i":   self.criteria[i]["name"],
                        "crit_j":   self.criteria[j]["name"],
                        "entered":  round(actual,   4),
                        "expected": round(expected, 4),
                        "ratio":    round(ratio,    4),
                    })
        inconsistent_pairs.sort(key=lambda x: x["ratio"], reverse=True)

        return {
            "weight_sum_table":    weight_sum_table,
            "weighted_sum_vector": [round(float(v), 4) for v in weighted_sum],
            "lambda_vector":       [round(float(v), 4) for v in lambda_vec],
            "lambda_max":          round(lambda_max, 4),
            "n":                   self.n,
            "CI":                  round(ci, 4),
            "RI":                  ri,
            "CR":                  round(cr, 4),
            "is_consistent":       cr < 0.10,
            "inconsistent_pairs":  inconsistent_pairs[:5],
        }

    # ----------------------------------------------------------
    # ÉTAPE 5 : Score de chaque alternative
    #   score = Σ ( poids_critère[i] × valeur_alternative[i] )
    #   Pour les critères catégoriels, la valeur est mappée
    #   via category_preferences {label → score numérique}.
    # ----------------------------------------------------------
    def _score_alternatives(self, weights):
        scores    = {}
        breakdown = {}
        for alt in self.alternatives:
            total  = 0.0
            detail = {}
            for i, crit in enumerate(self.criteria):
                raw = alt["scores"].get(crit["name"], 0)

                # Critère catégoriel → chercher la valeur numérique
                if crit.get("is_categorical") and crit.get("category_preferences"):
                    prefs   = crit["category_preferences"]
                    numeric = prefs.get(str(raw))
                    if numeric is None:
                        # Correspondance insensible à la casse
                        raw_lower = str(raw).lower()
                        numeric   = next(
                            (v for k, v in prefs.items() if k.lower() == raw_lower),
                            0
                        )
                    raw = float(numeric)
                else:
                    try:
                        raw = float(raw)
                    except (ValueError, TypeError):
                        raw = 0.0

                contribution = float(weights[i]) * raw
                detail[crit["name"]] = {
                    "raw_score":    raw,
                    "weight":       round(float(weights[i]), 4),
                    "contribution": round(contribution, 4),
                }
                total += contribution

            scores[alt["name"]]    = round(total, 4)
            breakdown[alt["name"]] = detail
        return scores, breakdown

    # ----------------------------------------------------------
    # ENTRÉE PRINCIPALE
    # ----------------------------------------------------------
    def run(self):
        n = self.n
        if self.matrix.shape != (n, n):
            raise ValueError(
                "La taille de la matrice ne correspond pas au nombre de critères."
            )

        # Étapes 1 & 2
        col_sums, normalized, row_sums, weights = self._compute_criteria_weights()

        # Étapes 3 & 4
        consistency = self._compute_consistency(weights)

        # Sommes des colonnes de la matrice normalisée
        norm_col_sums = normalized.sum(axis=0)

        # ── Tableau normalisé complet (avec Σ ligne et poids) ──
        normalized_table = {
            self.criteria[i]["name"]: {
                **{
                    self.criteria[j]["name"]: round(float(normalized[i][j]), 4)
                    for j in range(n)
                },
                "row_sum": round(float(row_sums[i]), 4),
            }
            for i in range(n)
        }

        normalized_col_sums = {
            self.criteria[j]["name"]: round(float(norm_col_sums[j]), 4)
            for j in range(n)
        }

        # ── Tableau initial ────────────────────────────────────
        pairwise_table = {
            self.criteria[i]["name"]: {
                self.criteria[j]["name"]: round(float(self.matrix[i][j]), 4)
                for j in range(n)
            }
            for i in range(n)
        }

        # ── Poids des critères ─────────────────────────────────
        criteria_weights = {
            self.criteria[i]["name"]: round(float(weights[i]), 4)
            for i in range(n)
        }

        col_sums_dict = {
            self.criteria[j]["name"]: round(float(col_sums[j]), 4)
            for j in range(n)
        }

        # Étape 5 — toujours calculer même si incohérent
        alt_scores, alt_breakdown = self._score_alternatives(weights)
        best = max(alt_scores, key=alt_scores.get)

        is_consistent = consistency["is_consistent"]

        if is_consistent:
            message = (
                f"✅ Matrice CONSISTANTE (CR={consistency['CR']:.4f} < 0.10). "
                f"Meilleur choix : {best}"
            )
        else:
            message = (
                f"⚠️ Matrice INCONSISTANTE (CR={consistency['CR']:.4f} ≥ 0.10). "
                f"Les résultats sont fournis à titre indicatif. "
                f"Meilleur choix suggéré : {best}"
            )

        return {
            "status":                "consistent" if is_consistent else "inconsistent",
            "pairwise_table":        pairwise_table,
            "col_sums":              col_sums_dict,
            "normalized_table":      normalized_table,
            "normalized_col_sums":   normalized_col_sums,
            "criteria_weights":      criteria_weights,
            "row_sums":              {
                self.criteria[i]["name"]: round(float(row_sums[i]), 4)
                for i in range(n)
            },
            "consistency":           consistency,
            "alternative_scores":    alt_scores,
            "alternative_breakdown": alt_breakdown,
            "best_alternative":      best,
            "message":               message,
        }