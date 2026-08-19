# LEVL BioAge & AI Bloodwork Integration: Technical & Scientific Specification

**Primary Scientific Reference**:  
Kwon D, Belsky DW, Levine ME, Klemera P, Doubal S, Cohen AA. *"BioAge: An R package for biological age calculation."* **Bioinformatics / GitHub**: [dayoonkwon/BioAge](https://github.com/dayoonkwon/BioAge).

---

## 1. Overview & Architectural Principles

The **LEVL BioAge Engine** extends the LEVL Protocols application with a production-ready bloodwork processing, biomarker normalization, and biological aging engine.

### Key Architectural Principles:
1. **Scientific Fidelity**: Implements published **PhenoAge**, **KDM Biological Age**, and **Homeostatic Dysregulation (HD)** models using pinned `dayoonkwon/BioAge@master` parameters derived from NHANES reference populations.
2. **AI-First Extraction**: Parses unstructured laboratory PDFs, screenshots, and phone photos using Gemini structured vision/document extraction. Minimal user review is required—only questionable extractions (< 0.70 confidence) are flagged.
3. **Raw Data Preservation**: Raw lab files, extracted values, original units, reference ranges, and lab flags are permanently stored separately from normalized values and model outputs. Raw data is never discarded.
4. **General Wellness Framing**: All user-facing interpretations use healthspan and longevity optimization language ("Optimal Longevity Zone", "Opportunity to Optimize"). Standard lab reference ranges and LEVL longevity optimization ranges are strictly distinguished.
5. **Direct LEVL Modality & Protocol Binding**: Biomarker opportunities (e.g., elevated ApoB, hs-CRP, HbA1c) dynamically query existing LEVL database assets (`modalities`, `protocols`, `outcomes`). Active user modalities are explicitly checked (`✓ Currently in Your Active Protocol`), and non-active modalities offer 1-tap addition.
6. **System-Specific Aging Framework**: Biomarkers and physiological tests are grouped into 8 intuitive biological systems:
   - **Heart / Cardiovascular**
   - **Brain / Cognitive & Neuromotor**
   - **Metabolic**
   - **Immune / Inflammatory**
   - **Kidney**
   - **Liver**
   - **Lung**
   - **Musculoskeletal**

---

## 2. BioAge Mathematical Models & Algorithms

### 2.1 Phenotypic Age (PhenoAge - Levine et al. 2018)
PhenoAge estimates biological age based on 10-year mortality hazard predicted from 9 blood biomarkers + chronological age:

**Required Biomarkers & Units**:
1. Albumin ($g/dL$)
2. Creatinine ($\mu mol/L$)
3. Glucose ($mmol/L$)
4. $\ln(\text{CRP})$ where CRP is in $mg/L$
5. Lymphocyte Percentage ($\%$)
6. Mean Corpuscular Volume ($MCV$ in $fL$)
7. Red Cell Distribution Width ($RDW$ in $\%$)
8. Alkaline Phosphatase ($ALP$ in $U/L$)
9. White Blood Cell Count ($WBC$ in $10^9/L$)

**Formulas**:
$$xb = -19.92 + 0.0336 \cdot \text{Age} - 0.0336 \cdot \text{Albumin} + 0.0095 \cdot \text{Creatinine} + 0.1953 \cdot \text{Glucose} + 0.0954 \cdot \ln(\text{CRP}) - 0.0120 \cdot \text{LymphPct} + 0.0268 \cdot \text{MCV} + 0.3306 \cdot \text{RDW} + 0.00188 \cdot \text{ALP} + 0.0554 \cdot \text{WBC}$$

$$M = 1 - \exp\left(-\exp(xb) \cdot \frac{\exp(0.00769 \cdot 120) - 1}{0.00769}\right)$$

$$\text{PhenoAge} = 141.5022 + \frac{\ln\left(-\frac{\ln(1 - M)}{0.00553}\right)}{0.090165}$$

---

### 2.2 Klemera-Doubal Method (KDM Biological Age)
KDM calculates a weighted minimum-variance linear projection of biological age from $k$ biomarker Z-scores using NHANES III baseline cohort regression parameters:

$$\text{BioAge}_{\text{KDM}} = \frac{\sum_{i=1}^k \frac{(x_i - q_i)}{k_i \cdot s_i^2} + \frac{\text{ChronAge}}{s_{\text{age}}^2}}{\sum_{i=1}^k \frac{1}{s_i^2} + \frac{1}{s_{\text{age}}^2}}$$

where $q_i$, $k_i$, and $s_i^2$ are the sex-stratified intercept, slope, and error variance of biomarker $i$ regressed on chronological age in NHANES reference data.

---

### 2.3 Homeostatic Dysregulation (HD - Cohen et al.)
HD measures total physiological deviation from a healthy young baseline population using the Mahalanobis distance $D_M$:

$$HD = (\mathbf{x} - \boldsymbol{\mu}_{\text{ref}})^T \boldsymbol{\Sigma}_{\text{ref}}^{-1} (\mathbf{x} - \boldsymbol{\mu}_{\text{ref}})$$

where $\boldsymbol{\mu}_{\text{ref}}$ and $\boldsymbol{\Sigma}_{\text{ref}}$ are the vector of biomarker means and covariance matrix of a healthy reference population (NHANES III young healthy cohort, ages 20–30).

---

## 3. Database Schema Architecture

### `user_lab_panels`
- `id` (uuid, primary key)
- `user_id` (text, foreign key)
- `collection_date` (date)
- `upload_date` (timestamp)
- `provider_name` (text)
- `source_files` (jsonb array of file paths / URLs)
- `bioage_outputs` (jsonb storing KDM, PhenoAge, HD scores and provenance)
- `created_at` (timestamp)

### `biomarker_measurements`
- `id` (uuid, primary key)
- `panel_id` (uuid, foreign key to `user_lab_panels`)
- `user_id` (text)
- `biomarker_id` (text, canonical ID e.g. `apob`, `hba1c`, `crp`, `albumin`)
- `raw_name` (text, original lab text)
- `raw_value` (numeric)
- `raw_unit` (text)
- `normalized_value` (numeric)
- `normalized_unit` (text)
- `lab_reference_range` (text)
- `lab_flag` (text, e.g. `normal`, `high`, `low`, `critical`)
- `extraction_confidence` (numeric 0.0 - 1.0)
- `user_corrected` (boolean)
- `collection_date` (date)
- `created_at` (timestamp)

---

## 4. Provenance & Reproducibility Metadata

Every BioAge calculation logs provenance data for auditable reproducibility:

```json
{
  "model_name": "BioAge-R-KDM",
  "bioage_commit": "dayoonkwon/BioAge@master",
  "calculated_at": "2026-08-07T11:50:00.000Z",
  "chronological_age": 34,
  "sex": "male",
  "biomarkers_used": ["albumin", "creatinine", "glucose", "crp", "lymph_pct", "mcv", "rdw", "alp", "wbc"],
  "missing_biomarkers": ["fev1"],
  "kdm_age": 31.2,
  "pheno_age": 29.7,
  "hd_score": 2.41
}
```
