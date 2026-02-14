export type Mode = 'cut'|'mass'|'auto'
export type Lift = 'bench'|'squat'|'deadlift'
export type DayType = 'upper'|'lower'|'pull'
export type WeekType = 'light'|'medium'|'medium_plus'|'heavy'

export type Settings = {
  mode: Mode
  startDateISO: string
  trainingDays: number[] // 1=Пн ... 7=Вс
  bwKg: number
  bfPercent: number
  activity: 1.45|1.55|1.65|1.75
  rmBench: number
  rmSquat: number
  rmDeadlift: number
  stepsTarget: number
  targetWeeklyLossPct: number
  useAutoTM: boolean
  tmFactor: number
  equipment: string[]
  limitations: string[]
}

export type CheckIn = {
  dateISO: string
  weightMorningKg: number|null
  sleep1to5: 1|2|3|4|5|null
  stress1to5: 1|2|3|4|5|null
  steps: number|null
  note: string|null
}

export type TopSet = {
  id?: number
  dateISO: string
  lift: Lift
  weightKg: number
  reps: number
  rpe: number|null
  e1rm: number
  note: string|null
}

export type NutritionLog = {
  dateISO: string
  calories: number|null
  proteinG: number|null
  fatG: number|null
  carbsG: number|null
}

export type Exercise = {
  id?: number
  name: string
  replaces: Lift[]
  pattern: string
  primary: string[]
  secondary: string[]
  benefits: string[]
  anatomy: string[] // коротко про суставы/движение
  cues: string[]
  avoidIf: string[]
  needs: string[]
  recommendedSetsReps: string // например "3–4×6–10"
}
