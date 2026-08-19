import { BiomarkerDefinition, BiologicalSystem } from './bioAgeTypes'

export const BIOMARKER_REGISTRY: Record<string, BiomarkerDefinition> = {
  // --- IMMUNE / INFLAMMATORY ---
  crp: {
    id: 'crp',
    name: 'C-Reactive Protein (hs-CRP)',
    canonical_aliases: ['crp', 'hscrp', 'hs-crp', 'c-reactive protein', 'high sensitivity c-reactive protein', 'c reactive protein', 'hs crp'],
    primary_unit: 'mg/L',
    supported_units: ['mg/L', 'mg/dL'],
    system: 'immune',
    secondary_systems: ['cardiovascular'],
    standard_lab_range: { min: 0, max: 3.0, unit: 'mg/L', display: '0 - 3.0 mg/L' },
    levl_optimal_zone: { min: 0, max: 0.5, unit: 'mg/L', display: '< 0.5 mg/L', longevity_rationale: 'Minimal systemic inflammation is linked to lower vascular wear and cellular senescence.' },
    study_citation: 'Levine ME et al. Aging Cell 2018; Ridker PM et al. N Engl J Med 2017',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/29676998/',
    bioage_model_usage: { phenoage: true, kdm: true, hd: true },
    description: 'Acute-phase reactant synthesized by the liver in response to inflammatory cytokines.',
    longevity_importance: 'Primary biomarker for systemic inflammation and cardiovascular aging risk.',
    conversion_to_canonical: (val, unit) => unit.toLowerCase() === 'mg/dl' ? val * 10 : val
  },
  wbc: {
    id: 'wbc',
    name: 'White Blood Cell Count (WBC)',
    canonical_aliases: ['wbc', 'white blood cell', 'white blood cell count', 'leukocyte count', 'wbc count'],
    primary_unit: '10^9/L',
    supported_units: ['10^9/L', 'k/ul', '10^3/ul', '/ul'],
    system: 'immune',
    standard_lab_range: { min: 4.5, max: 11.0, unit: '10^9/L', display: '4.5 - 11.0 k/uL' },
    levl_optimal_zone: { min: 4.0, max: 6.0, unit: '10^9/L', display: '4.0 - 6.0 k/uL', longevity_rationale: 'Lower baseline WBC within normal limits indicates low systemic inflammatory signaling.' },
    study_citation: 'Levine ME et al. PhenoAge Gompertz Hazard Cohort, Aging Cell 2018',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/29676998/',
    bioage_model_usage: { phenoage: true, kdm: true, hd: true },
    description: 'Total concentration of circulating immune cells.',
    longevity_importance: 'Key component of Levine PhenoAge and homeostatic dysregulation.'
  },
  lymph_pct: {
    id: 'lymph_pct',
    name: 'Lymphocyte Percentage',
    canonical_aliases: ['lymph_pct', 'lymphocyte %', 'lymphocytes %', 'lymphocyte percentage', 'lymph %', 'lymphocytes percentage'],
    primary_unit: '%',
    supported_units: ['%'],
    system: 'immune',
    standard_lab_range: { min: 20, max: 40, unit: '%', display: '20 - 40 %' },
    levl_optimal_zone: { min: 25, max: 35, unit: '%', display: '25 - 35 %', longevity_rationale: 'Preserved adaptive lymphocyte pool reflects robust immune capacity against infections and senescence.' },
    study_citation: 'Belsky DW et al. PNAS 2015; Levine ME et al. Aging Cell 2018',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/26150497/',
    bioage_model_usage: { phenoage: true, kdm: true, hd: true },
    description: 'Percentage of total white blood cells consisting of adaptive T, B, and NK lymphocytes.',
    longevity_importance: 'Monitors immunosenescence and immune system composition.'
  },
  rdw: {
    id: 'rdw',
    name: 'Red Cell Distribution Width (RDW)',
    canonical_aliases: ['rdw', 'rdw-cv', 'red cell distribution width', 'rdw_cv', 'red blood cell distribution width'],
    primary_unit: '%',
    supported_units: ['%'],
    system: 'immune',
    secondary_systems: ['cardiovascular'],
    standard_lab_range: { min: 11.5, max: 14.5, unit: '%', display: '11.5 - 14.5 %' },
    levl_optimal_zone: { min: 11.5, max: 12.5, unit: '%', display: '< 12.5 %', longevity_rationale: 'Low RDW reflects uniform red blood cell sizing, associated with optimal erythropoiesis and low inflammation.' },
    study_citation: 'Patel KV et al. Arch Intern Med 2009; Levine ME et al. 2018',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/19273781/',
    bioage_model_usage: { phenoage: true, kdm: true, hd: true },
    description: 'Variation in red blood cell volume and size.',
    longevity_importance: 'Strong independent predictor of all-cause mortality and biological aging.'
  },

  // --- LIVER & PROTEIN ---
  albumin: {
    id: 'albumin',
    name: 'Serum Albumin',
    canonical_aliases: ['albumin', 'serum albumin', 'alb'],
    primary_unit: 'g/dL',
    supported_units: ['g/dL', 'g/L'],
    system: 'liver',
    secondary_systems: ['immune', 'metabolic'],
    standard_lab_range: { min: 3.5, max: 5.2, unit: 'g/dL', display: '3.5 - 5.2 g/dL' },
    levl_optimal_zone: { min: 4.5, max: 5.2, unit: 'g/dL', display: '4.5 - 5.2 g/dL', longevity_rationale: 'High normal albumin reflects robust hepatic protein synthesis and low systemic oxidative stress.' },
    study_citation: 'Schalk BW et al. J Am Geriatr Soc 2006; Levine ME et al. 2018',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/29676998/',
    bioage_model_usage: { phenoage: true, kdm: true, hd: true },
    description: 'Abundant circulating plasma protein produced by hepatic parenchymal cells.',
    longevity_importance: 'Inverse marker of mortality and systemic inflammatory degradation.',
    conversion_to_canonical: (val, unit) => unit.toLowerCase() === 'g/l' ? val / 10 : val
  },
  alp: {
    id: 'alp',
    name: 'Alkaline Phosphatase (ALP)',
    canonical_aliases: ['alp', 'alkaline phosphatase', 'alk phos'],
    primary_unit: 'U/L',
    supported_units: ['U/L', 'IU/L'],
    system: 'liver',
    secondary_systems: ['musculoskeletal'],
    standard_lab_range: { min: 44, max: 147, unit: 'U/L', display: '44 - 147 U/L' },
    levl_optimal_zone: { min: 45, max: 70, unit: 'U/L', display: '45 - 70 U/L', longevity_rationale: 'Optimal ALP indicates healthy liver biliary clearance and balanced bone turnover.' },
    study_citation: 'Kwon D et al. BioAge NHANES III Model, Bioinformatics 2019',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/30843444/',
    bioage_model_usage: { phenoage: true, kdm: true, hd: true },
    description: 'Enzyme involved in biliary tract function and bone mineralization.',
    longevity_importance: 'Key hepatic and musculoskeletal biomarker in PhenoAge and KDM.'
  },
  alt: {
    id: 'alt',
    name: 'Alanine Aminotransferase (ALT)',
    canonical_aliases: ['alt', 'sgpt', 'alanine aminotransferase', 'alanine transaminase'],
    primary_unit: 'U/L',
    supported_units: ['U/L', 'IU/L'],
    system: 'liver',
    standard_lab_range: { min: 7, max: 56, unit: 'U/L', display: '7 - 56 U/L' },
    levl_optimal_zone: { min: 10, max: 25, unit: 'U/L', display: '10 - 25 U/L', longevity_rationale: 'Low ALT indicates absence of hepatic steatosis or intracellular hepatocellular injury.' },
    study_citation: 'Ruhl CE & Everhart JE. Gastroenterology 2012',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/22643349/',
    bioage_model_usage: { phenoage: false, kdm: true, hd: true },
    description: 'Hepatocellular enzyme released during hepatic stress or cell membrane disruption.',
    longevity_importance: 'Essential liver enzyme for metabolic health assessment.'
  },
  ast: {
    id: 'ast',
    name: 'Aspartate Aminotransferase (AST)',
    canonical_aliases: ['ast', 'sgot', 'aspartate aminotransferase', 'aspartate transaminase'],
    primary_unit: 'U/L',
    supported_units: ['U/L', 'IU/L'],
    system: 'liver',
    standard_lab_range: { min: 8, max: 33, unit: 'U/L', display: '8 - 33 U/L' },
    levl_optimal_zone: { min: 10, max: 25, unit: 'U/L', display: '10 - 25 U/L', longevity_rationale: 'Optimal AST reflects healthy mitochondrial hepatic and cardiac cell integrity.' },
    study_citation: 'Sookoian S & Pirola CJ. Hepatology 2015',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/25529816/',
    bioage_model_usage: { phenoage: false, kdm: false, hd: true },
    description: 'Mitochondrial and cytosolic enzyme found in hepatic and muscular tissues.',
    longevity_importance: 'Complementary liver and tissue strain marker.'
  },

  // --- KIDNEY ---
  creatinine: {
    id: 'creatinine',
    name: 'Serum Creatinine',
    canonical_aliases: ['creatinine', 'serum creatinine', 'creat'],
    primary_unit: 'mg/dL',
    supported_units: ['mg/dL', 'umol/L', 'µmol/L'],
    system: 'kidney',
    secondary_systems: ['musculoskeletal'],
    standard_lab_range: { min: 0.7, max: 1.3, unit: 'mg/dL', display: '0.7 - 1.3 mg/dL' },
    levl_optimal_zone: { min: 0.7, max: 1.0, unit: 'mg/dL', display: '0.7 - 1.0 mg/dL', longevity_rationale: 'Optimal creatinine reflects efficient glomerular filtration without muscular wasting or renal stress.' },
    study_citation: 'Inker GJ et al. CKD-EPI 2021, N Engl J Med 2021; Levine ME 2018',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/34550777/',
    bioage_model_usage: { phenoage: true, kdm: true, hd: true },
    description: 'Metabolic breakdown product of creatine phosphate filtering through renal glomeruli.',
    longevity_importance: 'Primary biomarker for renal filtration capacity and muscular turnover.',
    conversion_to_canonical: (val, unit) => (unit.toLowerCase().includes('umol') || unit.toLowerCase().includes('µmol')) ? val / 88.4 : val
  },
  egfr: {
    id: 'egfr',
    name: 'Estimated Glomerular Filtration Rate (eGFR)',
    canonical_aliases: ['egfr', 'egfr_ckd_epi', 'egfr (ckd-epi)', 'estimated gfr', 'gfr'],
    primary_unit: 'mL/min/1.73m2',
    supported_units: ['mL/min/1.73m2', 'mL/min'],
    system: 'kidney',
    standard_lab_range: { min: 60, max: 120, unit: 'mL/min/1.73m2', display: '> 60 mL/min/1.73m2' },
    levl_optimal_zone: { min: 90, max: 120, unit: 'mL/min/1.73m2', display: '> 90 mL/min/1.73m2', longevity_rationale: 'Preserved eGFR indicates youthful renal microvascular filtration reserve.' },
    study_citation: 'Inker GJ et al. CKD-EPI 2021, N Engl J Med 2021',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/34550777/',
    bioage_model_usage: { phenoage: false, kdm: true, hd: true },
    description: 'Calculated measure of kidney filtering capacity per surface area.',
    longevity_importance: 'Gold standard index of renal longevity and microvascular integrity.'
  },

  // --- METABOLIC ---
  glucose: {
    id: 'glucose',
    name: 'Fasting Serum Glucose',
    canonical_aliases: ['glucose', 'fasting glucose', 'serum glucose', 'fbg', 'fasting blood sugar'],
    primary_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    system: 'metabolic',
    standard_lab_range: { min: 70, max: 99, unit: 'mg/dL', display: '70 - 99 mg/dL' },
    levl_optimal_zone: { min: 75, max: 88, unit: 'mg/dL', display: '75 - 88 mg/dL', longevity_rationale: 'Tightly controlled fasting glucose prevents advanced glycation end-products (AGEs).' },
    study_citation: 'Selvin E et al. ARIC Study, N Engl J Med 2010; Attia P. Outlive 2023',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/20200384/',
    bioage_model_usage: { phenoage: true, kdm: true, hd: true },
    description: 'Concentration of free circulating blood glucose following overnight fast.',
    longevity_importance: 'Core metabolic biomarker in PhenoAge, KDM, and HD.',
    conversion_to_canonical: (val, unit) => unit.toLowerCase() === 'mmol/l' ? val * 18.018 : val
  },
  hba1c: {
    id: 'hba1c',
    name: 'Hemoglobin A1c (HbA1c)',
    canonical_aliases: ['hba1c', 'a1c', 'glycated hemoglobin', 'hemoglobin a1c'],
    primary_unit: '%',
    supported_units: ['%', 'mmol/mol'],
    system: 'metabolic',
    standard_lab_range: { min: 4.0, max: 5.6, unit: '%', display: '4.0 - 5.6 %' },
    levl_optimal_zone: { min: 4.8, max: 5.3, unit: '%', display: '4.8 - 5.3 %', longevity_rationale: 'HbA1c below 5.3% reflects excellent 90-day glycemic stability and low protein glycation.' },
    study_citation: 'Selvin E et al. N Engl J Med 2010; UKPDS Group Lancet 1998',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/20200384/',
    bioage_model_usage: { phenoage: false, kdm: true, hd: true, calico: false },
    description: 'Percentage of hemoglobin molecules bound to glucose over red blood cell lifespan (~120 days).',
    longevity_importance: 'Gold standard measure of long-term glycemic control and metabolic aging.'
  },
  mcv: {
    id: 'mcv',
    name: 'Mean Corpuscular Volume (MCV)',
    canonical_aliases: ['mcv', 'mean corpuscular volume'],
    primary_unit: 'fL',
    supported_units: ['fL'],
    system: 'metabolic',
    secondary_systems: ['immune'],
    standard_lab_range: { min: 80, max: 100, unit: 'fL', display: '80 - 100 fL' },
    levl_optimal_zone: { min: 85, max: 92, unit: 'fL', display: '85 - 92 fL', longevity_rationale: 'Optimal MCV reflects adequate B12/folate status and balanced red blood cell maturation.' },
    study_citation: 'Levine ME et al. PhenoAge Model 2018; Belsky DW et al. PNAS 2015',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/29676998/',
    bioage_model_usage: { phenoage: true, kdm: true, hd: true },
    description: 'Average physical volume of red blood cells.',
    longevity_importance: 'PhenoAge component reflecting red cell membrane dynamics.'
  },

  // --- CARDIOVASCULAR ---
  apob: {
    id: 'apob',
    name: 'Apolipoprotein B (ApoB)',
    canonical_aliases: ['apob', 'apo b', 'apolipoprotein b', 'apolipoprotein b100', 'apo-b'],
    primary_unit: 'mg/dL',
    supported_units: ['mg/dL', 'g/L'],
    system: 'cardiovascular',
    standard_lab_range: { min: 60, max: 130, unit: 'mg/dL', display: '< 100 mg/dL' },
    levl_optimal_zone: { min: 40, max: 70, unit: 'mg/dL', display: '< 70 mg/dL', longevity_rationale: 'Low ApoB minimizes atherogenic particle concentration entering vascular endothelial walls.' },
    study_citation: 'Sniderman AD et al. JAMA Cardiol 2019; Allan A & Krauss RM. Circulation 2020',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/31339930/',
    bioage_model_usage: { phenoage: false, kdm: false, hd: true },
    description: 'Direct measurement of total concentration of atherogenic lipoprotein particles (LDL, VLDL, IDL).',
    longevity_importance: 'Single strongest lipid driver of atherosclerotic cardiovascular disease longevity risk.',
    conversion_to_canonical: (val, unit) => unit.toLowerCase() === 'g/l' ? val * 100 : val
  },
  ldl: {
    id: 'ldl',
    name: 'LDL Cholesterol',
    canonical_aliases: ['ldl', 'ldl-c', 'ldl cholesterol', 'low density lipoprotein'],
    primary_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    system: 'cardiovascular',
    standard_lab_range: { min: 0, max: 130, unit: 'mg/dL', display: '< 100 mg/dL' },
    levl_optimal_zone: { min: 40, max: 70, unit: 'mg/dL', display: '< 70 mg/dL', longevity_rationale: 'Minimal circulating LDL cholesterol slows arterial wall lipid deposition.' },
    study_citation: 'Ference BA et al. Eur Heart J 2017 (Mendelian Randomization Cohort)',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/28444290/',
    bioage_model_usage: { phenoage: false, kdm: true, hd: true },
    description: 'Cholesterol content contained within low-density lipoproteins.',
    longevity_importance: 'Standard lipid panel biomarker for vascular risk.'
  },
  hdl: {
    id: 'hdl',
    name: 'HDL Cholesterol',
    canonical_aliases: ['hdl', 'hdl-c', 'hdl cholesterol', 'high density lipoprotein'],
    primary_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    system: 'cardiovascular',
    standard_lab_range: { min: 40, max: 100, unit: 'mg/dL', display: '> 40 mg/dL' },
    levl_optimal_zone: { min: 50, max: 80, unit: 'mg/dL', display: '50 - 80 mg/dL', longevity_rationale: 'Optimal HDL supports reverse cholesterol transport without dysfunctional hyper-HDL states.' },
    study_citation: 'Emerging Risk Factors Collaboration. JAMA 2009',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/19903920/',
    bioage_model_usage: { phenoage: false, kdm: true, hd: true },
    description: 'Cholesterol contained within high-density lipoproteins participating in reverse transport.',
    longevity_importance: 'Vascular transport biomarker.'
  },
  triglycerides: {
    id: 'triglycerides',
    name: 'Triglycerides',
    canonical_aliases: ['triglycerides', 'trig', 'trigs', 'serum triglycerides'],
    primary_unit: 'mg/dL',
    supported_units: ['mg/dL', 'mmol/L'],
    system: 'cardiovascular',
    secondary_systems: ['metabolic'],
    standard_lab_range: { min: 0, max: 150, unit: 'mg/dL', display: '< 150 mg/dL' },
    levl_optimal_zone: { min: 40, max: 85, unit: 'mg/dL', display: '< 85 mg/dL', longevity_rationale: 'Low triglycerides reflect efficient muscular fatty acid clearance and minimal hepatic fat secretion.' },
    study_citation: 'Nordestgaard BG. Lancet Diabetes Endocrinol 2016',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/26915676/',
    bioage_model_usage: { phenoage: false, kdm: true, hd: true },
    description: 'Circulating lipid ester molecules transporting energy to adipose and muscle cells.',
    longevity_importance: 'Key cardiovascular and metabolic health marker.'
  },

  // --- SPECIALTY / HORMONAL / ADVANCED LAB MARKERS ---
  testosterone: {
    id: 'testosterone',
    name: 'Total Testosterone',
    canonical_aliases: ['testosterone', 'total testosterone', 'serum testosterone', 'testosterone total', 't_total'],
    primary_unit: 'ng/dL',
    supported_units: ['ng/dL', 'nmol/L'],
    system: 'musculoskeletal',
    secondary_systems: ['metabolic', 'brain'],
    standard_lab_range: { min: 250, max: 1000, unit: 'ng/dL', display: '250 - 1000 ng/dL' },
    levl_optimal_zone: { min: 550, max: 900, unit: 'ng/dL', display: '550 - 900 ng/dL', longevity_rationale: 'Optimal testosterone maintains lean muscular mass, bone mineral density, cognitive vitality, and metabolic insulin sensitivity.' },
    study_citation: 'Bhasin S et al. J Clin Endocrinol Metab 2018; Yeap BB et al. Ann Intern Med 2024',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/29562364/',
    bioage_model_usage: { phenoage: false, kdm: false, hd: false },
    description: 'Primary androgenic steroid hormone regulating lean tissue synthesis, muscle mass, and libido.',
    longevity_importance: 'Crucial endocrine biomarker for healthspan, muscle retention, and metabolic health.'
  },
  free_testosterone: {
    id: 'free_testosterone',
    name: 'Free Testosterone',
    canonical_aliases: ['free testosterone', 'free t', 'unbound testosterone', 'testosterone free'],
    primary_unit: 'pg/mL',
    supported_units: ['pg/mL', 'pmol/L', 'ng/dL'],
    system: 'musculoskeletal',
    secondary_systems: ['metabolic'],
    standard_lab_range: { min: 8.7, max: 25.1, unit: 'pg/mL', display: '8.7 - 25.1 pg/mL' },
    levl_optimal_zone: { min: 15.0, max: 25.0, unit: 'pg/mL', display: '15 - 25 pg/mL', longevity_rationale: 'Unbound bioactive testosterone available to cell receptors for muscle hypertrophy and mitochondrial signaling.' },
    study_citation: 'Bhasin S et al. Endocrine Society Guidelines 2018',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/29562364/',
    bioage_model_usage: { phenoage: false, kdm: false, hd: false },
    description: 'Unbound fraction of circulating testosterone available for cellular tissue uptake.',
    longevity_importance: 'Direct index of bioavailable androgenic signaling.'
  },
  shbg: {
    id: 'shbg',
    name: 'Sex Hormone Binding Globulin (SHBG)',
    canonical_aliases: ['shbg', 'sex hormone binding globulin'],
    primary_unit: 'nmol/L',
    supported_units: ['nmol/L'],
    system: 'metabolic',
    standard_lab_range: { min: 16.5, max: 55.9, unit: 'nmol/L', display: '16.5 - 55.9 nmol/L' },
    levl_optimal_zone: { min: 30, max: 60, unit: 'nmol/L', display: '30 - 60 nmol/L', longevity_rationale: 'Optimal SHBG balances free hormone bio-availability without excessive hepatic binding.' },
    study_citation: 'Goldman AL et al. J Clin Endocrinol Metab 2017',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/28323972/',
    bioage_model_usage: { phenoage: false, kdm: false, hd: false },
    description: 'Glycoprotein produced by the liver that binds and regulates sex steroids in circulation.',
    longevity_importance: 'Hormonal transport carrier and metabolic regulator.'
  },
  dhea_s: {
    id: 'dhea_s',
    name: 'DHEA-Sulfate (DHEA-S)',
    canonical_aliases: ['dhea', 'dhea-s', 'dheas', 'dhea sulfate', 'dehydroepiandrosterone sulfate'],
    primary_unit: 'ug/dL',
    supported_units: ['ug/dL', 'umol/L', 'µg/dL'],
    system: 'immune',
    secondary_systems: ['brain', 'musculoskeletal'],
    standard_lab_range: { min: 80, max: 560, unit: 'ug/dL', display: '80 - 560 ug/dL' },
    levl_optimal_zone: { min: 250, max: 450, unit: 'ug/dL', display: '250 - 450 ug/dL', longevity_rationale: 'Youthful DHEA-S supports adrenal steroid production, immune cell function, and neuroprotection.' },
    study_citation: 'Maggi M et al. Front Endocrinol 2021; Baltimore Longitudinal Study of Aging',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/34122340/',
    bioage_model_usage: { phenoage: false, kdm: false, hd: false },
    description: 'Most abundant circulating steroid pro-hormone secreted by the adrenal cortex.',
    longevity_importance: 'Classic endocrine biomarker of adrenal aging resilience.'
  },
  vitamin_d: {
    id: 'vitamin_d',
    name: '25-Hydroxy Vitamin D',
    canonical_aliases: ['vitamin d', 'vit d', '25-oh vitamin d', '25-hydroxyvitamin d', 'calcidiol', 'vitamin d3'],
    primary_unit: 'ng/mL',
    supported_units: ['ng/mL', 'nmol/L'],
    system: 'immune',
    secondary_systems: ['musculoskeletal', 'metabolic'],
    standard_lab_range: { min: 30, max: 100, unit: 'ng/mL', display: '30 - 100 ng/mL' },
    levl_optimal_zone: { min: 50, max: 80, unit: 'ng/mL', display: '50 - 80 ng/mL', longevity_rationale: 'Optimal 25-OH Vitamin D activates genomic transcription for antimicrobial peptides, calcium absorption, and innate immune defense.' },
    study_citation: 'Holick MF et al. Endocrine Society Guidelines 2011; VITAL Study NEJM 2019',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/21646368/',
    bioage_model_usage: { phenoage: false, kdm: false, hd: false },
    description: 'Circulating pre-hormone status indicator for vitamin D endocrine signaling.',
    longevity_importance: 'Immune modulation, calcium homeostasis, and gene transcription driver.',
    conversion_to_canonical: (val, unit) => unit.toLowerCase() === 'nmol/l' ? val / 2.496 : val
  },
  fasting_insulin: {
    id: 'fasting_insulin',
    name: 'Fasting Insulin',
    canonical_aliases: ['fasting insulin', 'serum insulin', 'insulin fasting', 'insulin'],
    primary_unit: 'uIU/mL',
    supported_units: ['uIU/mL', 'pmol/L', 'µIU/mL'],
    system: 'metabolic',
    standard_lab_range: { min: 2.6, max: 24.9, unit: 'uIU/mL', display: '2.6 - 24.9 uIU/mL' },
    levl_optimal_zone: { min: 2.0, max: 6.0, unit: 'uIU/mL', display: '< 6.0 uIU/mL', longevity_rationale: 'Low fasting insulin indicates high systemic insulin sensitivity years before glucose elevations appear.' },
    study_citation: 'Facchini FS et al. J Clin Endocrinol Metab 2001; Attia P. Outlive 2023',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/11549643/',
    bioage_model_usage: { phenoage: false, kdm: false, hd: false },
    description: 'Pancreatic beta-cell peptide hormone regulating nutrient storage and glucose clearing.',
    longevity_importance: 'Single earliest indicator of insulin resistance and metabolic dysfunction.'
  },
  homocysteine: {
    id: 'homocysteine',
    name: 'Homocysteine',
    canonical_aliases: ['homocysteine', 'serum homocysteine', 'hcy'],
    primary_unit: 'umol/L',
    supported_units: ['umol/L', 'µmol/L'],
    system: 'brain',
    secondary_systems: ['cardiovascular'],
    standard_lab_range: { min: 0, max: 15.0, unit: 'umol/L', display: '< 15.0 umol/L' },
    levl_optimal_zone: { min: 5.0, max: 8.0, unit: 'umol/L', display: '< 8.0 umol/L', longevity_rationale: 'Low homocysteine reflects efficient 1-carbon methylation metabolism, protecting cerebral microvasculature.' },
    study_citation: 'Seshadri S et al. N Engl J Med 2002; Refsum H et al. Annu Rev Nutr 2004',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/11842149/',
    bioage_model_usage: { phenoage: false, kdm: false, hd: false },
    description: 'Sulfur-containing amino acid derivative intermediate in methionine methylation pathways.',
    longevity_importance: 'Vascular endothelial toxin and neurodegenerative risk marker.'
  },
  ferritin: {
    id: 'ferritin',
    name: 'Serum Ferritin',
    canonical_aliases: ['ferritin', 'serum ferritin'],
    primary_unit: 'ng/mL',
    supported_units: ['ng/mL', 'ug/L'],
    system: 'liver',
    secondary_systems: ['immune'],
    standard_lab_range: { min: 30, max: 400, unit: 'ng/mL', display: '30 - 400 ng/mL' },
    levl_optimal_zone: { min: 50, max: 150, unit: 'ng/mL', display: '50 - 150 ng/mL', longevity_rationale: 'Optimal ferritin reflects healthy iron storage without tissue iron overload or acute-phase inflammation.' },
    study_citation: 'Kell DB et al. Arch Toxicol 2014',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/24584988/',
    bioage_model_usage: { phenoage: false, kdm: false, hd: false },
    description: 'Intracellular protein that stores iron and releases it in a controlled fashion.',
    longevity_importance: 'Iron storage and systemic inflammatory marker.'
  },
  lpa: {
    id: 'lpa',
    name: 'Lipoprotein(a) [Lp(a)]',
    canonical_aliases: ['lpa', 'lp(a)', 'lipoprotein(a)', 'lipoprotein a'],
    primary_unit: 'nmol/L',
    supported_units: ['nmol/L', 'mg/dL'],
    system: 'cardiovascular',
    standard_lab_range: { min: 0, max: 75, unit: 'nmol/L', display: '< 75 nmol/L' },
    levl_optimal_zone: { min: 0, max: 50, unit: 'nmol/L', display: '< 50 nmol/L', longevity_rationale: 'Genetically determined atherogenic particle containing apolipoprotein(a) causing calcification and plaque.' },
    study_citation: 'Tsimikas S et al. J Am Coll Cardiol 2017; Kronenberg F. Eur Heart J 2022',
    study_url: 'https://pubmed.ncbi.nlm.nih.gov/28231936/',
    bioage_model_usage: { phenoage: false, kdm: false, hd: false },
    description: 'Independent genetic risk factor for calcific aortic valve stenosis and coronary heart disease.',
    longevity_importance: 'Primary genetic cardiovascular longevity marker.'
  }
}

