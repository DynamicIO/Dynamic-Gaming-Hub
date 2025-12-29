import React, { useState, useEffect, useCallback } from 'react'
import './MemoryMatch.css'

const DIFFICULTY_LEVELS = {
  easy: { pairs: 6, grid: 3, timeLimit: 120 },
  medium: { pairs: 8, grid: 4, timeLimit: 180 },
  hard: { pairs: 12, grid: 4, timeLimit: 240 }
}

const EMOJI_PAIRS = ['🎮', '🌟', '🎯', '⚡', '🔥', '💎', '🎨', '🚀', '⭐', '💫', '🎪', '🎭', '🎬', '🎵', '🎸', '🎺']

function MemoryMatch() {
  const [difficulty, setDifficulty] = useState('easy')
  const [cards, setCards] = useState([])
  const [flippedCards, setFlippedCards] = useState([])
  const [matchedPairs, setMatchedPairs] = useState([])
  const [gameState, setGameState] = useState('menu') // menu, playing, paused, gameOver, win
  const [moves, setMoves] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [score, setScore] = useState(0)
  const [highScores, setHighScores] = useState({ easy: 0, medium: 0, hard: 0 })
  const [isChecking, setIsChecking] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)

  useEffect(() => {
    // Load high scores
    const saved = localStorage.getItem('memoryMatchHighScores')
    if (saved) {
      setHighScores(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    let timer = null
    if (gameState === 'playing' && timeLeft > 0 && !isRevealing) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [gameState, timeLeft, isRevealing])

  const initializeGame = useCallback(() => {
    const config = DIFFICULTY_LEVELS[difficulty]
    const pairs = EMOJI_PAIRS.slice(0, config.pairs)
    const cardPairs = [...pairs, ...pairs]
    
    // Shuffle cards
    const shuffled = cardPairs.sort(() => Math.random() - 0.5)
    
    const newCards = shuffled.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: true, // Start with all cards flipped for reveal
      isMatched: false
    }))
    
    setCards(newCards)
    setFlippedCards([])
    setMatchedPairs([])
    setMoves(0)
    setTimeLeft(config.timeLimit)
    setScore(0)
    setGameState('playing')
    setIsChecking(false)
    setIsRevealing(true)
    
    // Reveal cards for 1 second, then flip them over
    setTimeout(() => {
      const flippedCards = newCards.map(card => ({
        ...card,
        isFlipped: false
      }))
      setCards(flippedCards)
      setIsRevealing(false)
    }, 1000)
  }, [difficulty])

  useEffect(() => {
    if (gameState === 'playing' && cards.length > 0) {
      // Check if all pairs are matched
      if (matchedPairs.length === DIFFICULTY_LEVELS[difficulty].pairs) {
        winGame()
      }
    }
  }, [matchedPairs, difficulty, cards.length, gameState])

  const handleCardClick = (cardId) => {
    if (gameState !== 'playing' || isChecking || isRevealing) return
    
    const card = cards.find(c => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) return

    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)
    
    const updatedCards = cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    )
    setCards(updatedCards)

    // Check for match when 2 cards are flipped
    if (newFlippedCards.length === 2) {
      setIsChecking(true)
      setMoves(prev => prev + 1)
      
      setTimeout(() => {
        const [firstId, secondId] = newFlippedCards
        const firstCard = cards.find(c => c.id === firstId)
        const secondCard = cards.find(c => c.id === secondId)

        if (firstCard.emoji === secondCard.emoji) {
          // Match found
          const newMatchedPairs = [...matchedPairs, firstCard.emoji]
          setMatchedPairs(newMatchedPairs)
          
          const matchedCards = updatedCards.map(c => 
            newFlippedCards.includes(c.id) ? { ...c, isMatched: true, isFlipped: true } : c
          )
          setCards(matchedCards)
          
          // Calculate score bonus
          const timeBonus = Math.floor(timeLeft * 10)
          const moveBonus = Math.max(0, 100 - moves * 5)
          const matchBonus = newMatchedPairs.length * 50
          setScore(timeBonus + moveBonus + matchBonus)
        } else {
          // No match - flip back
          const flippedBack = updatedCards.map(c => 
            newFlippedCards.includes(c.id) ? { ...c, isFlipped: false } : c
          )
          setCards(flippedBack)
        }
        
        setFlippedCards([])
        setIsChecking(false)
      }, 1000)
    }
  }

  const winGame = () => {
    setGameState('win')
    const currentHigh = highScores[difficulty] || 0
    if (score > currentHigh) {
      const newHighScores = { ...highScores, [difficulty]: score }
      setHighScores(newHighScores)
      localStorage.setItem('memoryMatchHighScores', JSON.stringify(newHighScores))
    }
  }

  const endGame = () => {
    setGameState('gameOver')
  }

  const resetGame = () => {
    setGameState('menu')
    setCards([])
    setFlippedCards([])
    setMatchedPairs([])
    setMoves(0)
    setScore(0)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const config = DIFFICULTY_LEVELS[difficulty]

  return (
    <div className="memory-match-container">
      <div className="memory-match-wrapper">
        {/* Menu Screen */}
        {gameState === 'menu' && (
          <div className="memory-match-menu">
            <h1 className="memory-match-title">🧠 Memory Match</h1>
            <p className="memory-match-subtitle">Find all matching pairs!</p>
            
            <div className="memory-match-difficulty">
              <h3>Select Difficulty</h3>
              <div className="difficulty-buttons">
                {Object.entries(DIFFICULTY_LEVELS).map(([level, config]) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`difficulty-btn ${difficulty === level ? 'active' : ''}`}
                  >
                    <div className="difficulty-name">{level.toUpperCase()}</div>
                    <div className="difficulty-info">
                      {config.pairs} pairs • {config.grid}x{config.grid} grid
                    </div>
                    {highScores[level] > 0 && (
                      <div className="difficulty-high-score">Best: {highScores[level]}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={initializeGame} className="memory-match-start-btn">
              Start Game
            </button>
          </div>
        )}

        {/* Game Screen */}
        {gameState === 'playing' && (
          <>
            <div className="memory-match-header">
              <div className="memory-match-stats">
                <div className="stat-item">
                  <span className="stat-label">Time</span>
                  <span className="stat-value">{isRevealing ? '--:--' : formatTime(timeLeft)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Moves</span>
                  <span className="stat-value">{moves}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Score</span>
                  <span className="stat-value">{score}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Pairs</span>
                  <span className="stat-value">{matchedPairs.length}/{config.pairs}</span>
                </div>
              </div>
              {isRevealing && (
                <div className="reveal-message">
                  <span>Memorize the cards...</span>
                </div>
              )}
              <button onClick={resetGame} className="memory-match-menu-btn">
                Menu
              </button>
            </div>

            <div 
              className="memory-match-grid"
              style={{ 
                gridTemplateColumns: `repeat(${config.grid}, 1fr)`,
                gap: '0.75rem'
              }}
            >
              {cards.map(card => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`memory-card ${
                    card.isFlipped || card.isMatched ? 'flipped' : ''
                  } ${card.isMatched ? 'matched' : ''} ${isChecking && flippedCards.includes(card.id) ? 'checking' : ''} ${isRevealing ? 'revealing' : ''}`}
                  style={{ pointerEvents: isRevealing ? 'none' : 'auto' }}
                >
                  <div className="card-front">?</div>
                  <div className="card-back">{card.emoji}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Win Screen */}
        {gameState === 'win' && (
          <div className="memory-match-overlay">
            <div className="memory-match-result">
              <h2 className="result-title">🎉 You Win! 🎉</h2>
              <div className="result-stats">
                <div className="result-stat">
                  <span className="result-label">Final Score</span>
                  <span className="result-value">{score}</span>
                </div>
                <div className="result-stat">
                  <span className="result-label">Moves</span>
                  <span className="result-value">{moves}</span>
                </div>
                <div className="result-stat">
                  <span className="result-label">Time Left</span>
                  <span className="result-value">{formatTime(timeLeft)}</span>
                </div>
              </div>
              {score >= (highScores[difficulty] || 0) && score > 0 && (
                <p className="new-high-score">🏆 New High Score! 🏆</p>
              )}
              <div className="result-buttons">
                <button onClick={initializeGame} className="memory-match-btn">
                  Play Again
                </button>
                <button onClick={resetGame} className="memory-match-btn secondary">
                  Main Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameOver' && (
          <div className="memory-match-overlay">
            <div className="memory-match-result">
              <h2 className="result-title">⏰ Time's Up!</h2>
              <div className="result-stats">
                <div className="result-stat">
                  <span className="result-label">Pairs Found</span>
                  <span className="result-value">{matchedPairs.length}/{config.pairs}</span>
                </div>
                <div className="result-stat">
                  <span className="result-label">Moves</span>
                  <span className="result-value">{moves}</span>
                </div>
              </div>
              <div className="result-buttons">
                <button onClick={initializeGame} className="memory-match-btn">
                  Try Again
                </button>
                <button onClick={resetGame} className="memory-match-btn secondary">
                  Main Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MemoryMatch

