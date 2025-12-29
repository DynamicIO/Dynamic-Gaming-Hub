import React, { useState, useEffect, useRef, useCallback } from 'react'
import './Tetris.css'

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const CELL_SIZE = 25

// Tetromino shapes
const TETROMINOS = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: '#00f0f0'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#f0f000'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1]
    ],
    color: '#a000f0'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0]
    ],
    color: '#00f000'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1]
    ],
    color: '#f00000'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1]
    ],
    color: '#0000f0'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1]
    ],
    color: '#f0a000'
  }
}

const TETROMINO_NAMES = Object.keys(TETROMINOS)

function Tetris() {
  const [board, setBoard] = useState(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)))
  const [currentPiece, setCurrentPiece] = useState(null)
  const [nextPiece, setNextPiece] = useState(null)
  const [piecePosition, setPiecePosition] = useState({ x: 0, y: 0 })
  const [gameState, setGameState] = useState('menu') // menu, playing, paused, gameOver
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [highScore, setHighScore] = useState(0)
  const [dropTime, setDropTime] = useState(null)
  const [keys, setKeys] = useState({ left: false, right: false, down: false })
  
  const gameLoopRef = useRef(null)
  const dropTimeRef = useRef(null)

  useEffect(() => {
    // Load high score
    const saved = localStorage.getItem('tetrisHighScore')
    if (saved) {
      setHighScore(parseInt(saved))
    }
  }, [])

  const createPiece = () => {
    const name = TETROMINO_NAMES[Math.floor(Math.random() * TETROMINO_NAMES.length)]
    return {
      name,
      shape: TETROMINOS[name].shape,
      color: TETROMINOS[name].color
    }
  }

  const rotatePiece = (piece) => {
    const rows = piece.shape.length
    const cols = piece.shape[0].length
    const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0))
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotated[j][rows - 1 - i] = piece.shape[i][j]
      }
    }
    
    return { ...piece, shape: rotated }
  }

  const isValidPosition = (piece, position, board) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = position.x + x
          const newY = position.y + y
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false
          }
          
          if (newY >= 0 && board[newY][newX]) {
            return false
          }
        }
      }
    }
    return true
  }

  const placePiece = (piece, position, board) => {
    const newBoard = board.map(row => [...row])
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = position.y + y
          const boardX = position.x + x
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.color
          }
        }
      }
    }
    
    return newBoard
  }

  const clearLines = (board) => {
    const newBoard = []
    let linesCleared = 0
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (board[y].every(cell => cell !== 0)) {
        linesCleared++
      } else {
        newBoard.unshift(board[y])
      }
    }
    
    // Add empty rows at top
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0))
    }
    
    return { board: newBoard, linesCleared }
  }

  const spawnPiece = useCallback(() => {
    const piece = nextPiece || createPiece()
    const newNextPiece = createPiece()
    const startX = Math.floor(BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2)
    
    setCurrentPiece(piece)
    setNextPiece(newNextPiece)
    setPiecePosition({ x: startX, y: 0 })
    
    // Check game over
    if (!isValidPosition(piece, { x: startX, y: 0 }, board)) {
      setGameState('gameOver')
      if (score > highScore) {
        setHighScore(score)
        localStorage.setItem('tetrisHighScore', score.toString())
      }
    }
  }, [nextPiece, board, score, highScore])

  const dropPiece = useCallback(() => {
    if (!currentPiece || gameState !== 'playing') return

    const newPosition = { ...piecePosition, y: piecePosition.y + 1 }
    
    if (isValidPosition(currentPiece, newPosition, board)) {
      setPiecePosition(newPosition)
    } else {
      // Place piece on board
      const newBoard = placePiece(currentPiece, piecePosition, board)
      const { board: clearedBoard, linesCleared } = clearLines(newBoard)
      
      setBoard(clearedBoard)
      
      // Update score
      if (linesCleared > 0) {
        const points = [0, 100, 300, 500, 800][linesCleared] * level
        setScore(prev => prev + points)
        setLines(prev => {
          const newLines = prev + linesCleared
          setLevel(Math.floor(newLines / 10) + 1)
          return newLines
        })
      }
      
      spawnPiece()
    }
  }, [currentPiece, piecePosition, board, gameState, spawnPiece, level])

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
        movePiece(-1, 0)
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault()
        movePiece(1, 0)
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault()
        dropPiece()
        break
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault()
        rotateCurrentPiece()
        break
      case ' ':
      case 'p':
      case 'P':
        e.preventDefault()
        pauseGame()
        break
      default:
        break
    }
  }, [gameState, dropPiece])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const movePiece = (deltaX, deltaY) => {
    if (!currentPiece) return
    
    const newPosition = {
      x: piecePosition.x + deltaX,
      y: piecePosition.y + deltaY
    }
    
    if (isValidPosition(currentPiece, newPosition, board)) {
      setPiecePosition(newPosition)
    }
  }

  const rotateCurrentPiece = () => {
    if (!currentPiece) return
    
    const rotated = rotatePiece(currentPiece)
    if (isValidPosition(rotated, piecePosition, board)) {
      setCurrentPiece(rotated)
    }
  }

  const startGame = () => {
    const newBoard = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
    setBoard(newBoard)
    setScore(0)
    setLines(0)
    setLevel(1)
    setGameState('playing')
    setNextPiece(createPiece())
    spawnPiece()
    setDropTime(Date.now())
  }

  const pauseGame = () => {
    setGameState('paused')
  }

  const resumeGame = () => {
    setGameState('playing')
    setDropTime(Date.now())
  }

  const resetGame = () => {
    setGameState('menu')
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)))
    setCurrentPiece(null)
    setNextPiece(null)
    setScore(0)
    setLines(0)
    setLevel(1)
  }

  // Game loop for dropping pieces
  useEffect(() => {
    if (gameState === 'playing' && dropTime) {
      const speed = Math.max(100, 1000 - (level - 1) * 100)
      
      dropTimeRef.current = setInterval(() => {
        dropPiece()
        setDropTime(Date.now())
      }, speed)
      
      return () => {
        if (dropTimeRef.current) {
          clearInterval(dropTimeRef.current)
        }
      }
    }
  }, [gameState, dropTime, level, dropPiece])

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row])
    
    // Draw current piece
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = piecePosition.y + y
            const boardX = piecePosition.x + x
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color
            }
          }
        }
      }
    }
    
    return displayBoard
  }

  const displayBoard = renderBoard()

  return (
    <div className="tetris-container">
      <div className="tetris-wrapper">
        {/* Menu Screen */}
        {gameState === 'menu' && (
          <div className="tetris-menu">
            <h1 className="tetris-title">🎮 Tetris</h1>
            <p className="tetris-subtitle">Classic falling blocks puzzle!</p>
            
            {highScore > 0 && (
              <div className="tetris-high-score">
                <span className="high-score-label">High Score:</span>
                <span className="high-score-value">{highScore.toLocaleString()}</span>
              </div>
            )}

            <div className="tetris-controls-info">
              <h3>Controls</h3>
              <div className="controls-list">
                <div className="control-item">
                  <span className="control-key">← →</span>
                  <span className="control-desc">Move</span>
                </div>
                <div className="control-item">
                  <span className="control-key">↑</span>
                  <span className="control-desc">Rotate</span>
                </div>
                <div className="control-item">
                  <span className="control-key">↓</span>
                  <span className="control-desc">Soft Drop</span>
                </div>
                <div className="control-item">
                  <span className="control-key">P</span>
                  <span className="control-desc">Pause</span>
                </div>
              </div>
            </div>

            <button onClick={startGame} className="tetris-start-btn">
              Start Game
            </button>
          </div>
        )}

        {/* Game Screen */}
        {gameState === 'playing' && (
          <div className="tetris-game">
            <div className="tetris-sidebar">
              <div className="tetris-stats">
                <div className="stat-item">
                  <span className="stat-label">Score</span>
                  <span className="stat-value">{score.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Lines</span>
                  <span className="stat-value">{lines}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Level</span>
                  <span className="stat-value">{level}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">High Score</span>
                  <span className="stat-value">{highScore.toLocaleString()}</span>
                </div>
              </div>

              {nextPiece && (
                <div className="tetris-next">
                  <h3>Next</h3>
                  <div className="next-piece-preview">
                    {nextPiece.shape.map((row, y) => (
                      <div key={y} className="next-piece-row">
                        {row.map((cell, x) => (
                          <div
                            key={x}
                            className="next-piece-cell"
                            style={{
                              backgroundColor: cell ? nextPiece.color : 'transparent'
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={pauseGame} className="tetris-pause-btn">
                Pause
              </button>
            </div>

            <div className="tetris-board-container">
              <div className="tetris-board">
                {displayBoard.map((row, y) => (
                  <div key={y} className="tetris-row">
                    {row.map((cell, x) => (
                      <div
                        key={x}
                        className="tetris-cell"
                        style={{
                          backgroundColor: cell || 'transparent',
                          border: cell ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Paused Screen */}
        {gameState === 'paused' && (
          <div className="tetris-overlay">
            <div className="tetris-pause-menu">
              <h2 className="pause-title">⏸ Paused</h2>
              <p className="pause-hint">Press SPACE or P to resume</p>
              <div className="pause-buttons">
                <button onClick={resumeGame} className="tetris-btn">
                  Resume
                </button>
                <button onClick={resetGame} className="tetris-btn secondary">
                  Main Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameOver' && (
          <div className="tetris-overlay">
            <div className="tetris-result">
              <h2 className="result-title">💥 Game Over!</h2>
              <div className="result-stats">
                <div className="result-stat">
                  <span className="result-label">Final Score</span>
                  <span className="result-value">{score.toLocaleString()}</span>
                </div>
                <div className="result-stat">
                  <span className="result-label">Lines Cleared</span>
                  <span className="result-value">{lines}</span>
                </div>
                <div className="result-stat">
                  <span className="result-label">Level Reached</span>
                  <span className="result-value">{level}</span>
                </div>
                {score >= highScore && score > 0 && (
                  <div className="result-stat new-record">
                    <span className="result-label">🏆 New High Score! 🏆</span>
                  </div>
                )}
              </div>
              <div className="result-buttons">
                <button onClick={startGame} className="tetris-btn">
                  Play Again
                </button>
                <button onClick={resetGame} className="tetris-btn secondary">
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

export default Tetris

