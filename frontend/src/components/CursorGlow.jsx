import { useEffect } from 'react'
import { useMotionValue, useSpring, motion } from 'framer-motion'

export default function CursorGlow() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, { stiffness: 500, damping: 50 })
  const springY = useSpring(mouseY, { stiffness: 500, damping: 50 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX - 100)
      mouseY.set(e.clientY - 100)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      className="fixed pointer-events-none z-0 w-[200px] h-[200px] rounded-full"
      aria-hidden="true"
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
        }}
      />
    </motion.div>
  )
}
