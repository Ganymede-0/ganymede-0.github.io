import Scene from './scene/Scene'
import Hud from './ui/Hud'
import MissionPanel from './ui/MissionPanel'
import BootSequence from './ui/BootSequence'
import './styles/tokens.css'
import './styles/ui.css'

export default function App() {
  return (
    <div className="app">
      <Scene />
      <div className="overlay">
        <Hud />
        <MissionPanel />
      </div>
      <BootSequence />
    </div>
  )
}
