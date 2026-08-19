import { QuickHotkeyConfig } from '../types'

/**
 * Scientifically Curated Preset Library of Micro-Habit Hotkeys
 * Covers high-impact performance habits, nutrition, recovery, and vices/negative habits.
 */
export const POPULAR_HOTKEY_LIBRARY: QuickHotkeyConfig[] = [
  // 1. NUTRITION & MACROS
  {
    id: 'nutrition_macros',
    name: 'Log Meal / Macros',
    icon: 'Utensils',
    category: 'nutrition',
    unit: 'kcal',
    default_increment: 450,
    daily_goal: 2200,
    is_negative: false,
    color_theme: 'emerald',
    presets: [
      { label: 'Standard Meal (+500 kcal)', amount: 500, notes: 'Balanced whole food meal' },
      { label: 'Protein Shake (+200 kcal)', amount: 200, notes: 'Post-workout pulse' },
      { label: 'Longevity Salad (+350 kcal)', amount: 350, notes: 'Cruciferous greens, EVOO & seeds' },
      { label: 'Nut Pudding & Berries (+400 kcal)', amount: 400, notes: 'Blueprint polyphenol meal' }
    ]
  },
  {
    id: 'protein_pulse',
    name: 'Protein Pulse',
    icon: 'Flame',
    category: 'nutrition',
    unit: 'g',
    default_increment: 35,
    daily_goal: 160,
    is_negative: false,
    color_theme: 'orange',
    presets: [
      { label: 'Whey / Plant Shake (+30g)', amount: 30, notes: 'Post-workout shake' },
      { label: 'Chicken Breast / Steak (+40g)', amount: 40, notes: 'Whole food lean protein' },
      { label: 'Nut Pudding & Berries (+35g)', amount: 35, notes: 'Blueprint longevity meal' },
      { label: 'Eggs & Whites (+25g)', amount: 25, notes: 'Breakfast protein feeding' },
      { label: 'Salmon / Fish (+35g)', amount: 35, notes: 'Omega-3 rich protein' }
    ]
  },
  {
    id: 'creatine_scoop',
    name: 'Creatine Monohydrate',
    icon: 'Zap',
    category: 'nutrition',
    unit: 'g',
    default_increment: 5,
    daily_goal: 5,
    is_negative: false,
    color_theme: 'amber',
    presets: [
      { label: 'Daily 5g Dose (+5g)', amount: 5, notes: 'Standard saturation dose' },
      { label: 'Loading Dose (+10g)', amount: 10, notes: 'Split loading phase' }
    ]
  },

  // 2. HYDRATION & ELECTROLYTES
  {
    id: 'water_intake',
    name: 'Water Intake',
    icon: 'Droplets',
    category: 'hydration',
    unit: 'oz',
    default_increment: 24,
    daily_goal: 100,
    bottle_size_oz: 24,
    is_negative: false,
    color_theme: 'cyan',
    presets: [
      { label: 'Standard Glass (+16 oz)', amount: 16, notes: 'Kitchen glass' },
      { label: 'Hydro Flask (+24 oz)', amount: 24, notes: 'Standard insulated bottle' },
      { label: 'Large Nalgene (+32 oz)', amount: 32, notes: '1 Quart bottle' },
      { label: '1-Liter Smart Bottle (+34 oz)', amount: 34, notes: '1,000ml bottle' },
      { label: 'Electrolyte Water (+24 oz)', amount: 24, notes: 'Water + 500mg sodium/potassium' }
    ]
  },

  // 3. CAFFEINE & CIRCADIAN
  {
    id: 'coffee_caffeine',
    name: 'Coffee / Caffeine',
    icon: 'Coffee',
    category: 'circadian',
    unit: 'cups',
    default_increment: 1,
    daily_goal: 2,
    is_negative: false,
    color_theme: 'amber',
    presets: [
      { label: '1 Cup Drip Coffee (100mg)', amount: 1, notes: 'Standard brew' },
      { label: 'Espresso / Double (140mg)', amount: 1, notes: 'Double shot espresso' },
      { label: 'Cold Brew / Matcha (150mg)', amount: 1, notes: 'Cold brew' },
      { label: 'Pre-Workout Scoop (200mg)', amount: 2, notes: 'Pre-training caffeine' }
    ]
  },
  {
    id: 'outside_sunlight',
    name: 'Outside Sunlight',
    icon: 'Sun',
    category: 'circadian',
    unit: 'min',
    default_increment: 15,
    daily_goal: 30,
    is_negative: false,
    color_theme: 'amber',
    presets: [
      { label: 'Morning Light Pulse (+10m)', amount: 10, notes: 'Circadian retinal reset' },
      { label: 'Midday Sunlight Walk (+20m)', amount: 20, notes: 'Vitamin D & alertness' },
      { label: 'Late Afternoon Light (+15m)', amount: 15, notes: 'Dusk melatonin anchoring' }
    ]
  },

  // 4. MINDFULNESS, FOCUS & RECOVERY
  {
    id: 'mindful_break',
    name: 'Mindful / Breath Break',
    icon: 'Wind',
    category: 'mind',
    unit: 'min',
    default_increment: 5,
    daily_goal: 15,
    is_negative: false,
    color_theme: 'indigo',
    presets: [
      { label: 'Cyclic Sighing (+5m)', amount: 5, notes: 'Autonomic down-regulation' },
      { label: 'Box Breathing (+5m)', amount: 5, notes: 'Navy SEAL focus reset' },
      { label: '4-7-8 Deep Relaxation (+10m)', amount: 10, notes: 'Vagus nerve stimulation' },
      { label: 'NSDR / Yoga Nidra (+20m)', amount: 20, notes: 'Non-sleep deep rest recovery' }
    ]
  },
  {
    id: 'screen_break',
    name: 'Screen / Eye Rest (20-20-20)',
    icon: 'Eye',
    category: 'mind',
    unit: 'count',
    default_increment: 1,
    daily_goal: 6,
    is_negative: false,
    color_theme: 'purple',
    presets: [
      { label: '20-20-20 Eye Rest (+1)', amount: 1, notes: 'Looked 20ft away for 20s' },
      { label: 'Post-Focus Stand & Stretch (+1)', amount: 1, notes: 'Full cognitive micro-break' }
    ]
  },
  {
    id: 'standing_time',
    name: 'Standing Desk Time',
    icon: 'Footprints',
    category: 'movement',
    unit: 'min',
    default_increment: 30,
    daily_goal: 120,
    is_negative: false,
    color_theme: 'emerald',
    presets: [
      { label: '30-Minute Stand (+30m)', amount: 30, notes: 'Standing work block' },
      { label: '60-Minute Deep Stand (+60m)', amount: 60, notes: 'Active standing focus' }
    ]
  },
  {
    id: 'cold_shock',
    name: 'Cold Plunge / Shower',
    icon: 'Snowflake',
    category: 'recovery',
    unit: 'min',
    default_increment: 3,
    daily_goal: 3,
    is_negative: false,
    color_theme: 'cyan',
    presets: [
      { label: '3-Min Cold Plunge 50°F (+3m)', amount: 3, notes: 'Norepinephrine shock' },
      { label: 'Cold Shower Finish (+2m)', amount: 2, notes: 'Morning shower blast' }
    ]
  },
  {
    id: 'sauna_session',
    name: 'Sauna Session',
    icon: 'Flame',
    category: 'recovery',
    unit: 'min',
    default_increment: 20,
    daily_goal: 20,
    is_negative: false,
    color_theme: 'rose',
    presets: [
      { label: '20-Min Hyperthermic 174°F (+20m)', amount: 20, notes: 'Heat shock protein induction' },
      { label: '30-Min Extended Sauna (+30m)', amount: 30, notes: 'Cardiovascular shear stress' }
    ]
  },

  // 5. VICES & NEGATIVE HABITS (Harm Reduction & Awareness)
  {
    id: 'alcohol_drink',
    name: 'Alcoholic Drink',
    icon: 'Wine',
    category: 'vice',
    unit: 'drinks',
    default_increment: 1,
    daily_goal: 0,
    is_negative: true,
    color_theme: 'rose',
    presets: [
      { label: '1 Glass Wine / Beer (+1)', amount: 1, notes: 'Single standard drink' },
      { label: '1 Cocktail / Spirit (+1)', amount: 1, notes: 'Hard spirit' },
      { label: '2 Drinks (+2)', amount: 2, notes: 'Social drinks' }
    ]
  },
  {
    id: 'cigarette_nicotine',
    name: 'Cigarette / Vape',
    icon: 'Cigarette',
    category: 'vice',
    unit: 'count',
    default_increment: 1,
    daily_goal: 0,
    is_negative: true,
    color_theme: 'rose',
    presets: [
      { label: '1 Cigarette (+1)', amount: 1, notes: 'Combustible tobacco' },
      { label: '1 Vape Session (+1)', amount: 1, notes: 'E-cigarette session' },
      { label: '1 Nicotine Pouch (+1)', amount: 1, notes: 'Oral pouch' }
    ]
  },
  {
    id: 'processed_snack',
    name: 'Ultra-Processed Sugar Snack',
    icon: 'Cookie',
    category: 'vice',
    unit: 'count',
    default_increment: 1,
    daily_goal: 0,
    is_negative: true,
    color_theme: 'rose',
    presets: [
      { label: 'Sugary Dessert / Pastry (+1)', amount: 1, notes: 'High glycemic load' },
      { label: 'Chips / Fried Snack (+1)', amount: 1, notes: 'Seed oil ultra-processed' },
      { label: 'Late-Night Junk Food (+1)', amount: 1, notes: 'Sleep disrupting meal' }
    ]
  },
  {
    id: 'cannabis_thc',
    name: 'Cannabis / THC',
    icon: 'Leaf',
    category: 'vice',
    unit: 'count',
    default_increment: 1,
    daily_goal: 0,
    is_negative: true,
    color_theme: 'rose',
    presets: [
      { label: '1 Inhalation / Hit (+1)', amount: 1, notes: 'Smoked / vaped flower' },
      { label: 'Low Dose Edible (2.5–5mg)', amount: 1, notes: 'Micro-dose edible' },
      { label: 'Standard Edible (10mg+)', amount: 1, notes: 'Oral THC/CBD gummy' },
      { label: 'Tincture / Oil Dropper (+1)', amount: 1, notes: 'Sublingual tincture' }
    ]
  },
  {
    id: 'late_screen_scroll',
    name: 'Late-Night Screen Scrolling',
    icon: 'Smartphone',
    category: 'vice',
    unit: 'min',
    default_increment: 15,
    daily_goal: 0,
    is_negative: true,
    color_theme: 'rose',
    presets: [
      { label: '15m in Bed (+15m)', amount: 15, notes: 'Delayed sleep latency' },
      { label: '30m Blue Light (+30m)', amount: 30, notes: 'Suppressed melatonin' }
    ]
  }
]

/**
 * Default starter set auto-populated for fresh profiles
 */
export const DEFAULT_STARTER_HOTKEYS: QuickHotkeyConfig[] = [
  POPULAR_HOTKEY_LIBRARY.find(h => h.id === 'nutrition_macros')!,
  POPULAR_HOTKEY_LIBRARY.find(h => h.id === 'water_intake')!,
  POPULAR_HOTKEY_LIBRARY.find(h => h.id === 'coffee_caffeine')!,
  POPULAR_HOTKEY_LIBRARY.find(h => h.id === 'outside_sunlight')!,
  POPULAR_HOTKEY_LIBRARY.find(h => h.id === 'mindful_break')!,
  POPULAR_HOTKEY_LIBRARY.find(h => h.id === 'alcohol_drink')!
]
