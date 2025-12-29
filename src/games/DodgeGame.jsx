import React, { useState, useEffect, useRef, useCallback } from 'react'
import './DodgeGame.css'

const GAME_WIDTH = 400
const GAME_HEIGHT = 600
const PLAYER_SIZE = 40
const OBSTACLE_SIZE = 30
const PLAYER_SPEED = 5
const INITIAL_OBSTACLE_SPEED = 2
const OBSTACLE_SPAWN_RATE = 60 // frames
const SPEED_INCREASE_RATE = 0.01

function DodgeGame() {
  const [gameState, setGameState] = useState('menu') // menu, playing, gameOver
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_SIZE / 2)
  const [playerY, setPlayerY] = useState(GAME_HEIGHT - 80)
  const [obstacles, setObstacles] = useState([])
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [obstacleSpeed, setObstacleSpeed] = useState(INITIAL_OBSTACLE_SPEED)
  const [keys, setKeys] = useState({ left: false, right: false, up: false, down: false })
  
  const gameLoopRef = useRef(null)
  const frameCountRef = useRef(0)
  const playerXRef = useRef(playerX)
  const playerYRef = useRef(playerY)

  useEffect(() => {
    // Load high score
    const saved = localStorage.getItem('dodgeGameHighScore')
    if (saved) {
      setHighScore(parseInt(saved))
    }
  }, [])

  useEffect(() => {
    playerXRef.current = playerX
    playerYRef.current = playerY
  }, [playerX, playerY])

  const handleKeyDown = useCallback((e) => {
    if (gameState !== 'playing') return

    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault()
        setKeys(prev => ({ ...prev, left: true }))
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault()
        setKeys(prev => ({ ...prev, right: true }))
        break
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault()
        setKeys(prev => ({ ...prev, up: true }))
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault()
        setKeys(prev => ({ ...prev, down: true }))
        break
      default:
        break
    }
  }, [gameState])

  const handleKeyUp = useCallback((e) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault()
        setKeys(prev => ({ ...prev, left: false }))
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault()
        setKeys(prev => ({ ...prev, right: false }))
        break
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault()
        setKeys(prev => ({ ...prev, up: false }))
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault()
        setKeys(prev => ({ ...prev, down: false }))
        break
      default:
        break
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  const checkCollision = (obstacle) => {
    const playerLeft = playerXRef.current
    const playerRight = playerXRef.current + PLAYER_SIZE
    const playerTop = playerYRef.current
    const playerBottom = playerYRef.current + PLAYER_SIZE

    const obstacleLeft = obstacle.x
    const obstacleRight = obstacle.x + OBSTACLE_SIZE
    const obstacleTop = obstacle.y
    const obstacleBottom = obstacle.y + OBSTACLE_SIZE

    return (
      playerLeft < obstacleRight &&
      playerRight > obstacleLeft &&
      playerTop < obstacleBottom &&
      playerBottom > obstacleTop
    )
  }

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return

    frameCountRef.current += 1

    // Move player
    setPlayerX(prev => {
      let newX = prev
      if (keys.left) newX = Math.max(0, newX - PLAYER_SPEED)
      if (keys.right) newX = Math.min(GAME_WIDTH - PLAYER_SIZE, newX + PLAYER_SPEED)
      return newX
    })

    setPlayerY(prev => {
      let newY = prev
      if (keys.up) newY = Math.max(0, newY - PLAYER_SPEED)
      if (keys.down) newY = Math.min(GAME_HEIGHT - PLAYER_SIZE, newY + PLAYER_SPEED)
      return newY
    })

    // Spawn obstacles
    if (frameCountRef.current % OBSTACLE_SPAWN_RATE === 0) {
      const newObstacle = {
        id: Date.now() + Math.random(),
        x: Math.random() * (GAME_WIDTH - OBSTACLE_SIZE),
        y: -OBSTACLE_SIZE,
        speed: obstacleSpeed
      }
      setObstacles(prev => [...prev, newObstacle])
    }

    // Update obstacles
    setObstacles(prev => {
      const updated = prev
        .map(obstacle => ({
          ...obstacle,
          y: obstacle.y + obstacle.speed
        }))
        .filter(obstacle => {
          // Check collision
          if (checkCollision(obstacle)) {
            endGame()
            return false
          }
          // Remove if off screen
          return obstacle.y < GAME_HEIGHT + OBSTACLE_SIZE
        })

      return updated
    })

    // Update score
    setScore(prev => prev + 1)

    // Increase difficulty
    if (frameCountRef.current % 300 === 0) {
      setObstacleSpeed(prev => prev + SPEED_INCREASE_RATE)
    }
  }, [gameState, keys, obstacleSpeed])

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(gameLoop, 16) // ~60 FPS
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameState, gameLoop])

  const startGame = () => {
    setGameState('playing')
    setPlayerX(GAME_WIDTH / 2 - PLAYER_SIZE / 2)
    setPlayerY(GAME_HEIGHT - 80)
    setObstacles([])
    setScore(0)
    setObstacleSpeed(INITIAL_OBSTACLE_SPEED)
    frameCountRef.current = 0
  }

  const endGame = () => {
    setGameState('gameOver')
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('dodgeGameHighScore', score.toString())
    }
  }

  const resetGame = () => {
    setGameState('menu')
    setObstacles([])
    setScore(0)
    setObstacleSpeed(INITIAL_OBSTACLE_SPEED)
    frameCountRef.current = 0
  }

  return (
    <div className="dodge-game-container">
      <div className="dodge-game-wrapper">
        {/* Menu Screen */}
        {gameState === 'menu' && (
          <div className="dodge-game-menu">
            <h1 className="dodge-game-title">🎮 Dodge Game</h1>
            <p className="dodge-game-subtitle">Avoid the obstacles! Use Arrow Keys or WASD to move.</p>
            
            {highScore > 0 && (
              <div className="dodge-high-score">
                <span className="high-score-label">High Score:</span>
                <span className="high-score-value">{highScore.toLocaleString()}</span>
              </div>
            )}

            <button onClick={startGame} className="dodge-start-btn">
              Start Game
            </button>
          </div>
        )}

        {/* Game Screen */}
        {gameState === 'playing' && (
          <div className="dodge-game-area">
            <div className="dodge-game-header">
              <div className="dodge-score">
                <span className="score-label">Score:</span>
                <span className="score-value">{score.toLocaleString()}</span>
              </div>
              <button onClick={endGame} className="dodge-pause-btn">Pause</button>
            </div>

            <div className="dodge-game-canvas">
              {/* Player */}
              <div
                className="dodge-player"
                style={{
                  left: `${playerX}px`,
                  top: `${playerY}px`,
                  width: `${PLAYER_SIZE}px`,
                  height: `${PLAYER_SIZE}px`
                }}
              >
                🚀
              </div>

              {/* Obstacles */}
              {obstacles.map(obstacle => (
                <div
                  key={obstacle.id}
                  className="dodge-obstacle"
                  style={{
                    left: `${obstacle.x}px`,
                    top: `${obstacle.y}px`,
                    width: `${OBSTACLE_SIZE}px`,
                    height: `${OBSTACLE_SIZE}px`
                  }}
                >
                  ⚠️
                </div>
              ))}
            </div>

            <div className="dodge-instructions">
              <p>Use Arrow Keys or WASD to move</p>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameOver' && (
          <div className="dodge-overlay">
            <div className="dodge-result">
              <h2 className="dodge-result-title">💥 Game Over!</h2>
              <div className="dodge-result-stats">
                <div className="dodge-result-stat">
                  <span className="result-label">Final Score</span>
                  <span className="result-value">{score.toLocaleString()}</span>
                </div>
                {score >= highScore && score > 0 && (
                  <div className="dodge-result-stat new-record">
                    <span className="result-label">🏆 New High Score! 🏆</span>
                  </div>
                )}
                <div className="dodge-result-stat">
                  <span className="result-label">High Score</span>
                  <span className="result-value">{highScore.toLocaleString()}</span>
                </div>
              </div>
              <div className="dodge-result-buttons">
                <button onClick={startGame} className="dodge-btn">
                  Play Again
                </button>
                <button onClick={resetGame} className="dodge-btn secondary">
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

export default DodgeGame

