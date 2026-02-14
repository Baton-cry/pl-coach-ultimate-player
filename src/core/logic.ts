import type { Settings, Lift, DayType, WeekType, TopSet, CheckIn, Exercise, Mode } from './types'

export function isoToday(){
  const d=new Date()
  return d.toISOString().slice(0,10)
}
export function weekdayMon1(dateISO:string){
  const d=new Date(dateISO+'T00:00:00')
  const wd=d.getDay()
  return wd===0?7:wd
}
export function addDaysISO(dateISO:string, add:number){
  const d=new Date(dateISO+'T00:00:00'); d.setDate(d.getDate()+add)
  return d.toISOString().slice(0,10)
}
export function e1rm(weight:number,reps:number){
  return Math.round((weight*(1+reps/30))*10)/10
}
export function round2p5(x:number){ return Math.round(x/2.5)*2.5 }

export function dayTypeForIndex(i:number): DayType {
  return i===0?'upper':i===1?'lower':'pull'
}
export function weekTypeForIndex(i:number): WeekType {
  return i===0?'light':i===1?'medium':i===2?'medium_plus':'heavy'
}

export function nextTrainingDayISO(s: Settings, fromISO: string): string {
  // find next day that is in s.trainingDays
  for(let k=0;k<14;k++){
    const iso=addDaysISO(fromISO, k)
    const wd=weekdayMon1(iso)
    if((s.trainingDays||[]).includes(wd)) return iso
  }
  return fromISO
}

export function dayTypeForDate(s: Settings, dateISO: string): DayType {
  const start=new Date(s.startDateISO+'T00:00:00')
  const d=new Date(dateISO+'T00:00:00')
  const diff=Math.floor((d.getTime()-start.getTime())/(1000*60*60*24))
  const idx=((diff%3)+3)%3
  return dayTypeForIndex(idx)
}
export function weekTypeForDate(s: Settings, dateISO: string): WeekType {
  const start=new Date(s.startDateISO+'T00:00:00')
  const d=new Date(dateISO+'T00:00:00')
  const diff=Math.floor((d.getTime()-start.getTime())/(1000*60*60*24))
  const w=Math.floor(diff/7)
  const idx=((w%4)+4)%4
  return weekTypeForIndex(idx)
}

export function fatigueFlag(last: CheckIn[], s: Settings): 'OK'|'HIGH'{
  if(!last.length) return 'OK'
  const x=last[last.length-1]
  if((x.sleep1to5 ?? 5) <= 2) return 'HIGH'
  if((x.stress1to5 ?? 1) >= 4) return 'HIGH'
  return 'OK'
}

export function latestE1RM(all: TopSet[], lift: Lift, withinDays=90): number|null{
  const now=new Date()
  const cutoff=new Date(now.getTime()-withinDays*24*60*60*1000)
  const vals=all
    .filter(t=>t.lift===lift)
    .filter(t=>new Date(t.dateISO+'T00:00:00')>=cutoff)
    .sort((a,b)=>a.dateISO<b.dateISO?1:-1)
  return vals.length?vals[0].e1rm:null
}
export function rmForLift(s: Settings, lift: Lift){
  return lift==='bench'?s.rmBench: lift==='squat'?s.rmSquat:s.rmDeadlift
}
export function trainingMaxForLift(s: Settings, all: TopSet[], lift: Lift){
  const base=rmForLift(s,lift)
  if(!s.useAutoTM) return { tm: base, source:'1RM' as const }
  const e=latestE1RM(all,lift,90)
  if(!e) return { tm: base, source:'1RM' as const }
  const tm=round2p5(e*(s.tmFactor||0.95))
  return { tm: Math.min(tm, base+2.5), source:'e1RM' as const }
}
export function weightFromPct(tm:number,pct:number){ return round2p5(tm*pct) }

export type PlanRow = { lift: Lift, main:boolean, basePct:number, sets:number, reps:number, focus:string, accessories: string[] }

