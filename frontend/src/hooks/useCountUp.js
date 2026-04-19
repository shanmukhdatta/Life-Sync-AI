import { useState, useEffect, useRef } from 'react'

export function useCountUp(target, duration = 1800, suffix = '') {
  const [count, setCount] = useState(0)
  const [inView, setInView] = useState(false)
  const ref = useRef(null)
  const animated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          setInView(true)
          animated.current = true
        }
      },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    const numericTarget = parseFloat(target)
    const startTime = performance.now()
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOut cubic
      const currentVal = Math.floor(eased * numericTarget)
      setCount(currentVal)
      if (progress < 1) requestAnimationFrame(animate)
      else setCount(numericTarget)
    }
    requestAnimationFrame(animate)
  }, [inView, target, duration])

  return { ref, displayValue: `${count}${suffix}` }
}
