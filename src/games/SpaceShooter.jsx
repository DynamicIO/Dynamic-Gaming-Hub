import React, { useState, useEffect, useRef, useCallback } from 'react'
import './SpaceShooter.css'

const GAME_WIDTH = 600
const GAME_HEIGHT = 800
const PLAYER_SIZE = 50
const BULLET_SIZE = 8
const ENEMY_SIZE = 40
const POWERUP_SIZE = 30

const POWERUP_TYPES = {
  RAPID_FIRE: { name: 'Rapid Fire', duration: 5000, color: '#ff6b6b' },
  SHIELD: { name: 'Shield', duration: 8000, color: '#4ecdc4' },
  MULTI_SHOT: { name: 'Multi Shot', duration: 6000, color: '#ffe66d' },
  SPEED: { name: 'Speed Boost', duration: 7000, color: '#a8e6cf' }
}

function SpaceShooter() {
  const [gameState, setGameState] = useState('menu') // menu, playing, paused, gameOver
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_SIZE / 2)
  const [playerY, setPlayerY] = useState(GAME_HEIGHT - 100)
  const [bullets, setBullets] = useState([])
  const [enemies, setEnemies] = useState([])
  const [powerUps, setPowerUps] = useState([])
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [health, setHealth] = useState(100)
  const [wave, setWave] = useState(1)
  const [enemiesKilled, setEnemiesKilled] = useState(0)
  const [activePowerUps, setActivePowerUps] = useState({})
  const [keys, setKeys] = useState({ left: false, right: false, space: false })
  
  const gameLoopRef = useRef(null)
  const lastShotRef = useRef(0)
  const frameCountRef = useRef(0)
  const playerXRef = useRef(playerX)
  const playerYRef = useRef(playerY)

  useEffect(() => {
    // Load high score
    const saved = localStorage.getItem('spaceShooterHighScore')
    if (saved) {
      setHighScore(parseInt(saved))
    }
  }, [])

  useEffect(() => {
    playerXRef.current = playerX
    playerYRef.current = playerY
  }, [playerX, playerY])

  const handleKeyDown = useCallback((e) => {
    if (gameState !== 'playing') {
      if (e.key === 'Enter' || e.key === ' ') {
        if (gameState === 'menu') {
          startGame()
        } else if (gameState === 'paused') {
          resumeGame()
        }
      }
      return
    }

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
      case ' ':
        e.preventDefault()
        setKeys(prev => ({ ...prev, space: true }))
        break
      case 'p':
      case 'P':
        e.preventDefault()
        pauseGame()
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
      case ' ':
        e.preventDefault()
        setKeys(prev => ({ ...prev, space: false }))
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

  const shoot = useCallback(() => {
    const now = Date.now()
    const fireRate = activePowerUps.RAPID_FIRE ? 100 : 300
    
    if (now - lastShotRef.current < fireRate) return
    
    lastShotRef.current = now
    
    const newBullets = []
    
    if (activePowerUps.MULTI_SHOT) {
      // Triple shot
      newBullets.push(
        { id: Date.now(), x: playerXRef.current + PLAYER_SIZE / 2, y: playerYRef.current, angle: -Math.PI / 2 },
        { id: Date.now() + 1, x: playerXRef.current + PLAYER_SIZE / 2, y: playerYRef.current, angle: -Math.PI / 2 - 0.3 },
        { id: Date.now() + 2, x: playerXRef.current + PLAYER_SIZE / 2, y: playerYRef.current, angle: -Math.PI / 2 + 0.3 }
      )
    } else {
      // Single shot
      newBullets.push({ id: Date.now(), x: playerXRef.current + PLAYER_SIZE / 2, y: playerYRef.current, angle: -Math.PI / 2 })
    }
    
    setBullets(prev => [...prev, ...newBullets])
  }, [activePowerUps])

  const spawnEnemy = useCallback(() => {
    const enemy = {
      id: Date.now() + Math.random(),
      x: Math.random() * (GAME_WIDTH - ENEMY_SIZE),
      y: -ENEMY_SIZE,
      speed: 1 + wave * 0.2,
      health: 1
    }
    setEnemies(prev => [...prev, enemy])
  }, [wave])

  const spawnPowerUp = useCallback((x, y) => {
    if (Math.random() < 0.3) { // 30% chance
      const types = Object.keys(POWERUP_TYPES)
      const type = types[Math.floor(Math.random() * types.length)]
      const powerUp = {
        id: Date.now() + Math.random(),
        x,
        y,
        type,
        speed: 2
      }
      setPowerUps(prev => [...prev, powerUp])
    }
  }, [])

  const collectPowerUp = useCallback((type) => {
    setActivePowerUps(prev => ({
      ...prev,
      [type]: Date.now() + POWERUP_TYPES[type].duration
    }))
    
    // Auto-remove after duration
    setTimeout(() => {
      setActivePowerUps(prev => {
        const updated = { ...prev }
        delete updated[type]
        return updated
      })
    }, POWERUP_TYPES[type].duration)
  }, [])

  const checkCollision = (rect1, rect2) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    )
  }

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return

    frameCountRef.current += 1

    // Move player
    const playerSpeed = activePowerUps.SPEED ? 8 : 5
    setPlayerX(prev => {
      let newX = prev
      if (keys.left) newX = Math.max(0, newX - playerSpeed)
      if (keys.right) newX = Math.min(GAME_WIDTH - PLAYER_SIZE, newX + playerSpeed)
      return newX
    })

    // Shooting
    if (keys.space) {
      shoot()
    }

    // Spawn enemies
    const spawnRate = Math.max(30, 90 - wave * 5)
    if (frameCountRef.current % spawnRate === 0) {
      spawnEnemy()
    }

    // Update bullets
    setBullets(prev => {
      return prev
        .map(bullet => ({
          ...bullet,
          x: bullet.x + Math.cos(bullet.angle) * 10,
          y: bullet.y + Math.sin(bullet.angle) * 10
        }))
        .filter(bullet => bullet.y > -BULLET_SIZE && bullet.y < GAME_HEIGHT + BULLET_SIZE && bullet.x > -BULLET_SIZE && bullet.x < GAME_WIDTH + BULLET_SIZE)
    })

    // Update enemies
    setEnemies(prev => {
      return prev
        .map(enemy => ({
          ...enemy,
          y: enemy.y + enemy.speed
        }))
        .filter(enemy => {
          // Check bullet collisions
          const enemyRect = { x: enemy.x, y: enemy.y, width: ENEMY_SIZE, height: ENEMY_SIZE }
          bullets.forEach(bullet => {
            const bulletRect = { x: bullet.x - BULLET_SIZE / 2, y: bullet.y - BULLET_SIZE / 2, width: BULLET_SIZE, height: BULLET_SIZE }
            if (checkCollision(enemyRect, bulletRect)) {
              setScore(prev => prev + 100)
              setEnemiesKilled(prev => prev + 1)
              spawnPowerUp(enemy.x, enemy.y)
              setBullets(prevBullets => prevBullets.filter(b => b.id !== bullet.id))
            }
          })
          
          // Check player collision
          if (!activePowerUps.SHIELD) {
            const playerRect = { x: playerXRef.current, y: playerYRef.current, width: PLAYER_SIZE, height: PLAYER_SIZE }
            if (checkCollision(enemyRect, playerRect)) {
              setHealth(prev => {
                const newHealth = prev - 20
                if (newHealth <= 0) {
                  endGame()
                }
                return newHealth
              })
            }
          }
          
          return enemy.y < GAME_HEIGHT + ENEMY_SIZE && enemy.health > 0
        })
    })

    // Update power-ups
    setPowerUps(prev => {
      return prev
        .map(powerUp => ({
          ...powerUp,
          y: powerUp.y + powerUp.speed
        }))
        .filter(powerUp => {
          const powerUpRect = { x: powerUp.x, y: powerUp.y, width: POWERUP_SIZE, height: POWERUP_SIZE }
          const playerRect = { x: playerXRef.current, y: playerYRef.current, width: PLAYER_SIZE, height: PLAYER_SIZE }
          
          if (checkCollision(powerUpRect, playerRect)) {
            collectPowerUp(powerUp.type)
            return false
          }
          
          return powerUp.y < GAME_HEIGHT + POWERUP_SIZE
        })
    })

    // Wave progression
    if (enemiesKilled > 0 && enemiesKilled % 10 === 0) {
      setWave(prev => prev + 1)
    }
  }, [gameState, keys, activePowerUps, shoot, spawnEnemy, spawnPowerUp, collectPowerUp, enemiesKilled, bullets])

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
    setPlayerY(GAME_HEIGHT - 100)
    setBullets([])
    setEnemies([])
    setPowerUps([])
    setScore(0)
    setHealth(100)
    setWave(1)
    setEnemiesKilled(0)
    setActivePowerUps({})
    frameCountRef.current = 0
    lastShotRef.current = 0
  }

  const pauseGame = () => {
    setGameState('paused')
  }

  const resumeGame = () => {
    setGameState('playing')
  }

  const endGame = () => {
    setGameState('gameOver')
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('spaceShooterHighScore', score.toString())
    }
  }

  const resetGame = () => {
    setGameState('menu')
    setBullets([])
    setEnemies([])
    setPowerUps([])
    setScore(0)
    setHealth(100)
    setWave(1)
    setEnemiesKilled(0)
    setActivePowerUps({})
    frameCountRef.current = 0
  }

  const getPowerUpIcon = (type) => {
    switch (type) {
      case 'RAPID_FIRE': return '⚡'
      case 'SHIELD': return '🛡️'
      case 'MULTI_SHOT': return '💥'
      case 'SPEED': return '🚀'
      default: return '⭐'
    }
  }

  return (
    <div className="space-shooter-container">
      <div className="space-shooter-wrapper">
        {/* Menu Screen */}
        {gameState === 'menu' && (
          <div className="space-shooter-menu">
            <h1 className="space-shooter-title">🚀 Space Shooter</h1>
            <p className="space-shooter-subtitle">Defend Earth from alien invaders!</p>
            
            {highScore > 0 && (
              <div className="space-shooter-high-score">
                <span className="high-score-label">High Score:</span>
                <span className="high-score-value">{highScore.toLocaleString()}</span>
              </div>
            )}

            <div className="space-shooter-controls">
              <h3>Controls</h3>
              <div className="controls-list">
                <div className="control-item">
                  <span className="control-key">← →</span>
                  <span className="control-desc">Move</span>
                </div>
                <div className="control-item">
                  <span className="control-key">SPACE</span>
                  <span className="control-desc">Shoot</span>
                </div>
                <div className="control-item">
                  <span className="control-key">P</span>
                  <span className="control-desc">Pause</span>
                </div>
              </div>
            </div>

            <button onClick={startGame} className="space-shooter-start-btn">
              Start Game
            </button>
          </div>
        )}

        {/* Game Screen */}
        {gameState === 'playing' && (
          <div className="space-shooter-game">
            <div className="space-shooter-header">
              <div className="space-shooter-stats">
                <div className="stat-item">
                  <span className="stat-label">Score</span>
                  <span className="stat-value">{score.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Wave</span>
                  <span className="stat-value">{wave}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Health</span>
                  <span className="stat-value">{health}%</span>
                </div>
              </div>
              <button onClick={pauseGame} className="space-shooter-pause-btn">Pause</button>
            </div>

            <div className="space-shooter-canvas">
              {/* Player */}
              <div
                className={`space-shooter-player ${activePowerUps.SHIELD ? 'shielded' : ''}`}
                style={{
                  left: `${playerX}px`,
                  top: `${playerY}px`,
                  width: `${PLAYER_SIZE}px`,
                  height: `${PLAYER_SIZE}px`
                }}
              >
                🚀
              </div>

              {/* Bullets */}
              {bullets.map(bullet => (
                <div
                  key={bullet.id}
                  className="space-shooter-bullet"
                  style={{
                    left: `${bullet.x - BULLET_SIZE / 2}px`,
                    top: `${bullet.y - BULLET_SIZE / 2}px`,
                    width: `${BULLET_SIZE}px`,
                    height: `${BULLET_SIZE}px`
                  }}
                />
              ))}

              {/* Enemies */}
              {enemies.map(enemy => (
                <div
                  key={enemy.id}
                  className="space-shooter-enemy"
                  style={{
                    left: `${enemy.x}px`,
                    top: `${enemy.y}px`,
                    width: `${ENEMY_SIZE}px`,
                    height: `${ENEMY_SIZE}px`
                  }}
                >
                  👾
                </div>
              ))}

              {/* Power-ups */}
              {powerUps.map(powerUp => (
                <div
                  key={powerUp.id}
                  className="space-shooter-powerup"
                  style={{
                    left: `${powerUp.x}px`,
                    top: `${powerUp.y}px`,
                    width: `${POWERUP_SIZE}px`,
                    height: `${POWERUP_SIZE}px`,
                    backgroundColor: POWERUP_TYPES[powerUp.type].color
                  }}
                >
                  {getPowerUpIcon(powerUp.type)}
                </div>
              ))}
            </div>

            {/* Active Power-ups */}
            {Object.keys(activePowerUps).length > 0 && (
              <div className="active-powerups">
                <h4>Active Power-ups:</h4>
                <div className="powerup-list">
                  {Object.entries(activePowerUps).map(([type, expiry]) => {
                    const timeLeft = Math.ceil((expiry - Date.now()) / 1000)
                    return timeLeft > 0 ? (
                      <div key={type} className="powerup-item" style={{ borderColor: POWERUP_TYPES[type].color }}>
                        <span className="powerup-icon">{getPowerUpIcon(type)}</span>
                        <span className="powerup-name">{POWERUP_TYPES[type].name}</span>
                        <span className="powerup-timer">{timeLeft}s</span>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}

            <div className="space-shooter-instructions">
              <p>← → to move • SPACE to shoot • Collect power-ups!</p>
            </div>
          </div>
        )}

        {/* Paused Screen */}
        {gameState === 'paused' && (
          <div className="space-shooter-overlay">
            <div className="space-shooter-pause-menu">
              <h2 className="pause-title">⏸ Paused</h2>
              <p className="pause-hint">Press SPACE or P to resume</p>
              <div className="pause-buttons">
                <button onClick={resumeGame} className="space-shooter-btn">
                  Resume
                </button>
                <button onClick={resetGame} className="space-shooter-btn secondary">
                  Main Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameOver' && (
          <div className="space-shooter-overlay">
            <div className="space-shooter-result">
              <h2 className="result-title">💥 Game Over!</h2>
              <div className="result-stats">
                <div className="result-stat">
                  <span className="result-label">Final Score</span>
                  <span className="result-value">{score.toLocaleString()}</span>
                </div>
                <div className="result-stat">
                  <span className="result-label">Wave Reached</span>
                  <span className="result-value">{wave}</span>
                </div>
                <div className="result-stat">
                  <span className="result-label">Enemies Killed</span>
                  <span className="result-value">{enemiesKilled}</span>
                </div>
                {score >= highScore && score > 0 && (
                  <div className="result-stat new-record">
                    <span className="result-label">🏆 New High Score! 🏆</span>
                  </div>
                )}
              </div>
              <div className="result-buttons">
                <button onClick={startGame} className="space-shooter-btn">
                  Play Again
                </button>
                <button onClick={resetGame} className="space-shooter-btn secondary">
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

export default SpaceShooter

