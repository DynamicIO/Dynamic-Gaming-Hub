import React, { useState, useRef, useEffect } from 'react'
import './RockPaperScissors.css'

const CHOICES = {
  ROCK: { name: 'rock', emoji: '🪨' },
  PAPER: { name: 'paper', emoji: '📄' },
  SCISSORS: { name: 'scissors', emoji: '✂️' },
}

const getWinner = (player, computer) => {
  if (player === computer) return 'draw'
  if (
    (player === 'rock' && computer === 'scissors') ||
    (player === 'paper' && computer === 'rock') ||
    (player === 'scissors' && computer === 'paper')
  ) {
    return 'player'
  }
  return 'computer'
}

function RockPaperScissors() {
  const [isLoading, setIsLoading] = useState(true)
  const [playerChoice, setPlayerChoice] = useState(null)
  const [computerChoice, setComputerChoice] = useState(null)
  const [result, setResult] = useState(null)
  const [score, setScore] = useState({ player: 0, computer: 0 })
  const [streak, setStreak] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [animatingChoice, setAnimatingChoice] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const playGame = (choice) => {
    if (isPlaying) return

    setIsPlaying(true)
    setShowResult(false)
    setPlayerChoice(choice)
    setAnimatingChoice(true)

    const choices = ['rock', 'paper', 'scissors']
    let counter = 0
    const interval = setInterval(() => {
      setComputerChoice(choices[counter % 3])
      counter++
    }, 100)

    setTimeout(() => {
      clearInterval(interval)
      const computerFinal = choices[Math.floor(Math.random() * 3)]
      setComputerChoice(computerFinal)
      setAnimatingChoice(false)

      const winner = getWinner(choice, computerFinal)
      setResult(winner)

      if (winner === 'player') {
        setScore((prev) => ({ ...prev, player: prev.player + 1 }))
        setStreak((prev) => prev + 1)
      } else if (winner === 'computer') {
        setScore((prev) => ({ ...prev, computer: prev.computer + 1 }))
        setStreak(0)
      }

      setShowResult(true)
      setIsPlaying(false)
    }, 1200)
  }

  const resetGame = () => {
    setPlayerChoice(null)
    setComputerChoice(null)
    setResult(null)
    setShowResult(false)
  }

  const resetScore = () => {
    setScore({ player: 0, computer: 0 })
    setStreak(0)
    resetGame()
  }

  const getResultText = () => {
    if (!result) return ''
    if (result === 'draw') return "IT'S A DRAW! 🤝"
    if (result === 'player') return '🎉 YOU WIN! 🎉'
    return '😢 YOU LOSE! 😢'
  }

  const getResultColor = () => {
    if (!result) return '#666'
    if (result === 'draw') return '#FFA500'
    if (result === 'player') return '#00FF87'
    return '#FF4757'
  }

  if (isLoading) {
    return (
      <div className="rps-loading">
        <div className="rps-loading-content">
          <h1 className="rps-loading-title">ROCK PAPER SCISSORS</h1>
          <div className="rps-loading-spinner"></div>
          <p className="rps-loading-text">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rps-container">
      <div className="rps-content">
        {/* Header with Score */}
        <div className="rps-header">
          <h1 className="rps-title">ROCK PAPER SCISSORS</h1>
          <div className="rps-score-container">
            <div className="rps-score-box">
              <div className="rps-score-label">YOU</div>
              <div className="rps-score-value">{score.player}</div>
            </div>
            <div className="rps-score-divider"></div>
            <div className="rps-score-box">
              <div className="rps-score-label">AI</div>
              <div className="rps-score-value">{score.computer}</div>
            </div>
          </div>
          {streak > 1 && (
            <div className="rps-streak-badge">
              🔥 {streak} WIN STREAK!
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="rps-game-area">
          {/* Computer Choice */}
          <div className="rps-choice-area">
            <div className="rps-label">AI OPPONENT</div>
            <div className={`rps-choice-circle rps-computer-circle ${animatingChoice ? 'rps-animating' : ''}`}>
              {computerChoice ? (
                <div className="rps-choice-emoji">
                  {CHOICES[computerChoice.toUpperCase()].emoji}
                </div>
              ) : (
                <div className="rps-robot-icon">🤖</div>
              )}
            </div>
          </div>

          {/* VS Divider */}
          <div className="rps-vs-divider">
            <div className="rps-vs-circle">
              <span className="rps-vs-text">VS</span>
            </div>
          </div>

          {/* Player Choice */}
          <div className="rps-choice-area">
            <div className="rps-label">YOU</div>
            <div className="rps-choice-circle rps-player-circle">
              {playerChoice ? (
                <div className="rps-choice-emoji">
                  {CHOICES[playerChoice.toUpperCase()].emoji}
                </div>
              ) : (
                <div className="rps-player-icon">👤</div>
              )}
            </div>
          </div>
        </div>

        {/* Result Display */}
        {showResult && (
          <div className="rps-result-container">
            <div className="rps-result-box" style={{ borderColor: getResultColor() }}>
              <div className="rps-result-text" style={{ color: getResultColor() }}>
                {getResultText()}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="rps-button-container">
          {Object.values(CHOICES).map((choice) => (
            <button
              key={choice.name}
              onClick={() => playGame(choice.name)}
              disabled={isPlaying}
              className={`rps-button ${isPlaying ? 'rps-button-disabled' : ''}`}
            >
              <div className="rps-button-emoji">{choice.emoji}</div>
              <div className="rps-button-text">{choice.name.toUpperCase()}</div>
            </button>
          ))}
        </div>

        {/* Control Buttons */}
        <div className="rps-control-buttons">
          {(playerChoice || computerChoice) && (
            <button onClick={resetGame} className="rps-control-button">
              NEW ROUND
            </button>
          )}
          {(score.player > 0 || score.computer > 0) && (
            <button onClick={resetScore} className="rps-control-button rps-reset-button">
              RESET SCORE
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="rps-footer">
          <p className="rps-powered-by">Powered by Dynamic.IO</p>
        </div>
      </div>
    </div>
  )
}

export default RockPaperScissors

