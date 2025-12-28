import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import GameGallery from './components/GameGallery'
import GamePlayer from './components/GamePlayer'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<GameGallery />} />
          <Route path="/game/:gameId" element={<GamePlayer />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App


