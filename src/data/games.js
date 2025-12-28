import { lazy } from 'react'

// Lazy load game components for better performance
const FlyingBirdie2 = lazy(() => import('../games/FlyingBirdie2'))
const BannanaGame = lazy(() => import('../games/BannanaGame'))
const PingPong = lazy(() => import('../games/PingPong'))
const RockPaperScissors = lazy(() => import('../games/RockPaperScissors'))

export const games = [
  {
    id: 'flying-birdie-2',
    name: 'Flying Birdie 2',
    description: 'Navigate the neon skies with power-ups, combos, and unlockable bird skins!',
    icon: '🌟',
    component: FlyingBirdie2,
    image: null
  },
  {
    id: 'bannana-game',
    name: 'Banana Clicking Game',
    description: 'Click the banana as fast as you can! Test your clicking speed in timed challenges.',
    icon: '🍌',
    component: BannanaGame,
    image: null
  },
  {
    id: 'pingpong',
    name: 'Neon Pong',
    description: 'A modern, fast, and gorgeous ping pong game. Play offline, compete, and collect skins!',
    icon: '🏓',
    component: PingPong,
    image: null
  },
  {
    id: 'rock-paper-scissors',
    name: 'Rock Paper Scissors',
    description: 'Classic game with modern design! Challenge the AI and build your winning streak!',
    icon: '✂️',
    component: RockPaperScissors,
    image: null
  }
  // More games will be added here
]

