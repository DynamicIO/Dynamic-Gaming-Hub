import React, { useState, useEffect, useCallback } from 'react'
import './Wordle.css'

// Common 5-letter words
const WORDS = [
  'APPLE', 'BRAVE', 'CLOUD', 'DREAM', 'EARTH', 'FLAME', 'GLASS', 'HEART',
  'IMAGE', 'JAZZY', 'KNIFE', 'LIGHT', 'MAGIC', 'NIGHT', 'OCEAN', 'PIANO',
  'QUICK', 'RIVER', 'STORM', 'TIGER', 'UNITY', 'VALUE', 'WATER', 'YOUTH',
  'ZEBRA', 'BEACH', 'CHAIR', 'DANCE', 'EAGLE', 'FROST', 'GHOST', 'HAPPY',
  'IVORY', 'JUMPS', 'KINGS', 'LEMON', 'MUSIC', 'NOISE', 'OLIVE', 'PEACE',
  'QUART', 'ROBOT', 'SMILE', 'TRAIN', 'URBAN', 'VIBES', 'WHEEL', 'XENON',
  'YACHT', 'ZONES', 'BREAD', 'CRANE', 'DRIVE', 'ELITE', 'FOCUS', 'GRAIN',
  'HONEY', 'IDEAL', 'JOKER', 'KNOCK', 'LEARN', 'MONEY', 'NURSE', 'OPERA',
  'POWER', 'QUEST', 'RADIO', 'SCOUT', 'TRUTH', 'USAGE', 'VITAL', 'WOMAN',
  'YIELD', 'ZONAL', 'BLAZE', 'CRISP', 'DROWN', 'EMPTY', 'FLAIR', 'GRACE',
  'HUMOR', 'INBOX', 'JUMBO', 'KNEAD', 'LUNCH', 'MERRY', 'NOVEL', 'OZONE',
  'PILOT', 'QUERY', 'RAPID', 'SCORE', 'TULIP', 'ULTRA', 'VAPOR', 'WALTZ',
  'YELLS', 'ZILCH'
]

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function Wordle() {
  const [targetWord, setTargetWord] = useState('')
  const [guesses, setGuesses] = useState([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [gameState, setGameState] = useState('menu') // menu, playing, won, lost
  const [letterStates, setLetterStates] = useState({}) // 'correct', 'present', 'absent'
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [gamesWon, setGamesWon] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [guessDistribution, setGuessDistribution] = useState({})

  useEffect(() => {
    // Load stats
    const stats = localStorage.getItem('wordleStats')
    if (stats) {
      const parsed = JSON.parse(stats)
      setGamesPlayed(parsed.gamesPlayed || 0)
      setGamesWon(parsed.gamesWon || 0)
      setCurrentStreak(parsed.currentStreak || 0)
      setMaxStreak(parsed.maxStreak || 0)
      setGuessDistribution(parsed.guessDistribution || {})
    }
  }, [])

  const saveStats = useCallback(() => {
    const stats = {
      gamesPlayed,
      gamesWon,
      currentStreak,
      maxStreak,
      guessDistribution
    }
    localStorage.setItem('wordleStats', JSON.stringify(stats))
  }, [gamesPlayed, gamesWon, currentStreak, maxStreak, guessDistribution])

  const startNewGame = () => {
    // Pick random word
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)]
    setTargetWord(randomWord)
    setGuesses([])
    setCurrentGuess('')
    setGameState('playing')
    setLetterStates({})
  }

  const handleKeyPress = useCallback((key) => {
    if (gameState !== 'playing') return

    if (key === 'ENTER') {
      if (currentGuess.length === 5) {
        submitGuess()
      }
    } else if (key === 'BACKSPACE' || key === 'DELETE') {
      setCurrentGuess(prev => prev.slice(0, -1))
    } else if (key.length === 1 && key.match(/[A-Za-z]/)) {
      if (currentGuess.length < 5) {
        setCurrentGuess(prev => prev + key.toUpperCase())
      }
    }
  }, [currentGuess, gameState])

  useEffect(() => {
    const handleKeyboard = (e) => {
      if (gameState !== 'playing') return
      
      if (e.key === 'Enter') {
        handleKeyPress('ENTER')
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleKeyPress('BACKSPACE')
      } else if (e.key.match(/^[A-Za-z]$/)) {
        handleKeyPress(e.key.toUpperCase())
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [handleKeyPress, gameState])

  const submitGuess = () => {
    if (currentGuess.length !== 5) return
    if (!WORDS.includes(currentGuess)) {
      alert('Not a valid word!')
      return
    }

    const newGuesses = [...guesses, currentGuess]
    setGuesses(newGuesses)
    
    // Check win condition
    if (currentGuess === targetWord) {
      setGameState('won')
      const guessCount = newGuesses.length
      setGamesPlayed(prev => prev + 1)
      setGamesWon(prev => prev + 1)
      setCurrentStreak(prev => {
        const newStreak = prev + 1
        setMaxStreak(prevMax => Math.max(prevMax, newStreak))
        return newStreak
      })
      setGuessDistribution(prev => ({
        ...prev,
        [guessCount]: (prev[guessCount] || 0) + 1
      }))
      saveStats()
      return
    }

    // Check lose condition
    if (newGuesses.length >= 6) {
      setGameState('lost')
      setGamesPlayed(prev => prev + 1)
      setCurrentStreak(0)
      saveStats()
      return
    }

    // Update letter states
    const newLetterStates = { ...letterStates }
    const targetLetters = targetWord.split('')
    const guessLetters = currentGuess.split('')

    guessLetters.forEach((letter, index) => {
      if (targetLetters[index] === letter) {
        newLetterStates[letter] = 'correct'
      } else if (targetLetters.includes(letter)) {
        if (newLetterStates[letter] !== 'correct') {
          newLetterStates[letter] = 'present'
        }
      } else {
        if (!newLetterStates[letter]) {
          newLetterStates[letter] = 'absent'
        }
      }
    })

    setLetterStates(newLetterStates)
    setCurrentGuess('')
  }

  const getLetterState = (letter, index, guess) => {
    if (!guess) return ''
    
    const targetLetters = targetWord.split('')
    const guessLetters = guess.split('')

    if (targetLetters[index] === letter) {
      return 'correct'
    } else if (targetLetters.includes(letter)) {
      // Check if it's already marked as correct in this position
      const letterCountInTarget = targetLetters.filter(l => l === letter).length
      const letterCountInGuess = guessLetters.filter(l => l === letter).length
      
      if (letterCountInGuess > letterCountInTarget) {
        // Need to check if this specific instance should be marked
        const correctCount = guessLetters.filter((l, i) => l === letter && targetLetters[i] === letter).length
        const presentCount = guessLetters.slice(0, index).filter(l => l === letter && targetLetters.includes(l) && targetLetters[guessLetters.indexOf(l)] !== l).length
        
        if (correctCount + presentCount >= letterCountInTarget) {
          return 'absent'
        }
      }
      return 'present'
    } else {
      return 'absent'
    }
  }

  const getLetterKeyState = (letter) => {
    return letterStates[letter] || ''
  }

  const resetGame = () => {
    setGameState('menu')
    setGuesses([])
    setCurrentGuess('')
    setLetterStates({})
  }

  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0

  return (
    <div className="wordle-container">
      <div className="wordle-wrapper">
        {/* Menu Screen */}
        {gameState === 'menu' && (
          <div className="wordle-menu">
            <h1 className="wordle-title">📝 Wordle</h1>
            <p className="wordle-subtitle">Guess the 5-letter word in 6 tries!</p>
            
            {(gamesPlayed > 0 || maxStreak > 0) && (
              <div className="wordle-stats-preview">
                <div className="stat-preview-item">
                  <span className="stat-preview-label">Games Played</span>
                  <span className="stat-preview-value">{gamesPlayed}</span>
                </div>
                <div className="stat-preview-item">
                  <span className="stat-preview-label">Win Rate</span>
                  <span className="stat-preview-value">{winRate}%</span>
                </div>
                <div className="stat-preview-item">
                  <span className="stat-preview-label">Current Streak</span>
                  <span className="stat-preview-value">{currentStreak}</span>
                </div>
                <div className="stat-preview-item">
                  <span className="stat-preview-label">Max Streak</span>
                  <span className="stat-preview-value">{maxStreak}</span>
                </div>
              </div>
            )}

            <button onClick={startNewGame} className="wordle-start-btn">
              New Game
            </button>
          </div>
        )}

        {/* Game Screen */}
        {gameState === 'playing' && (
          <div className="wordle-game">
            <div className="wordle-header">
              <h2 className="wordle-game-title">Wordle</h2>
              <button onClick={resetGame} className="wordle-menu-btn">Menu</button>
            </div>

            <div className="wordle-grid">
              {Array.from({ length: 6 }).map((_, rowIndex) => {
                const guess = guesses[rowIndex] || ''
                const isCurrentRow = rowIndex === guesses.length
                
                return (
                  <div key={rowIndex} className="wordle-row">
                    {Array.from({ length: 5 }).map((_, colIndex) => {
                      const letter = guess[colIndex] || (isCurrentRow ? currentGuess[colIndex] : '')
                      const state = guess ? getLetterState(letter, colIndex, guess) : ''
                      const isActive = isCurrentRow && colIndex === currentGuess.length
                      
                      return (
                        <div
                          key={colIndex}
                          className={`wordle-cell ${state} ${isActive ? 'active' : ''}`}
                        >
                          {letter}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            <div className="wordle-keyboard">
              <div className="keyboard-row">
                {ALPHABET.slice(0, 10).map(letter => (
                  <button
                    key={letter}
                    onClick={() => handleKeyPress(letter)}
                    className={`keyboard-key ${getLetterKeyState(letter)}`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
              <div className="keyboard-row">
                {ALPHABET.slice(10, 19).map(letter => (
                  <button
                    key={letter}
                    onClick={() => handleKeyPress(letter)}
                    className={`keyboard-key ${getLetterKeyState(letter)}`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
              <div className="keyboard-row">
                <button
                  onClick={() => handleKeyPress('ENTER')}
                  className="keyboard-key keyboard-key-enter"
                >
                  ENTER
                </button>
                {ALPHABET.slice(19).map(letter => (
                  <button
                    key={letter}
                    onClick={() => handleKeyPress(letter)}
                    className={`keyboard-key ${getLetterKeyState(letter)}`}
                  >
                    {letter}
                  </button>
                ))}
                <button
                  onClick={() => handleKeyPress('BACKSPACE')}
                  className="keyboard-key keyboard-key-backspace"
                >
                  ⌫
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Win Screen */}
        {gameState === 'won' && (
          <div className="wordle-overlay">
            <div className="wordle-result">
              <h2 className="result-title">🎉 You Won! 🎉</h2>
              <p className="result-word">The word was: <strong>{targetWord}</strong></p>
              <p className="result-guesses">You guessed it in {guesses.length} {guesses.length === 1 ? 'try' : 'tries'}!</p>
              <div className="result-buttons">
                <button onClick={startNewGame} className="wordle-btn">
                  Play Again
                </button>
                <button onClick={resetGame} className="wordle-btn secondary">
                  Main Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lose Screen */}
        {gameState === 'lost' && (
          <div className="wordle-overlay">
            <div className="wordle-result">
              <h2 className="result-title">😔 Game Over</h2>
              <p className="result-word">The word was: <strong>{targetWord}</strong></p>
              <p className="result-guesses">Better luck next time!</p>
              <div className="result-buttons">
                <button onClick={startNewGame} className="wordle-btn">
                  Try Again
                </button>
                <button onClick={resetGame} className="wordle-btn secondary">
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

export default Wordle

