import React, { useState, useEffect, useRef } from 'react'
import './ReactionTest.css'

const GAME_MODES = {
  classic: { name: 'Classic', description: 'Click when the screen turns green!' },
  sequence: { name: 'Sequence', description: 'Click in the correct order!' },
  target: { name: 'Target', description: 'Click the target as fast as you can!' }
}

function ReactionTest() {
  const [gameState, setGameState] = useState('menu') // menu, waiting, ready, active, result, finalResults
  const [gameMode, setGameMode] = useState('classic')
  const [reactionTime, setReactionTime] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState([])
  const [averageTime, setAverageTime] = useState(0)
  const [bestTime, setBestTime] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [currentRound, setCurrentRound] = useState(0)
  const [totalRounds] = useState(5)
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 })
  const [sequence, setSequence] = useState([])
  const [sequenceIndex, setSequenceIndex] = useState(0)
  
  const timeoutRef = useRef(null)
  const countdownRef = useRef(null)

  useEffect(() => {
    // Load best time
    const saved = localStorage.getItem('reactionTestBestTime')
    if (saved) {
      setBestTime(parseFloat(saved))
    }
  }, [])

  useEffect(() => {
    if (results.length > 0) {
      const avg = results.reduce((a, b) => a + b, 0) / results.length
      setAverageTime(avg)
    }
  }, [results])

  const getRandomDelay = () => {
    // Random delay between 1-4 seconds
    return Math.random() * 3000 + 1000
  }

  const startClassicGame = () => {
    setGameState('waiting')
    setReactionTime(0)
    setCurrentRound(0)
    setResults([])
    
    // Random delay before showing green
    const delay = getRandomDelay()
    
    timeoutRef.current = setTimeout(() => {
      setGameState('active')
      setStartTime(Date.now())
    }, delay)
  }

  const startSequenceGame = () => {
    setGameState('waiting')
    setReactionTime(0)
    setCurrentRound(0)
    setResults([])
    setSequenceIndex(0)
    
    // Generate random sequence of 5 positions
    const positions = []
    for (let i = 0; i < 5; i++) {
      positions.push({
        x: Math.random() * 80 + 10, // 10-90%
        y: Math.random() * 80 + 10
      })
    }
    setSequence(positions)
    
    const delay = getRandomDelay()
    timeoutRef.current = setTimeout(() => {
      setGameState('active')
      setStartTime(Date.now())
    }, delay)
  }

  const startTargetGame = () => {
    setGameState('waiting')
    setReactionTime(0)
    setCurrentRound(0)
    setResults([])
    
    const delay = getRandomDelay()
    timeoutRef.current = setTimeout(() => {
      setGameState('active')
      setStartTime(Date.now())
      // Set random target position
      setTargetPosition({
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      })
    }, delay)
  }

  const handleClick = () => {
    if (gameState === 'waiting') {
      // Clicked too early!
      clearTimeout(timeoutRef.current)
      setGameState('result')
      setReactionTime(-1) // -1 means too early
      return
    }

    if (gameState === 'active') {
      const time = Date.now() - startTime
      const timeInMs = time
      
      if (gameMode === 'classic') {
        handleClassicResult(timeInMs)
      } else if (gameMode === 'target') {
        handleTargetResult(timeInMs)
      }
    }
  }

  const handleClassicResult = (time) => {
    setReactionTime(time)
    const newResults = [...results, time]
    setResults(newResults)
    
    if (time < bestTime || bestTime === 0) {
      setBestTime(time)
      localStorage.setItem('reactionTestBestTime', time.toString())
    }
    
    setGameState('result')
    setCurrentRound(prev => prev + 1)
  }

  const handleTargetResult = (time) => {
    setReactionTime(time)
    const newResults = [...results, time]
    setResults(newResults)
    
    if (time < bestTime || bestTime === 0) {
      setBestTime(time)
      localStorage.setItem('reactionTestBestTime', time.toString())
    }
    
    setGameState('result')
    setCurrentRound(prev => prev + 1)
  }

  const handleSequenceClick = (index) => {
    if (gameState !== 'active') return
    
    if (index === sequenceIndex) {
      // Correct click
      if (index === sequence.length - 1) {
        // Sequence complete
        const time = Date.now() - startTime
        handleSequenceResult(time)
      } else {
        setSequenceIndex(prev => prev + 1)
      }
    } else {
      // Wrong click - reset
      setSequenceIndex(0)
    }
  }

  const handleSequenceResult = (time) => {
    setReactionTime(time)
    const newResults = [...results, time]
    setResults(newResults)
    
    if (time < bestTime || bestTime === 0) {
      setBestTime(time)
      localStorage.setItem('reactionTestBestTime', time.toString())
    }
    
    setGameState('result')
    setCurrentRound(prev => prev + 1)
  }

  const nextRound = () => {
    if (currentRound >= totalRounds) {
      setGameState('finalResults')
      return
    }
    
    setGameState('waiting')
    setReactionTime(0)
    
    const delay = getRandomDelay()
    timeoutRef.current = setTimeout(() => {
      setGameState('active')
      setStartTime(Date.now())
      
      if (gameMode === 'target') {
        setTargetPosition({
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10
        })
      } else if (gameMode === 'sequence') {
        const positions = []
        for (let i = 0; i < 5; i++) {
          positions.push({
            x: Math.random() * 80 + 10,
            y: Math.random() * 80 + 10
          })
        }
        setSequence(positions)
        setSequenceIndex(0)
      }
    }, delay)
  }

  const resetGame = () => {
    clearTimeout(timeoutRef.current)
    clearTimeout(countdownRef.current)
    setGameState('menu')
    setReactionTime(0)
    setCurrentRound(0)
    setResults([])
  }

  const formatTime = (ms) => {
    if (ms < 0) return 'Too Early!'
    return `${ms.toFixed(0)} ms`
  }

  const startGame = () => {
    if (gameMode === 'classic') {
      startClassicGame()
    } else if (gameMode === 'sequence') {
      startSequenceGame()
    } else if (gameMode === 'target') {
      startTargetGame()
    }
  }

  return (
    <div className="reaction-test-container">
      <div className="reaction-test-wrapper">
        {/* Menu Screen */}
        {gameState === 'menu' && (
          <div className="reaction-test-menu">
            <h1 className="reaction-test-title">⚡ Reaction Test</h1>
            <p className="reaction-test-subtitle">Test your reflexes!</p>
            
            <div className="reaction-test-modes">
              <h3>Select Game Mode</h3>
              <div className="mode-buttons">
                {Object.entries(GAME_MODES).map(([key, mode]) => (
                  <button
                    key={key}
                    onClick={() => setGameMode(key)}
                    className={`mode-btn ${gameMode === key ? 'active' : ''}`}
                  >
                    <div className="mode-name">{mode.name}</div>
                    <div className="mode-description">{mode.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {bestTime > 0 && (
              <div className="best-time-display">
                <span className="best-time-label">Best Time:</span>
                <span className="best-time-value">{formatTime(bestTime)}</span>
              </div>
            )}

            <button onClick={startGame} className="reaction-test-start-btn">
              Start Test
            </button>
          </div>
        )}

        {/* Waiting Screen */}
        {gameState === 'waiting' && (
          <div 
            className="reaction-test-screen waiting-screen"
            onClick={handleClick}
          >
            <div className="waiting-content">
              <h2 className="waiting-text">Wait for it...</h2>
              <p className="waiting-hint">Click when the screen turns GREEN!</p>
              <p className="waiting-warning">Don't click too early!</p>
            </div>
          </div>
        )}

        {/* Active Screen - Classic */}
        {gameState === 'active' && gameMode === 'classic' && (
          <div 
            className="reaction-test-screen active-screen"
            onClick={handleClick}
          >
            <div className="active-content">
              <h2 className="active-text">CLICK NOW!</h2>
            </div>
          </div>
        )}

        {/* Active Screen - Target */}
        {gameState === 'active' && gameMode === 'target' && (
          <div 
            className="reaction-test-screen active-screen"
            onClick={handleClick}
          >
            <div 
              className="target-circle"
              style={{
                left: `${targetPosition.x}%`,
                top: `${targetPosition.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={(e) => {
                e.stopPropagation()
                handleClick()
              }}
            >
              🎯
            </div>
            <div className="active-content">
              <h2 className="active-text">Click the Target!</h2>
            </div>
          </div>
        )}

        {/* Active Screen - Sequence */}
        {gameState === 'active' && gameMode === 'sequence' && (
          <div className="reaction-test-screen active-screen">
            <div className="active-content">
              <h2 className="active-text">Click in Order!</h2>
              <p className="sequence-hint">Click the circles in the order they appear</p>
            </div>
            {sequence.map((pos, index) => (
              <div
                key={index}
                className={`sequence-circle ${index === sequenceIndex ? 'active' : index < sequenceIndex ? 'completed' : ''}`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => handleSequenceClick(index)}
              >
                {index < sequenceIndex ? '✓' : index + 1}
              </div>
            ))}
          </div>
        )}

        {/* Result Screen */}
        {gameState === 'result' && (
          <div className="reaction-test-result">
            <div className="result-content">
              <h2 className="result-title">
                {reactionTime < 0 ? '❌ Too Early!' : '⚡ Reaction Time'}
              </h2>
              <div className="result-time">
                {formatTime(reactionTime)}
              </div>
              
              {reactionTime > 0 && (
                <div className="result-stats">
                  <div className="result-stat">
                    <span className="stat-label">Round</span>
                    <span className="stat-value">{currentRound}/{totalRounds}</span>
                  </div>
                  {results.length > 0 && (
                    <div className="result-stat">
                      <span className="stat-label">Average</span>
                      <span className="stat-value">{formatTime(averageTime)}</span>
                    </div>
                  )}
                  {bestTime > 0 && (
                    <div className="result-stat">
                      <span className="stat-label">Best</span>
                      <span className="stat-value">{formatTime(bestTime)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="result-buttons">
                {currentRound < totalRounds ? (
                  <button onClick={nextRound} className="reaction-test-btn">
                    Next Round
                  </button>
                ) : (
                  <button onClick={() => setGameState('finalResults')} className="reaction-test-btn">
                    View Results
                  </button>
                )}
                <button onClick={resetGame} className="reaction-test-btn secondary">
                  Main Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Final Results */}
        {gameState === 'finalResults' && results.length === totalRounds && (
          <div className="reaction-test-result">
            <div className="result-content">
              <h2 className="result-title">🎯 Final Results</h2>
              <div className="final-stats">
                <div className="final-stat">
                  <span className="final-label">Average Time</span>
                  <span className="final-value">{formatTime(averageTime)}</span>
                </div>
                <div className="final-stat">
                  <span className="final-label">Best Round</span>
                  <span className="final-value">{formatTime(Math.min(...results))}</span>
                </div>
                <div className="final-stat">
                  <span className="final-label">Best Overall</span>
                  <span className="final-value">{formatTime(bestTime)}</span>
                </div>
                <div className="final-stat">
                  <span className="final-label">All Times</span>
                  <div className="all-times">
                    {results.map((time, index) => (
                      <span key={index} className="time-item">
                        Round {index + 1}: {formatTime(time)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="result-buttons">
                <button onClick={() => {
                  setResults([])
                  setCurrentRound(0)
                  setGameState('menu')
                }} className="reaction-test-btn">
                  Play Again
                </button>
                <button onClick={resetGame} className="reaction-test-btn secondary">
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

export default ReactionTest