/**
 * Maps arbitrary lab synonym text to canonical BIOMARKER_REGISTRY key
 */
export function resolveCanonicalBiomarkerId(rawName: string): string | null {
  if (!rawName) return null
  const clean = rawName.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim()
  
  // Phase 1: Check for exact matches first
  for (const [id, def] of Object.entries(BIOMARKER_REGISTRY)) {
    if (id === clean) return id
    for (const alias of def.canonical_aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim()
      if (clean === cleanAlias) return id
    }
  }

  // Phase 2: Check for substring matches, prioritizing longer alias terms first
  const entriesWithAliases: Array<{ id: string; alias: string; cleanAlias: string }> = []
  for (const [id, def] of Object.entries(BIOMARKER_REGISTRY)) {
    for (const alias of def.canonical_aliases) {
      entriesWithAliases.push({
        id,
        alias,
        cleanAlias: alias.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim()
      })
    }
  }

  // Sort by cleanAlias length descending (e.g. 'free testosterone' evaluated before 'testosterone')
  entriesWithAliases.sort((a, b) => b.cleanAlias.length - a.cleanAlias.length)

  for (const entry of entriesWithAliases) {
    if (entry.cleanAlias.length >= 3 && clean.includes(entry.cleanAlias)) {
      return entry.id
    }
  }

  return null
}