const PLAN: Record<DayType, Record<WeekType, PlanRow[]>> = {
  upper:{
    light:[{lift:'bench',main:true,basePct:0.65,sets:4,reps:5,focus:'скорость + техника',accessories:['тяга горизонтальная 3–4×8–12','разведения задняя дельта 3×12–20','трицепс 3×10–15']}],
    medium:[{lift:'bench',main:true,basePct:0.75,sets:5,reps:4,focus:'рабочий объём',accessories:['тяга горизонтальная 4×8–12','жим гантелей 3×8–12','трицепс 3×10–15']}],
    medium_plus:[{lift:'bench',main:true,basePct:0.82,sets:4,reps:3,focus:'подготовка к тяжёлой',accessories:['тяга горизонтальная 4×6–10','пауза-жим 3×3–5 легко','задняя дельта 3×15–25']}],
    heavy:[{lift:'bench',main:true,basePct:0.88,sets:3,reps:2,focus:'сила без отказа',accessories:['тяга горизонтальная 3×6–10','трицепс 3×8–12','кор 3×30–45с']}],
  },
  lower:{
    light:[{lift:'squat',main:true,basePct:0.65,sets:4,reps:5,focus:'скорость + глубина',accessories:['сгибания ног 3×10–15','выпады 3×8–12','кор 3×30–45с']}],
    medium:[{lift:'squat',main:true,basePct:0.75,sets:4,reps:4,focus:'рабочий объём',accessories:['пауза-присед 3×3 легко','гиперэкстензии 3×10–15','икры 3×12–20']}],
    medium_plus:[{lift:'squat',main:true,basePct:0.80,sets:3,reps:3,focus:'жёсткая техника',accessories:['фронт-присед 3×3–5 легко','ягодичный мост 3×8–12','кор 3×30–45с']}],
    heavy:[{lift:'squat',main:true,basePct:0.85,sets:3,reps:2,focus:'сила без отказа',accessories:['лег-пресс 3×10–15','спина (тяга) 3×8–12','растяжка бедра']}],
  },
  pull:{
    light:[{lift:'deadlift',main:true,basePct:0.60,sets:3,reps:5,focus:'позиция + скорость',accessories:['RDL 3×6–10','тяга сверху 3×8–12','бицепс 3×10–15']}],
    medium:[{lift:'deadlift',main:true,basePct:0.70,sets:3,reps:4,focus:'рабочий объём',accessories:['тяга с плинтов 3×3–5','тяга горизонтальная 3×8–12','кор 3×30–45с']}],
    medium_plus:[{lift:'deadlift',main:true,basePct:0.78,sets:3,reps:3,focus:'мощный старт',accessories:['дефицит 3×3 легко','широчайшие 3×10–15','ягодицы 3×10–15']}],
    heavy:[{lift:'deadlift',main:true,basePct:0.85,sets:2,reps:2,focus:'сила',accessories:['RDL 2–3×6–8','спина 3×6–10','мобилити таза']}],
  }
}

export function planFor(s:Settings, dateISO:string, mult:number, mode:Mode){
  const day=dayTypeForDate(s,dateISO)
  const week=weekTypeForDate(s,dateISO)
  const base=PLAN[day][week]
  return base.map(p=>{
    const sets = mode==='cut'?Math.max(2, Math.round(p.sets*0.85)):p.sets
    const reps = mode==='cut'?Math.max(2, Math.round(p.reps*0.90)):p.reps
    const pct = Math.round(p.basePct*mult*1000)/1000
    return { ...p, sets, reps, pct, day, week }
  })
}

export function modeAutoFromTopSets(all: TopSet[], dateISO:string): Mode{
  // простое правило: если e1RM растёт/держится в последние 30д — масса, иначе сушка
  const cutoff=new Date(new Date(dateISO+'T00:00:00').getTime()-30*24*60*60*1000)
  const lifts: Lift[]=['bench','squat','deadlift']
  let votes=0, seen=0
  for(const l of lifts){
    const recent=all.filter(t=>t.lift===l).filter(t=>new Date(t.dateISO+'T00:00:00')>=cutoff).sort((a,b)=>a.dateISO<b.dateISO?-1:1)
    if(recent.length<2) continue
    seen++
    const first=recent[0].e1rm, last=recent[recent.length-1].e1rm
    if(last>=first) votes++
  }
  if(seen<2) return 'cut'
  return votes>=2?'mass':'cut'
}
export function intensityMultiplier(mode:Mode, fatigue:'OK'|'HIGH'){
  const f=fatigue==='HIGH'?0.97:1.0
  const m=mode==='cut'?0.98:1.0
  return Math.round(f*m*1000)/1000
}

// substitutions
export function substitutionsForLift(lift: Lift, exAll: Exercise[], s: Settings){
  const equip=new Set((s.equipment||[]).map(x=>x.toLowerCase()))
  const lim=new Set((s.limitations||[]).map(x=>x.toLowerCase()))
  return exAll
    .filter(ex=> (ex.replaces||[]).includes(lift))
    .filter(ex=> (ex.needs||[]).map(x=>x.toLowerCase()).every(n=>equip.has(n)))
    .filter(ex=> (ex.avoidIf||[]).map(x=>x.toLowerCase()).every(a=>!lim.has(a)))
}

