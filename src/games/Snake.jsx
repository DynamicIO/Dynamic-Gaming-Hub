import React, { useState, useEffect, useRef, useCallback } from 'react'
import './Snake.css'

const GRID_SIZE = 20
const CELL_SIZE = 25
const INITIAL_SNAKE = [{ x: 10, y: 10 }]
const INITIAL_DIRECTION = { x: 1, y: 0 }
const GAME_SPEED = 150

function Snake() {
  const [snake, setSnake] = useState(INITIAL_SNAKE)
  const [food, setFood] = useState({ x: 15, y: 15 })
  const [direction, setDirection] = useState(INITIAL_DIRECTION)
  const [gameState, setGameState] = useState('start') // start, playing, paused, gameOver
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [nextDirection, setNextDirection] = useState(INITIAL_DIRECTION)
  
  const gameLoopRef = useRef(null)
  const directionRef = useRef(INITIAL_DIRECTION)
  const gameStateRef = useRef('start')

  useEffect(() => {
    // Load high score
    const saved = localStorage.getItem('snakeHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  useEffect(() => {
    directionRef.current = direction
  }, [direction])

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    }
    // Make sure food doesn't spawn on snake
    return newFood
  }, [])

  const checkCollision = useCallback((head) => {
    // Wrap around borders instead of collision
    if (head.x < 0) {
      head.x = GRID_SIZE - 1
    } else if (head.x >= GRID_SIZE) {
      head.x = 0
    }
    if (head.y < 0) {
      head.y = GRID_SIZE - 1
    } else if (head.y >= GRID_SIZE) {
      head.y = 0
    }
    
    // Only check self collision (not wall collision)
    const snakeBody = snake.slice(1)
    return snakeBody.some(segment => segment.x === head.x && segment.y === head.y)
  }, [snake])

  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== 'playing') return

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] }
      const dir = directionRef.current
      
      head.x += dir.x
      head.y += dir.y

      // Wrap around borders
      if (head.x < 0) {
        head.x = GRID_SIZE - 1
      } else if (head.x >= GRID_SIZE) {
        head.x = 0
      }
      if (head.y < 0) {
        head.y = GRID_SIZE - 1
      } else if (head.y >= GRID_SIZE) {
        head.y = 0
      }

      // Check self collision only
      const snakeBody = prevSnake.slice(1)
      if (snakeBody.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame()
        return prevSnake
      }

      const newSnake = [head, ...prevSnake]

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10
          if (newScore > highScore) {
            setHighScore(newScore)
            localStorage.setItem('snakeHighScore', newScore.toString())
          }
          return newScore
        })
        
        // Generate new food
        let newFood = generateFood()
        // Make sure food doesn't spawn on snake
        while (newSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
          newFood = generateFood()
        }
        setFood(newFood)
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }, [food, checkCollision, highScore, generateFood])

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(gameLoop, GAME_SPEED)
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

  const handleKeyPress = useCallback((e) => {
    // Prevent default scrolling for arrow keys and space
    const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
    const isGameKey = ['w', 'W', 's', 'S', 'a', 'A', 'd', 'D', ' ', 'p', 'P', 'Enter'].includes(e.key)
    
    if (isArrowKey || (isGameKey && gameStateRef.current === 'playing')) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (gameStateRef.current === 'start') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        startGame()
      }
      return
    }

    if (gameStateRef.current === 'gameOver') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        startGame()
      }
      return
    }

    if (gameStateRef.current === 'paused') {
      if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        resumeGame()
      }
      return
    }

    const dir = directionRef.current
    let newDirection = { ...dir }

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault()
        if (dir.y === 0) newDirection = { x: 0, y: -1 }
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault()
        if (dir.y === 0) newDirection = { x: 0, y: 1 }
        break
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault()
        if (dir.x === 0) newDirection = { x: -1, y: 0 }
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault()
        if (dir.x === 0) newDirection = { x: 1, y: 0 }
        break
      case ' ':
      case 'p':
      case 'P':
        e.preventDefault()
        pauseGame()
        return
      default:
        return
    }

    setDirection(newDirection)
    setNextDirection(newDirection)
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  const startGame = () => {
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    setNextDirection(INITIAL_DIRECTION)
    directionRef.current = INITIAL_DIRECTION
    setScore(0)
    setFood(generateFood())
    setGameState('playing')
    gameStateRef.current = 'playing'
  }

  const pauseGame = () => {
    setGameState('paused')
    gameStateRef.current = 'paused'
  }

  const resumeGame = () => {
    setGameState('playing')
    gameStateRef.current = 'playing'
  }

  const endGame = () => {
    setGameState('gameOver')
    gameStateRef.current = 'gameOver'
  }

  const resetGame = () => {
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    setNextDirection(INITIAL_DIRECTION)
    directionRef.current = INITIAL_DIRECTION
    setScore(0)
    setFood(generateFood())
    setGameState('start')
    gameStateRef.current = 'start'
  }

  const renderCell = (x, y) => {
    const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y
    const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y)
    const isFood = food.x === x && food.y === y

    if (isSnakeHead) {
      return <div key={`${x}-${y}`} className="snake-cell snake-head" />
    }
    if (isSnakeBody) {
      return <div key={`${x}-${y}`} className="snake-cell snake-body" />
    }
    if (isFood) {
      return <div key={`${x}-${y}`} className="snake-cell snake-food">🍎</div>
    }
    return <div key={`${x}-${y}`} className="snake-cell" />
  }

  return (
    <div className="snake-container">
      <div className="snake-game-wrapper">
        <div className="snake-header">
          <div className="snake-score">
            <div className="score-item">
              <span className="score-label">Score</span>
              <span className="score-value">{score}</span>
            </div>
            <div className="score-item">
              <span className="score-label">High Score</span>
              <span className="score-value">{highScore}</span>
            </div>
          </div>
          {gameState === 'playing' && (
            <button onClick={pauseGame} className="snake-pause-btn">⏸ Pause</button>
          )}
        </div>

        <div className="snake-board">
          {Array.from({ length: GRID_SIZE }).map((_, y) => (
            <div key={y} className="snake-row">
              {Array.from({ length: GRID_SIZE }).map((_, x) => renderCell(x, y))}
            </div>
          ))}
        </div>

        {/* Start Screen */}
        {gameState === 'start' && (
          <div className="snake-overlay">
            <div className="snake-menu">
              <h2 className="snake-menu-title">🐍 Snake Game</h2>
              <p className="snake-menu-subtitle">Use Arrow Keys or WASD to move</p>
              <button onClick={startGame} className="snake-menu-btn">Start Game</button>
              {highScore > 0 && (
                <p className="snake-high-score-display">High Score: {highScore}</p>
              )}
            </div>
          </div>
        )}

        {/* Paused Screen */}
        {gameState === 'paused' && (
          <div className="snake-overlay">
            <div className="snake-menu">
              <h2 className="snake-menu-title">⏸ Paused</h2>
              <p className="snake-menu-subtitle">Press SPACE or P to resume</p>
              <div className="snake-menu-buttons">
                <button onClick={resumeGame} className="snake-menu-btn">Resume</button>
                <button onClick={resetGame} className="snake-menu-btn snake-btn-secondary">Menu</button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameOver' && (
          <div className="snake-overlay">
            <div className="snake-menu">
              <h2 className="snake-menu-title">Game Over!</h2>
              <p className="snake-menu-score">Final Score: {score}</p>
              {score >= highScore && score > 0 && (
                <p className="snake-new-record">🏆 New High Score! 🏆</p>
              )}
              <div className="snake-menu-buttons">
                <button onClick={startGame} className="snake-menu-btn">Play Again</button>
                <button onClick={resetGame} className="snake-menu-btn snake-btn-secondary">Menu</button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {gameState === 'playing' && (
          <div className="snake-instructions">
            <p>Arrow Keys / WASD to move • SPACE to pause</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Snake

