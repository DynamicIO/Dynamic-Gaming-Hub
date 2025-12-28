# Friv Games Hub

A modern React website for hosting and playing browser games.

## Features

- 🎮 Beautiful game gallery interface
- 🕹️ Play games directly in your browser
- 📱 Responsive design for all devices
- 🎯 High score tracking with localStorage
- 🚀 Fast and lightweight

## Getting Started

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Adding New Games

1. Create a new game component in `src/games/`
2. Add the game to `src/data/games.js`:
```javascript
{
  id: 'your-game-id',
  name: 'Your Game Name',
  description: 'Game description',
  icon: '🎮',
  component: YourGameComponent,
  image: null // Optional: path to game thumbnail
}
```

## Current Games

- **Flying Birdie** - Tap to flap and navigate through obstacles!

## Technologies Used

- React 18
- React Router
- Vite
- CSS3

## License

MIT

