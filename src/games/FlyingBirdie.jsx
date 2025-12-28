import React, { useState, useEffect, useRef } from 'react'
import './FlyingBirdie.css'
import birdImage from '../assets/bird.png'

const BIRD_SIZE = 58
const PIPE_WIDTH = 60
const PIPE_GAP = 220
const GROUND_HEIGHT = 80
const GRAVITY = 0.6
const FLAP_STRENGTH = -12
const GAME_SPEED = 3
const COLLISION_PADDING = 8

function FlyingBirdie() {
  const [gameState, setGameState] = useState('start')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [birdPosition, setBirdPosition] = useState(200)
  const [pipes, setPipes] = useState([])
  const [gameAreaSize, setGameAreaSize] = useState({ width: 400, height: 600 })
  
  const birdVelocity = useRef(0)
  const gameLoopId = useRef(null)
  const birdPositionRef = useRef(200)
  const gameStateRef = useRef('start')
  const scoreRef = useRef(0)
  const gameAreaRef = useRef(null)

  useEffect(() => {
    // Get game area dimensions
    const updateSize = () => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect()
        setGameAreaSize({ width: rect.width, height: rect.height })
        const startY = rect.height / 2 - 150
        setBirdPosition(startY)
        birdPositionRef.current = startY
      }
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    loadHighScore()
  }, [])

  useEffect(() => {
    birdPositionRef.current = birdPosition
  }, [birdPosition])

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    if (gameState === 'playing') {
      startGameLoop()
    } else {
      stopGameLoop()
    }
    return () => stopGameLoop()
  }, [gameState])

  const loadHighScore = () => {
    try {
      const saved = localStorage.getItem('flyingBirdieHighScore')
      if (saved) setHighScore(parseInt(saved))
    } catch (e) {
      console.log('Error loading high score')
    }
  }

  const saveHighScore = (newScore) => {
    try {
      if (newScore > highScore) {
        localStorage.setItem('flyingBirdieHighScore', newScore.toString())
        setHighScore(newScore)
        return true
      }
      return false
    } catch (e) {
      console.log('Error saving high score:', e)
      return false
    }
  }

  const startGame = () => {
    const startY = gameAreaSize.height / 2 - 150
    setBirdPosition(startY)
    birdPositionRef.current = startY
    birdVelocity.current = 0
    setScore(0)
    scoreRef.current = 0
    setPipes([
      createPipe(gameAreaSize.width + 100),
      createPipe(gameAreaSize.width + 100 + gameAreaSize.width / 2),
    ])
    setGameState('playing')
    gameStateRef.current = 'playing'
  }

  const goToMenu = () => {
    stopGameLoop()
    const startY = gameAreaSize.height / 2 - 150
    setBirdPosition(startY)
    birdPositionRef.current = startY
    birdVelocity.current = 0
    setScore(0)
    scoreRef.current = 0
    setPipes([])
    setGameState('start')
    gameStateRef.current = 'start'
  }

  const createPipe = (xPosition) => {
    const minHeight = 120
    const maxHeight = gameAreaSize.height - PIPE_GAP - minHeight - (GROUND_HEIGHT + 20)
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight
    
    return {
      id: Math.random(),
      x: xPosition,
      topHeight: topHeight,
      bottomY: topHeight + PIPE_GAP,
      scored: false,
    }
  }

  const startGameLoop = () => {
    if (gameLoopId.current) {
      cancelAnimationFrame(gameLoopId.current)
    }
    const loop = () => {
      updateGame()
      gameLoopId.current = requestAnimationFrame(loop)
    }
    gameLoopId.current = requestAnimationFrame(loop)
  }

  const stopGameLoop = () => {
    if (gameLoopId.current) {
      cancelAnimationFrame(gameLoopId.current)
      gameLoopId.current = null
    }
  }

  const checkCollision = (birdY, pipe) => {
    const birdLeft = 100 + COLLISION_PADDING
    const birdRight = 100 + BIRD_SIZE - COLLISION_PADDING
    const birdTop = birdY + COLLISION_PADDING
    const birdBottom = birdY + BIRD_SIZE - COLLISION_PADDING

    const pipeLeft = pipe.x
    const pipeRight = pipe.x + PIPE_WIDTH

    if (birdRight < pipeLeft || birdLeft > pipeRight) {
      return false
    }

    if (birdTop < pipe.topHeight) {
      return true
    }

    if (birdBottom > pipe.bottomY) {
      return true
    }

    return false
  }

  const updateGame = () => {
    if (gameStateRef.current !== 'playing') {
      return
    }

    birdVelocity.current += GRAVITY
    const newBirdPosition = birdPositionRef.current + birdVelocity.current
    
    const groundY = gameAreaSize.height - GROUND_HEIGHT - BIRD_SIZE
    if (newBirdPosition >= groundY) {
      endGame()
      return
    }
    
    if (newBirdPosition <= 0) {
      endGame()
      return
    }
    
    birdPositionRef.current = newBirdPosition
    setBirdPosition(newBirdPosition)

    setPipes(prevPipes => {
      const updatedPipes = prevPipes.map(pipe => {
        const newPipe = { ...pipe, x: pipe.x - GAME_SPEED }
        
        if (!newPipe.scored && newPipe.x + PIPE_WIDTH < 90) {
          newPipe.scored = true
          setScore(s => {
            const newScore = s + 1
            scoreRef.current = newScore
            return newScore
          })
        }
        
        if (gameStateRef.current === 'playing') {
          const inCollisionZone = newPipe.x < 150 && newPipe.x + PIPE_WIDTH > 100
          if (inCollisionZone && checkCollision(newBirdPosition, newPipe)) {
            endGame()
          }
        }
        
        return newPipe
      })

      let finalPipes = updatedPipes.filter(pipe => pipe.x > -PIPE_WIDTH - 50)
      
      if (finalPipes.length > 0) {
        const lastPipe = finalPipes[finalPipes.length - 1]
        if (lastPipe.x < gameAreaSize.width - 250) {
          finalPipes.push(createPipe(gameAreaSize.width + 50))
        }
      }

      return finalPipes
    })
  }

  const endGame = () => {
    if (gameStateRef.current === 'playing') {
      gameStateRef.current = 'gameOver'
      setGameState('gameOver')
      stopGameLoop()
      saveHighScore(scoreRef.current)
    }
  }

  const handleClick = () => {
    if (gameState === 'playing') {
      birdVelocity.current = FLAP_STRENGTH
    }
  }

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        if (gameStateRef.current === 'playing') {
          birdVelocity.current = FLAP_STRENGTH
        } else if (gameStateRef.current === 'start') {
          startGame()
        } else if (gameStateRef.current === 'gameOver') {
          startGame()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <div className="flying-birdie-container">
      <div 
        ref={gameAreaRef}
        className="flying-birdie-game-area"
        onClick={handleClick}
        style={{ cursor: gameState === 'playing' ? 'pointer' : 'default' }}
      >
        {/* Sky */}
        <div className="flying-birdie-sky">
          {/* Score */}
          {gameState === 'playing' && (
            <div className="flying-birdie-score-container">
              <div className="flying-birdie-score-text">{score}</div>
            </div>
          )}

          {/* Pipes */}
          {pipes.map(pipe => (
            <div key={pipe.id}>
              <div 
                className="flying-birdie-pipe"
                style={{
                  left: `${pipe.x}px`,
                  top: '0',
                  height: `${pipe.topHeight}px`,
                }}
              >
                <div className="flying-birdie-pipe-cap" />
              </div>
              <div 
                className="flying-birdie-pipe"
                style={{
                  left: `${pipe.x}px`,
                  top: `${pipe.bottomY}px`,
                  height: `${gameAreaSize.height - pipe.bottomY}px`,
                }}
              >
                <div className="flying-birdie-pipe-cap flying-birdie-pipe-cap-top" />
              </div>
            </div>
          ))}

          {/* Bird */}
          {(gameState === 'playing' || gameState === 'gameOver') && (
            <div 
              className="flying-birdie-bird"
              style={{
                top: `${birdPosition}px`,
                transform: `rotate(${Math.min(Math.max(birdVelocity.current * 2, -30), 30)}deg)`
              }}
            >
              <img 
                src={birdImage}
                alt="Bird"
                className="flying-birdie-bird-image"
              />
            </div>
          )}
        </div>

        {/* Ground */}
        <div className="flying-birdie-ground">
          <div className="flying-birdie-grass" />
        </div>
      </div>

      {/* Start Screen */}
      {gameState === 'start' && (
        <div className="flying-birdie-overlay">
          <div className="flying-birdie-menu-box">
            <h1 className="flying-birdie-title">Flying Birdie</h1>
            <img 
              src={birdImage}
              alt="Bird"
              className="flying-birdie-big-bird-image"
            />
            <p className="flying-birdie-instructions">Click or press SPACE to flap!</p>
            <p className="flying-birdie-best-score">High Score: {highScore}</p>
            <button className="flying-birdie-start-button" onClick={startGame}>
              START GAME
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameOver' && (
        <div className="flying-birdie-overlay">
          <div className="flying-birdie-menu-box">
            <h2 className="flying-birdie-game-over-title">Game Over!</h2>
            <p className="flying-birdie-final-score">Score: {score}</p>
            {score >= highScore && score > 0 && (
              <p className="flying-birdie-new-record">🏆 NEW HIGH SCORE! 🏆</p>
            )}
            <p className="flying-birdie-best-score">Best: {highScore}</p>
            <button className="flying-birdie-start-button" onClick={startGame}>
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlyingBirdie

