import { useParams, Link } from 'react-router-dom'
import { Suspense } from 'react'
import { games } from '../data/games'
import './GamePlayer.css'

function GamePlayer() {
  const { gameId } = useParams()
  const game = games.find(g => g.id === gameId)

  if (!game) {
    return (
      <div className="game-player">
        <div className="game-not-found">
          <h2>Game not found</h2>
          <Link to="/" className="back-button">Back to Games</Link>
        </div>
      </div>
    )
  }

  const GameComponent = game.component

  return (
    <div className="game-player">
      <div className="game-header">
        <Link to="/" className="back-button">Back to Games</Link>
        <h1 className="game-title">{game.name}</h1>
      </div>
      <div className="game-container">
        <Suspense fallback={
          <div className="game-loading">
            <div className="game-loading-spinner"></div>
            <p>Loading game...</p>
          </div>
        }>
          <GameComponent />
        </Suspense>
      </div>
    </div>
  )
}

export default GamePlayer

