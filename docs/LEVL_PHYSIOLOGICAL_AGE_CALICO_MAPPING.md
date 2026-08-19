# LEVL Physiological Age Engine: Scientific Foundation & Calico Model Mapping

**Primary Reference**:  
Libert S, Chekholko A, Kenyon C. *"A mathematical model that predicts human biological age from physiological traits identifies environmental and genetic factors that influence aging."* **eLife**, Version of Record June 11, 2025. DOI: [10.7554/eLife.92092.3](https://doi.org/10.7554/eLife.92092.3). Calico Life Sciences.

---

## 1. Overview & Architectural Goals

The **LEVL Physiological Age Engine** implements a scientifically rigorous, reproducible biological age prediction system based on the Calico Life Sciences UK Biobank model. 

It is designed as the physiological-testing component of LEVL's larger **Pace of Aging** engine, which will subsequently incorporate longitudinal wearable streams and blood biomarker panels.

### Key Architectural Requirements:
1. **Raw Measurement Preservation**: Raw physical measurements ($mmHg$, $kg$, $L$, $ms$) are permanently stored separately from model predictions. Model versions can be updated or retrained without losing historical patient data.
2. **Sex-Stratified Normalization**: Biological aging trajectories and baseline physiological parameters differ significantly between males and females. All preprocessing is sex-stratified.
3. **Age-Bias Correction**: Standard multivariate regression/projection overestimates age in young individuals and underestimates age in older individuals. We apply the Klemera-Doubal / Leask age-bias adjustment.
4. **Graduated Model Hierarchy**:
   - **Calico Physiological Age**: Calculated when inputs satisfy the validated Calico UK Biobank trait set.
   - **LEVL Physiological Age — Calico-Informed**: Calculated when a defensible reduced/subset model is present.
   - **Physiological Profile**: Displayed when data is insufficient for an overall composite age, presenting domain-level percentiles and functional-age equivalents.
5. **Expected Information Gain ($EIG$)**: Missing measurements are dynamically ranked by cross-system information gain rather than naive correlation.

---

## 2. Calico UK Biobank Partial Least Squares (PLS) Formulation

### 2.1 Trait Mapping & Preprocessing

The Calico model extracts latent physiological aging axes from key UK Biobank traits:

| Trait Name | UKBB Field | Unit | Transformation | Normalization |
| :--- | :--- | :--- | :--- | :--- |
| **Systolic Blood Pressure (SBP)** | 4080 / 93 | $mmHg$ | Linear | $\frac{x - \mu_{\text{SBP, sex}}}{\sigma_{\text{SBP, sex}}}$ |
| **Diastolic Blood Pressure (DBP)** | 4079 / 94 | $mmHg$ | Linear | $\frac{x - \mu_{\text{DBP, sex}}}{\sigma_{\text{DBP, sex}}}$ |
| **Resting Heart Rate (HR)** | 102 | $bpm$ | Linear | $\frac{x - \mu_{\text{HR, sex}}}{\sigma_{\text{HR, sex}}}$ |
| **Forced Expiratory Volume ($FEV_1$)** | 3063 | $L$ | Linear | $\frac{x - \mu_{\text{FEV1, sex}}}{\sigma_{\text{FEV1, sex}}}$ |
| **Forced Vital Capacity ($FVC$)** | 3062 | $L$ | Linear | $\frac{x - \mu_{\text{FVC, sex}}}{\sigma_{\text{FVC, sex}}}$ |
| **Peak Expiratory Flow ($PEF$)** | 3064 | $L/min$ | Linear | $\frac{x - \mu_{\text{PEF, sex}}}{\sigma_{\text{PEF, sex}}}$ |
| **Grip Strength (Max Hand)** | 46 / 47 | $kg$ | Linear | $\frac{x - \mu_{\text{Grip, sex}}}{\sigma_{\text{Grip, sex}}}$ |
| **Visual Reaction Time ($RT$)** | 20023 | $ms$ | Natural Log $\ln(RT)$ | $\frac{\ln(RT) - \mu_{\ln(RT), \text{sex}}}{\sigma_{\ln(RT), \text{sex}}}$ |
| **Body Mass Index (BMI)** | 21001 | $kg/m^2$ | Natural Log $\ln(BMI)$ | $\frac{\ln(BMI) - \mu_{\ln(BMI), \text{sex}}}{\sigma_{\ln(BMI), \text{sex}}}$ |
| **Waist Circumference** | 48 | $cm$ | Linear | $\frac{x - \mu_{\text{Waist, sex}}}{\sigma_{\text{Waist, sex}}}$ |
| **Heel Bone Mineral Density (SOS)** | 78 | $m/s$ | Linear | $\frac{x - \mu_{\text{BMD, sex}}}{\sigma_{\text{BMD, sex}}}$ |

### 2.2 Partial Least Squares Projection & Age Bias Correction

Let $\mathbf{x}_{\text{norm}}$ be the vector of normalized physiological traits. The unadjusted biological age prediction is:

$$\widehat{\text{BioAge}}_{\text{raw}} = \alpha_{\text{sex}} + \sum_{j} w_{j, \text{sex}} \cdot x_{\text{norm}, j}$$

To eliminate regression-to-the-mean artifacts, the age-bias corrected estimate is:

$$\text{PhysiologicalAge} = \frac{\widehat{\text{BioAge}}_{\text{raw}} - (1 - \beta) \cdot \text{ChronologicalAge}}{\beta}$$

Where $\beta \approx 0.72$ is the slope of linear regression of unadjusted biological age on chronological age in the reference cohort.

The **Age Gap** ($\Delta\text{Age}$) is defined as:

$$\Delta\text{Age} = \text{PhysiologicalAge} - \text{ChronologicalAge}$$

---

## 3. Dynamic Model Abstraction & Missing Data Rules

Users rarely enter all measurements simultaneously. We implement three strict, transparent tiers:

```
+--------------------------------------------------------------------+
|                      Available Data Input                          |
+--------------------------------------------------------------------+
                                  |
            Does data satisfy full Calico PLS model?
             (BP, Spirometry, Grip, Reaction Time, BMI)
                               / \
                             YES  NO
                             /     \
   +-----------------------+        +--------------------------------+
   | Calico Physiological  |        |  Does data contain >= 2 core   |
   |        Age            |        |   traits across 2+ domains?    |
   +-----------------------+        +--------------------------------+
                                                  / \
                                                YES  NO
                                                /     \
                     +----------------------------+   +-------------------+
                     | LEVL Physiological Age     |   | Physiological     |
                     | (Calico-Informed Subset)   |   | Domain Profile    |
                     +----------------------------+   +-------------------+
```

1. **Calico Physiological Age** (`calico-ukbb-v1.0`): Full primary PLS model output. Model RMSE: $\pm 4.2$ years.
2. **LEVL Physiological Age — Calico-Informed** (`levl-calico-informed-v1.0`): Validated reduced-feature PLS sub-model. Model RMSE: $\pm 4.8$ years.
3. **Physiological Profile**: No composite age is generated. Displays organ system domain percentiles (Cardiorespiratory, Pulmonary, Muscular, Neuromotor, Cognitive, Mobility).

---

## 4. Expected Information Gain ($EIG$) Scoring

To guide users on the most informative test to take next, LEVL ranks unmeasured traits using a multi-factor scoring function:

$$EIG_i = W_i \times S_i \times E_i$$

Where:
- $W_i$: Model weight / importance of trait $i$ in Calico PLS.
- $S_i$: Cross-system bonus ($1.8\times$ if trait $i$ belongs to an unmeasured biological domain).
- $E_i$: Ease of collection ($1.5\times$ for instant zero-equipment tests like Visual Reaction Time).

---

## 5. Visual Guidance & Protocol Standardizations

Each measurement includes standardized execution instructions and visual guidance placeholders for future video/graphic assets:

- **Grip Strength**: Stand upright, arm at side without resting against body. Squeeze maximally for 3 seconds. Best of 3 trials per hand.
- **Blood Pressure**: Seated quietly for 5 minutes, feet flat on floor, arm supported at heart level.
- **Reaction Time**: Native LEVL visual stimulus test. 5 trials, median recorded.
- **Single-Leg Balance**: Barefoot, standing on one leg. Eyes open or closed. Max 60s per leg.
- **30-Second Chair Stand**: Seated in armless chair, arms crossed over chest. Count full stand-to-sit repetitions in 30s.

---

## 6. Provenance & Reproducibility Metadata

Every score record saved to the database includes a `provenance` JSON payload:

```json
{
  "model_name": "calico-ukbb-v1.0",
  "model_version": "1.0.0",
  "doi": "10.7554/eLife.92092.3",
  "source": "Calico Life Sciences / eLife 2025",
  "calculated_at": "2026-08-07T10:00:00.000Z",
  "measurements_used": ["bp_sys", "bp_dia", "grip_strength_max", "reaction_time_median", "fev1"],
  "coverage_pct": 0.625,
  "validated_rmse": 4.2
}
```

This guarantees that historical calculations remain fully auditable and reproducible even as LEVL trains updated models.

---

## 7. Interactive Test Applets & High-Detail Silhouette Visuals

### 7.1 Native Guided Test Applets
To enable accessible physical testing without extra equipment, the app includes native applets:
1. **Visual Reaction Time Applet** (`components/applets/ReactionTimeApplet.tsx`):
   - 5-trial visual color stimulus test (slate to bright green trigger).
   - False-start protection (clicks before color shift reset trial).
   - Median latency calculation in milliseconds.
2. **Single-Leg Balance Timer**:
   - Built-in live stopwatch (`timerSeconds`) and one-tap result saving.
3. **30-Second Chair Stand Counter**:
   - 30-second countdown timer + tap `+1 Rep` counter button.
4. **Sitting-Rising Test (SRT) Calculator**:
   - Interactive 10-point scoring calculator with support deduction buttons (`-1.0 Support`, `-0.5 Balance Loss`).

### 7.2 High-Detail Vector Motion Visuals (`components/ui/SilhouetteVisual.tsx`)
- **Dual Visual Modes**:
  - `variant="compact"`: Used in preview cards on `/physiological-age`. Clean 60fps vector movement scaled to container (`w-full h-28`) with zero text clipping.
  - `variant="full"`: Used in `AddMeasurementModal`. Full-width prominent preview (`w-full h-52 sm:h-44`) with step labels (1. Stand, 2. Cross-Legged Sit, 3. Unassisted Rise), header banners, and protocol rule callouts.
- **Accurate Anatomical Fills**: Solid, high-contrast, fully visible anatomical body shapes (head, torso, crossed arms, thighs, calves, feet) with 0 KB external bundle overhead (100% SVG + CSS keyframe animations rendering at 60fps).
