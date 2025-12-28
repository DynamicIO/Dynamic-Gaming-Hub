import { Link } from 'react-router-dom'
import { games } from '../data/games'
import './GameGallery.css'

function GameGallery() {
  return (
    <div className="game-gallery">
      <header className="gallery-header">
        <h1 className="gallery-title">🎮 Dynamic Games Hub</h1>
        <p className="gallery-subtitle">Play amazing games in your browser!</p>
        <div className="games-count-badge">
          {games.length} {games.length === 1 ? 'Game' : 'Games'} Available
        </div>
      </header>
      
      <div className="games-grid">
        {games.map((game, index) => (
          <Link 
            key={game.id} 
            to={`/game/${game.id}`}
            className="game-card"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="game-card-image">
              {game.image ? (
                <img src={game.image} alt={game.name} />
              ) : (
                <div className="game-card-placeholder">
                  <span className="game-icon">{game.icon || '🎮'}</span>
                </div>
              )}
            </div>
            <div className="game-card-content">
              <h3 className="game-card-title">{game.name}</h3>
              <p className="game-card-description">{game.description}</p>
              <div className="play-indicator">
                <span>Play Now →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <footer className="gallery-footer">
        <p>Powered by Dynamic.IO</p>
      </footer>
    </div>
  )
}

export default GameGallery

