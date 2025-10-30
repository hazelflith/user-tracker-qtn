import { useEffect, useRef, useState } from 'react'

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export function useAnimatedNumber(value: number, duration = 750) {
  const [displayValue, setDisplayValue] = useState(value)
  const previousValue = useRef(value)
  const animationFrame = useRef<number | null>(null)

  useEffect(() => {
    const startValue = previousValue.current
    const valueDelta = value - startValue

    if (valueDelta === 0) {
      setDisplayValue(value)
      previousValue.current = value
      return
    }

    const startTime = performance.now()

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(1, elapsed / duration)
      const easedProgress = easeOutCubic(progress)

      setDisplayValue(startValue + valueDelta * easedProgress)

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(step)
      } else {
        previousValue.current = value
        animationFrame.current = null
      }
    }

    animationFrame.current = requestAnimationFrame(step)

    return () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current)
      }
      animationFrame.current = null
    }
  }, [duration, value])

  return displayValue
}
