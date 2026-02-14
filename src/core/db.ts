import { openDB, DBSchema } from 'idb'
import type { Settings, CheckIn, TopSet, NutritionLog, Exercise } from './types'

interface PLDB extends DBSchema {
  meta: { key: string, value: any }
  settings: { key: string, value: Settings }
  checkins: { key: string, value: CheckIn }
  topsets: { key: number, value: TopSet, indexes: { 'by-date': string, 'by-lift': string } }
  nutrition: { key: string, value: NutritionLog }
  exercises: { key: number, value: Exercise, indexes: { 'by-name': string } }
}

const DB='pl-coach-ideal-db'
const VER=1
export const KEYS={ SETTINGS:'singleton', PASS:'pass' } as const

export async function db(){
  return openDB<PLDB>(DB, VER, {
    upgrade(d){
      d.createObjectStore('meta',{keyPath:'key'})
      d.createObjectStore('settings',{keyPath:'key'})
      d.createObjectStore('checkins',{keyPath:'key'})
      const ts=d.createObjectStore('topsets',{keyPath:'id',autoIncrement:true})
      ts.createIndex('by-date','dateISO')
      ts.createIndex('by-lift','lift')
      d.createObjectStore('nutrition',{keyPath:'key'})
      const ex=d.createObjectStore('exercises',{keyPath:'id',autoIncrement:true})
      ex.createIndex('by-name','name')
    }
  })
}

export async function getSettings(): Promise<Settings|null>{
  const d=await db()
  return (await d.get('settings',KEYS.SETTINGS)) ?? null
}
export async function setSettings(s: Settings){
  const d = await db()
  await d.put('settings',{...s, key:KEYS.SETTINGS} as any)

  await syncToCloud(await exportAll())
}

export async function upsertCheckIn(ci: CheckIn){
  const d = await db()
  await d.put('checkins',{...ci, key:ci.dateISO} as any)

  await syncToCloud(await exportAll())
}
export async function getCheckInsAll(): Promise<CheckIn[]>{
  const d=await db()
  const all=await d.getAll('checkins')
  all.sort((a:any,b:any)=>a.dateISO<b.dateISO?-1:1)
  return all as any
}

export async function addTopSet(ts: TopSet){
  const d=await db()
  await d.add('topsets',ts)
}
export async function getTopSetsAll(): Promise<TopSet[]>{
  const d=await db()
  return await d.getAll('topsets')
}

export async function upsertNutrition(n: NutritionLog){
  const d=await db()
  await d.put('nutrition',{...n, key:n.dateISO} as any)
}
export async function getNutrition(dateISO: string): Promise<NutritionLog|null>{
  const d=await db()
  return (await d.get('nutrition', dateISO)) ?? null
}
export async function getNutritionAll(): Promise<NutritionLog[]>{
  const d=await db()
  const all=await d.getAll('nutrition')
  all.sort((a:any,b:any)=>a.dateISO<b.dateISO?-1:1)
  return all as any
}

export async function getExercisesAll(): Promise<Exercise[]>{
  const d=await db()
  const all=await d.getAll('exercises')
  all.sort((a:any,b:any)=> String(a.name).localeCompare(String(b.name),'ru'))
  return all as any
}
export async function seedExercises(exList: Exercise[]){
  const d=await db()
  const existing=await d.getAll('exercises')
  if(existing.length) return
  for(const ex of exList) await d.add('exercises', ex)
}

export async function clearAllExceptPassword(){
  const d=await db()
  await Promise.all([d.clear('settings'),d.clear('checkins'),d.clear('topsets'),d.clear('nutrition'),d.clear('exercises')])
}

export async function getAchievements(): Promise<any[]>{
  const d=await db()
  return (await d.get('meta','achievements'))?.value ?? []
}
export async function saveAchievements(list: any[]){
  const d=await db()
  await d.put('meta',{ key:'achievements', value:list } as any)
}
export async function unlockAchievement(a: any){
  const cur = await getAchievements()
  if (cur.find((x:any)=>x.id===a.id)) return
  cur.push(a)
  await saveAchievements(cur)
}

export async function getGamify(): Promise<any>{
  const d=await db()
  return (await d.get('meta','gamify'))?.value ?? { points:0, lastRecalcISO:null }
}
export async function setGamify(v:any){
  const d=await db()
  await d.put('meta',{ key:'gamify', value:v } as any)
}
export async function exportAll() {
  const d = await db()

  return {
    settings: await d.get('settings', KEYS.SETTINGS),
    checkins: await d.getAll('checkins'),
    topsets: await d.getAll('topsets'),
    nutrition: await d.getAll('nutrition'),
    exercises: await d.getAll('exercises'),
    meta: await d.getAll('meta'),
    ts: Date.now()
  }
}
export async function syncToCloud(data: any) {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch (e) {
    console.log('sync offline')
  }
}