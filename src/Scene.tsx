import { Canvas } from '@react-three/fiber'
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier'
import { Letter } from './components/Letter'
import { Suspense, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'
gsap.registerPlugin(SplitText)

import './assets/fonts.css'
import './scene.css'

export default function Scene() {
  const [isResetting, setIsResetting] = useState<boolean>(false)

  /**
   * GSAP
   */
  // Draw line
  useEffect(() => {
    const split = SplitText.create('.scene-button-text', {
      type: 'words, chars',
    })

    const lineTween = gsap.fromTo(
      '.scene-text-divider',
      {
        width: '0%',
      },
      {
        width: '70%',
        duration: 2,
        ease: 'power2.inOut',
      },
    )

    const textTween = gsap.from(split.chars, {
      opacity: 0,
      scale: 0,
      y: 50,
      duration: 0.75,
      ease: 'power2.inOut',
      stagger: { each: 0.05, from: 'random' },
    })

    return () => {
      split.revert()
      lineTween.kill()
      textTween.kill()
    }
  }, [])

  return (
    <>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <Suspense fallback={null}>
          <Physics debug={false}>
            <Letter isResetting={isResetting} setIsResetting={setIsResetting} />

            {/* Ceiling */}
            <RigidBody type="fixed" restitution={0.2}>
              <CuboidCollider
                args={[12, 2, 0.1]}
                position={[0, 5, 0]}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </RigidBody>

            {/* Floor */}
            <RigidBody type="fixed" restitution={0.2}>
              <CuboidCollider
                args={[12, 2, 0.1]}
                position={[0, -1, 0]}
                rotation={[Math.PI / 2, 0, 0]}
              />
            </RigidBody>

            {/* Left Wall */}
            <RigidBody type="fixed" restitution={0.2}>
              <CuboidCollider args={[0.1, 5, 5]} position={[-4, 2, 0]} />
            </RigidBody>

            {/* Right Wall */}
            <RigidBody type="fixed" restitution={0.2}>
              <CuboidCollider args={[0.1, 5, 5]} position={[4, 2, 0]} />
            </RigidBody>
          </Physics>
        </Suspense>
      </Canvas>

      <svg className="scene-text-divider">
        <line
          x1="0"
          y1="0"
          x2="100%"
          y2="0"
          stroke="black"
          stroke-width={4}
          fill="none"
        />
      </svg>

      <button className="scene-button" onClick={() => setIsResetting(true)}>
        <h1 className="scene-button-text">Creative Web Developer</h1>
      </button>
    </>
  )
}
