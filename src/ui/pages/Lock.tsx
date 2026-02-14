import React, { useState } from 'react'
import { Btn, Card, Container, Input, Pill, Topbar } from '../components'

export function Lock({ auth }:{ auth:any }){
  const [pw,setPw]=useState('')
  const [pw2,setPw2]=useState('')
  const [err,setErr]=useState<string|null>(null)
  const [busy,setBusy]=useState(false)

  async function go(){
    setErr(null)
    if(pw.length<6){ setErr('Пароль минимум 6 символов'); return }
    setBusy(true)
    try{
      if(!auth.hasPass){
        if(pw!==pw2){ setErr('Пароли не совпали'); return }
        await auth.setPasswordOnce(pw)
      }else{
        const ok=await auth.unlock(pw)
        if(!ok) setErr('Неверный пароль')
      }
    } finally { setBusy(false) }
  }

  return (
    <Container>
      <Topbar title="Вход" subtitle="Офлайн. Пароль восстановить нельзя." right={<Pill tone="red">OFFLINE</Pill>} />
      <div className="mt-4 space-y-3">
        <Card title={auth.hasPass?'Введи пароль':'Задай пароль (один раз)'} desc="Данные хранятся на устройстве. Перенос между айфоном и ПК — экспорт/импорт файла (в Бэкапе).">
          <div className="space-y-2">
            <Input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Пароль"/>
            {!auth.hasPass && <Input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="Повтори пароль"/>}
            {err && <div className="text-sm text-red">{err}</div>}
            <Btn className="w-full" onClick={go} disabled={busy}>{auth.hasPass?'Войти':'Создать пароль'}</Btn>
          </div>
        </Card>
      </div>
    </Container>
  )
}