// nutrition
export function nutritionTargets(s:Settings, mode:Mode){
  const lbm = s.bwKg*(1-s.bfPercent/100)
  const bmr = 370 + 21.6*lbm
  const tdee = bmr*s.activity
  const cutK = tdee*(1-0.15)
  const massK = tdee*(1+0.10)
  const kcal = mode==='cut'?cutK:massK
  const protein = 2.2*lbm
  const fat = 0.8*s.bwKg
  const carbs = Math.max(0, (kcal-(protein*4+fat*9))/4)
  return { kcal:Math.round(kcal), protein:Math.round(protein), fat:Math.round(fat), carbs:Math.round(carbs), tdee:Math.round(tdee) }
}

// coach suggestions
export type Readiness = { pain: 'none'|'mild'|'sharp', timeMin: 45|60|90, mood: 1|2|3|4|5 }
export function coachAdjustVolume(baseSets:number, r: Readiness){
  let m=1.0
  if(r.mood<=2) m*=0.85
  if(r.timeMin===45) m*=0.75
  if(r.timeMin===60) m*=0.88
  if(r.pain!=='none') m*=0.80
  return Math.max(2, Math.round(baseSets*m))
}

export function pointsForTopSet(weightKg: number, reps: number): number {
  const raw = weightKg * (1 + reps/10)
  return Math.max(5, Math.round(raw/10))
}

export function calcPoints(topsets: any[]): number {
  return topsets.reduce((acc,ts)=> acc + pointsForTopSet(Number(ts.weightKg||0), Number(ts.reps||0)), 0)
}

export function uniqueDatesISO(items:{dateISO:string}[]): string[] {
  return Array.from(new Set(items.map(x=>x.dateISO))).sort()
}

export function streakFromDatesISO(datesISO: string[]): number {
  if (!datesISO.length) return 0
  const set = new Set(datesISO)
  let streak = 0
  const d = new Date()
  for (let i=0;i<365;i++){
    const iso = d.toISOString().slice(0,10)
    if (set.has(iso)) streak += 1
    else break
    d.setDate(d.getDate()-1)
  }
  return streak
}

export function levelFromPoints(points: number): { level:number, title:string, progress:number, nextAt:number }{
  let level=1
  let need=120
  let p=points
  while(p>=need){
    p-=need
    level+=1
    need=Math.round(need*1.18)
  }
  const bands = [
    {min:1,title:'Новичок'},
    {min:6,title:'Боец'},
    {min:11,title:'Спартанец'},
    {min:16,title:'Титан'},
    {min:21,title:'Легенда'},
  ]
  let title=bands[0].title
  for (const b of bands) if (level>=b.min) title=b.title
  const progress = Math.min(1, p/need)
  return { level, title, progress, nextAt: need }
}

export function questsForWeek(pointsDelta: number, workoutsThisWeek: number){
  // simple quests (offline)
  return [
    { id:'q_workouts_3', title:'3 тренировки', target:3, value:workoutsThisWeek, unit:'трен', tip:'Если сушишься — держи объём умеренным, но регулярность решает.' },
    { id:'q_points_250', title:'250 очков', target:250, value:pointsDelta, unit:'очк', tip:'Очки копятся от топ-сетов: тяжелее + больше повторов → больше.' },
  ]
}

export function isoWeekKey(dateISO: string){
  const d = new Date(dateISO+'T00:00:00')
  const year = d.getUTCFullYear()
  // ISO week
  const target = new Date(Date.UTC(year, d.getUTCMonth(), d.getUTCDate()))
  const dayNr = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNr + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(),0,4))
  const week = 1 + Math.round(((target.getTime()-firstThursday.getTime())/86400000 - 3 + ((firstThursday.getUTCDay()+6)%7))/7)
  return `${target.getUTCFullYear()}-W${String(week).padStart(2,'0')}`
}import { importAll } from './db'

export async function syncFromCloud(): Promise<boolean> {
  try {
    const r = await fetch(`/api/sync?t=${Date.now()}`, { cache: 'no-store' })
    if (!r.ok) return false

    const text = await r.text()
    if (!text || text === 'null') return false   // <-- ВАЖНО

    const data = JSON.parse(text)
    await importAll(data)
    return true
  } catch (e) {
    console.log('sync pull failed', e)
    return false
  }
}