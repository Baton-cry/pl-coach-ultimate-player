import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import { useAuth } from './ui/useAuth'
import { App } from './ui/App'
import { Lock } from './ui/pages/Lock'

function Root(){
  const auth = useAuth()
  if(!auth.ready) return <div className="min-h-screen grid place-items-center text-mut">Загрузка…</div>
  if(!auth.unlocked) return <Lock auth={auth}/>
  return <App auth={auth}/>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Root/></React.StrictMode>
)
