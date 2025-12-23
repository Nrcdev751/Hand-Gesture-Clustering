import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
import { HandData } from '../types';
import { COLORS } from '../constants';
import { Ring } from '@react-three/drei';

interface HandCursorProps {
  handRef: React.MutableRefObject<HandData>;
}

export const HandCursor: React.FC<HandCursorProps> = ({ handRef }) => {
  const cursorRef = useRef<Mesh>(null);
  const outerRingRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!cursorRef.current || !outerRingRef.current) return;

    const { x, y, isPinching, isPresent } = handRef.current;

    if (!isPresent) {
      cursorRef.current.visible = false;
      outerRingRef.current.visible = false;
      return;
    }

    cursorRef.current.visible = true;
    outerRingRef.current.visible = true;

    // Map normalized 2D (0-1) to 3D Viewport
    // Webcam X is usually mirrored, so we invert direction
    const { width, height } = state.viewport;
    
    // Calculate 3D position at z=0 plane
    // Hand x=0 is left (webcam mirrored means user moves right -> returns x decreasing)
    // We want user moving right -> cursor moves right.
    const targetX = (0.5 - x) * width; 
    const targetY = (0.5 - y) * height; 

    // Smooth follow
    // Z is set to 0 to match the game object plane
    cursorRef.current.position.lerp(new Vector3(targetX, targetY, 0), 0.3);
    outerRingRef.current.position.lerp(new Vector3(targetX, targetY, 0), 0.2);

    // React to Pinch
    const targetScale = isPinching ? 0.5 : 1;
    cursorRef.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), 0.2);
    
    // Color feedback
    const color = isPinching ? COLORS.cursorActive : COLORS.cursor;
    (cursorRef.current.material as any).color.set(color);
  });

  return (
    <group>
      {/* Inner Dot - renderOrder and depthTest ensure it's always visible on top */}
      <mesh ref={cursorRef} position={[0, 0, 0]} renderOrder={1}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={COLORS.cursor} depthTest={false} />
      </mesh>

      {/* Target Reticle */}
      <Ring ref={outerRingRef} args={[0.2, 0.25, 32]} position={[0, 0, 0]} renderOrder={1}>
        <meshBasicMaterial color={COLORS.cursor} transparent opacity={0.5} depthTest={false} />
      </Ring>
    </group>
  );
};