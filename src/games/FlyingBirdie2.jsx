import React, { useRef } from 'react'
import './FlyingBirdie2.css'

function FlyingBirdie2() {
  const iframeRef = useRef(null)

  return (
    <div className="flying-birdie-2-wrapper">
      <iframe
        ref={iframeRef}
        className="flying-birdie-2-iframe"
        title="Flying Birdie 2"
        src="/Flying-Birdie-2/index.html"
        allow="autoplay"
      />
    </div>
  )
}

export default FlyingBirdie2
