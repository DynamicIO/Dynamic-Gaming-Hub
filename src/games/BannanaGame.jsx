import React, { useRef } from 'react'
import './BannanaGame.css'

function BannanaGame() {
  const iframeRef = useRef(null)

  return (
    <div className="bannana-game-wrapper">
      <iframe
        ref={iframeRef}
        className="bannana-game-iframe"
        title="Banana Clicking Game"
        src="/BannanaGame/index.html"
        allow="autoplay"
      />
    </div>
  )
}

export default BannanaGame


