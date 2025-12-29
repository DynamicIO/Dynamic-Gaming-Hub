import { lazy } from 'react'

// Lazy load game components for better performance
const FlyingBirdie2 = lazy(() => import('../games/FlyingBirdie2'))
const BannanaGame = lazy(() => import('../games/BannanaGame'))
const PingPong = lazy(() => import('../games/PingPong'))
const RockPaperScissors = lazy(() => import('../games/RockPaperScissors'))
const Snake = lazy(() => import('../games/Snake'))
const MemoryMatch = lazy(() => import('../games/MemoryMatch'))
const ReactionTest = lazy(() => import('../games/ReactionTest'))
const Wordle = lazy(() => import('../games/Wordle'))
const DodgeGame = lazy(() => import('../games/DodgeGame'))
const Tetris = lazy(() => import('../games/Tetris'))
const SpaceShooter = lazy(() => import('../games/SpaceShooter'))

export const games = [
  {
    id: 'flying-birdie-2',
    name: 'Flying Birdie 2',
    description: 'Navigate the neon skies with power-ups, combos, and unlockable bird skins!',
    icon: '🌟',
    component: FlyingBirdie2,
    image: '/assets/screenshots/game-1.png'
  },
  {
    id: 'bannana-game',
    name: 'Banana Clicking Game',
    description: 'Click the banana as fast as you can! Test your clicking speed in timed challenges.',
    icon: '🍌',
    component: BannanaGame,
    image: '/assets/screenshots/game-2.png'
  },
  {
    id: 'pingpong',
    name: 'Neon Pong',
    description: 'A modern, fast, and gorgeous ping pong game. Play offline, compete, and collect skins!',
    icon: '🏓',
    component: PingPong,
    image: '/assets/screenshots/game-3.png'
  },
  {
    id: 'rock-paper-scissors',
    name: 'Rock Paper Scissors',
    description: 'Classic game with modern design! Challenge the AI and build your winning streak!',
    icon: '✂️',
    component: RockPaperScissors,
    image: '/assets/screenshots/game-4.png'
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Classic Snake game with modern neon styling! Grow longer and avoid hitting yourself!',
    icon: '🐍',
    component: Snake,
    image: null
  },
  {
    id: 'memory-match',
    name: 'Memory Match',
    description: 'Test your memory! Find all matching pairs before time runs out. Multiple difficulty levels!',
    icon: '🧠',
    component: MemoryMatch,
    image: null
  },
  {
    id: 'reaction-test',
    name: 'Reaction Test',
    description: 'Test your reflexes! Click as fast as you can when the screen turns green. Multiple game modes!',
    icon: '⚡',
    component: ReactionTest,
    image: null
  },
  {
    id: 'wordle',
    name: 'Wordle',
    description: 'Guess the 5-letter word in 6 tries! Green = correct position, Yellow = wrong position, Gray = not in word.',
    icon: '📝',
    component: Wordle,
    image: null
  },
  {
    id: 'dodge-game',
    name: 'Dodge Game',
    description: 'Avoid the obstacles! Move with Arrow Keys or WASD. Survive as long as you can!',
    icon: '🎮',
    component: DodgeGame,
    image: null
  },
  {
    id: 'tetris',
    name: 'Tetris',
    description: 'Classic falling blocks puzzle! Clear lines to score points. Rotate and move pieces to survive!',
    icon: '🎮',
    component: Tetris,
    image: null
  },
  {
    id: 'space-shooter',
    name: 'Space Shooter',
    description: 'Top-down space shooter! Defend Earth from alien invaders. Collect power-ups and survive the waves!',
    icon: '🚀',
    component: SpaceShooter,
    image: null
  }
  // More games will be added here
]

