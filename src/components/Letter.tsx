import { RigidBody, MeshCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, Raycaster, Plane, MathUtils, Quaternion } from 'three'
import { Text3D } from '@react-three/drei'
import type { FontData } from '@react-three/drei'
import poppinsFont from '../assets/fonts/Poppins_Medium.json'
import { useRef, useEffect, useState } from 'react'

const font = poppinsFont as unknown as FontData

// Giving each letter a rigid body allows us to apply forces to it
const SingleLetter = ({
  letter,
  x,
  y,
  homeX,
  homeY,
  onReady,
  isResetting,
  setIsResetting,
}: {
  letter: string
  x: number
  y: number
  homeX: number
  homeY: number
  onReady: (body: RapierRigidBody) => void
  isResetting: boolean
  setIsResetting: (isResetting: boolean) => void
}) => {
  const bodyRef = useRef<RapierRigidBody>(null)
  const isAnimatingHome = useRef<boolean>(false)

  const lastKick = useRef<number>(0)
  const COOLDOWN = 300
  const KICK_FORCE = 0.05

  const { camera } = useThree()

  const raycaster = new Raycaster()
  const plane = new Plane(new Vector3(0, 0, 1), 0)
  const mouseWorld = new Vector3()

  useEffect(() => {
    if (bodyRef.current) {
      onReady(bodyRef.current)
    }
  }, [onReady])

  // Resetting when button is clicked
  useEffect(() => {
    if (!isResetting || !bodyRef.current) return
    const body = bodyRef.current
    isAnimatingHome.current = true
    body.setBodyType(2, true)
    body.setLinvel(new Vector3(0, 0, 0), true)
    body.setAngvel(new Vector3(0, 0, 0), true)
  }, [isResetting])

  useFrame(() => {
    if (!isAnimatingHome.current || !bodyRef.current) return
    const body = bodyRef.current
    const pos = body.translation()
    const dx = homeX - pos.x
    const dy = homeY - pos.y
    const distance = Math.sqrt(dx ** 2 + dy ** 2)
    if (distance < 0.02) {
      isAnimatingHome.current = false
      body.setNextKinematicTranslation(new Vector3(homeX, homeY, 0))
      body.setNextKinematicRotation(new Quaternion(0, 0, 0, 1))
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      body.setAngvel({ x: 0, y: 0, z: 0 }, true)
      body.setBodyType(0, true)
    } else {
      const newX = MathUtils.lerp(pos.x, homeX, 0.1)
      const newY = MathUtils.lerp(pos.y, homeY, 0.1)
      body.setNextKinematicTranslation(new Vector3(newX, newY, 0))
      body.setNextKinematicRotation(new Quaternion(0, 0, 0, 1))
      body.setEnabledRotations(false, false, false, true)
    }
  })

  const kickLetter = (e: ThreeEvent<PointerEvent>) => {
    const now = Date.now()
    if (now - lastKick.current < COOLDOWN) return
    lastKick.current = now

    setIsResetting(false)

    if (!bodyRef.current) return
    const body = bodyRef.current

    const pos = body.translation()
    raycaster.setFromCamera(e.pointer, camera)
    raycaster.ray.intersectPlane(plane, mouseWorld)

    const directionX = pos.x - mouseWorld.x
    const directionY = pos.y - mouseWorld.y

    const length = Math.sqrt(directionX ** 2 + directionY ** 2)
    if (length < 0.1) return

    const normX = directionX / length
    const normY = directionY / length

    body.wakeUp()
    body.setEnabledRotations(false, false, true, true)
    body.applyImpulseAtPoint(
      { x: normX * KICK_FORCE, y: normY * KICK_FORCE, z: 0 },
      { x: e.point.x, y: e.point.y, z: e.point.z },
      true,
    )
  }

  return (
    <RigidBody
      enabledTranslations={[true, true, false]}
      enabledRotations={[false, false, true]}
      position={[x, 2 + y, 0]}
      restitution={0.8}
      colliders={false}
      ref={bodyRef}
    >
      <MeshCollider type="hull">
        <Text3D
          font={font}
          size={0.5}
          height={0.05}
          onPointerEnter={kickLetter}
        >
          {letter}
          <meshStandardMaterial color="black" />
        </Text3D>
      </MeshCollider>
    </RigidBody>
  )
}

// ------------------------------ Positioning Letters ------------------------------
const LETTER_SIZE = 0.5
const LETTER_GAP = 0.1

function getGlyphWidth(letter: string, size: number): number {
  const fontData = font as unknown as {
    glyphs: Record<string, { ha: number }>
    resolution: number
  }

  const glyph = fontData.glyphs[letter]
  if (!glyph) return size * 0.25 // space / missing glyph

  return (glyph.ha / fontData.resolution) * size
}

export const Letter = ({
  isResetting,
  setIsResetting,
}: {
  isResetting: boolean
  setIsResetting: (isResetting: boolean) => void
}) => {
  const word = 'Marco Baaß'
  const letters = word.split('')

  const { xPositions, totalWidth } = letters.reduce<{
    xPositions: number[]
    totalWidth: number
  }>(
    (acc, letter) => ({
      xPositions: [...acc.xPositions, acc.totalWidth],
      totalWidth:
        acc.totalWidth + getGlyphWidth(letter, LETTER_SIZE) + LETTER_GAP,
    }),
    { xPositions: [], totalWidth: 0 },
  )

  const [yPositions] = useState(() => letters.map(() => Math.random() * 0.25))
  const letterBodiesRef = useRef<RapierRigidBody[]>([])

  // 2) render letters — homeX comes from xPositions[index]
  return letters.map((letter, index) => {
    if (letter === ' ') return null

    const homeX = xPositions[index] - totalWidth / 2
    const homeY = -0.9

    return (
      <SingleLetter
        letter={letter}
        x={homeX}
        y={yPositions[index]}
        homeX={homeX}
        homeY={homeY}
        key={index}
        onReady={(body) => {
          letterBodiesRef.current[index] = body
        }}
        isResetting={isResetting}
        setIsResetting={setIsResetting}
      />
    )
  })
}
