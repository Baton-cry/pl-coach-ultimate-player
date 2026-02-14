import { useEffect, useMemo, useState } from 'react'
import { db, KEYS, getSettings, setSettings, seedExercises } from '../core/db'
import type { Settings } from '../core/types'
import { createPassword, verifyPassword, type StoredPassword } from '../core/crypto'
import { EXERCISES } from '../core/exercises_seed'

const DEFAULT: Settings = {
  mode:'auto',
  startDateISO: new Date().toISOString().slice(0,10),
  trainingDays:[1,3,5],
  bwKg:120,
  bfPercent:22,
  activity:1.55,
  rmBench:170,
  rmSquat:200,
  rmDeadlift:190,
  stepsTarget:12000,
  targetWeeklyLossPct:0.6,
  useAutoTM:true,
  tmFactor:0.95,
  equipment:['штанга','стойки','скамья'],
  limitations:[]
}

function normalize(s:any): Settings{
  return {
    ...DEFAULT,
    ...s,
    trainingDays: Array.isArray(s?.trainingDays)&&s.trainingDays.length?s.trainingDays:DEFAULT.trainingDays,
    equipment: Array.isArray(s?.equipment)?s.equipment:DEFAULT.equipment,
    limitations: Array.isArray(s?.limitations)?s.limitations:DEFAULT.limitations,
    tmFactor: (typeof s?.tmFactor==='number' && s.tmFactor>0.7 && s.tmFactor<1.0) ? s.tmFactor : DEFAULT.tmFactor,
    useAutoTM: typeof s?.useAutoTM==='boolean' ? s.useAutoTM : DEFAULT.useAutoTM,
  }
}

export function useAuth(){
  const [ready,setReady]=useState(false)
  const [hasPass,setHasPass]=useState(false)
  const [unlocked,setUnlocked]=useState(false)
  const [password,setPassword]=useState<string|null>(null)

  useEffect(()=>{
    (async()=>{
      const d=await db()
      const sp=await d.get('meta',KEYS.PASS)
      setHasPass(!!sp)
      const s=await getSettings()
      if(!s) await setSettings(DEFAULT)
      else await setSettings(normalize(s))
      await seedExercises(EXERCISES)
      setReady(true)
    })()
  },[])

  return useMemo(()=>({
    ready, hasPass, unlocked, password,
    async setPasswordOnce(pw:string){
      const d=await db()
      const ex=await d.get('meta',KEYS.PASS)
      if(ex) throw new Error('Пароль уже задан')
      const sp=await createPassword(pw)
      await d.put('meta',{key:KEYS.PASS,value:sp})
      setHasPass(true); setUnlocked(true); setPassword(pw)
    },
    async unlock(pw:string){
      const d=await db()
      const stored=await d.get('meta',KEYS.PASS) as any
      if(!stored) return false
      const ok=await verifyPassword(pw, stored.value as StoredPassword)
      if(ok){ setUnlocked(true); setPassword(pw) }
      return ok
    },
    lock(){ setUnlocked(false); setPassword(null) },
    async getSettings(){ return normalize((await getSettings()) ?? DEFAULT) },
    async saveSettings(s:Settings){ await setSettings(normalize(s)) }
  }),[ready,hasPass,unlocked,password])
}
