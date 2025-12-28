import React, { useRef, useEffect, useState } from 'react'
import './PingPong.css'

function PingPong() {
  const iframeRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    let timeoutId

    const handleLoad = () => {
      // Give the game a moment to initialize
      timeoutId = setTimeout(() => {
        setIsLoading(false)
        setHasError(false)
      }, 1000)
    }

    const handleError = () => {
      setIsLoading(false)
      setHasError(true)
      console.error('Failed to load Neon Pong game')
    }

    // Check if iframe content loaded
    try {
      // Try to access iframe content (may fail due to CORS, but that's ok)
      if (iframe.contentWindow) {
        iframe.addEventListener('load', handleLoad)
      }
    } catch (e) {
      // CORS error is expected, but iframe should still load
      console.log('Iframe CORS check (expected):', e.message)
    }

    iframe.addEventListener('error', handleError)

    // Fallback timeout
    const fallbackTimeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false)
      }
    }, 3000)

    return () => {
      iframe.removeEventListener('load', handleLoad)
      iframe.removeEventListener('error', handleError)
      clearTimeout(timeoutId)
      clearTimeout(fallbackTimeout)
    }
  }, [isLoading])

  if (hasError) {
    return (
      <div className="pingpong-wrapper">
        <div className="pingpong-error">
          <h3>Failed to load game</h3>
          <p>The game may take a moment to load. Please wait or refresh the page.</p>
          <button onClick={() => {
            setHasError(false)
            setIsLoading(true)
            if (iframeRef.current) {
              iframeRef.current.src = iframeRef.current.src
            }
          }}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="pingpong-wrapper">
      {isLoading && (
        <div className="pingpong-loading">
          <div className="pingpong-loading-spinner"></div>
          <p>Loading Neon Pong...</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="pingpong-iframe"
        title="Neon Pong"
        src="/PingPong/index.html"
        allow="autoplay; fullscreen"
        allowFullScreen
        style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.5s ease' }}
      />
    </div>
  )
}

export default PingPong

