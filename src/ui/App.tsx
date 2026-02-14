import React, { useMemo, useState } from 'react'
import { TopTabs } from './components'
import { Today } from './pages/Today'
import { Progress } from './pages/Progress'
import { Catalog } from './pages/Catalog'
import { SettingsPage } from './pages/Settings'
import { Backup } from './pages/Backup'
import { Game } from './pages/Game'
import  Player  from './pages/Player'

export function App({ auth }:{ auth:any }){
  const tabs = ['Сегодня','Плеер','Прогресс','Ранги','Каталог','Настройки','Бэкап']
  const [active,setActive]=useState<string>('Сегодня')

  const page = useMemo(()=>{
    if(active==='Сегодня') return <Today auth={auth}/>
    if(active==='Плеер') return <Player auth={auth}/>
    if(active==='Прогресс') return <Progress auth={auth}/>
    if(active==='Ранги') return <Game auth={auth}/>
    if(active==='Каталог') return <Catalog auth={auth}/>
    if(active==='Настройки') return <SettingsPage auth={auth}/>
    return <Backup auth={auth}/>
  },[active,auth])

  return (
    <div className="fadeIn">
      <div className="max-w-md mx-auto px-4 pt-4">
        <TopTabs tabs={tabs} active={active} onChange={setActive}/>
      </div>
      {page}
    </div>
  )
}
