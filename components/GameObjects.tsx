import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { GameShape, ColorType } from '../types';
import { COLORS } from '../constants';
import { RoundedBox, Sphere, Tetrahedron } from '@react-three/drei';

interface GameObjectsProps {
  shapes: GameShape[];
}

export const GameObjects: React.FC<GameObjectsProps> = ({ shapes }) => {
  return (
    <group>
      {shapes.map((shape) => (
        <SingleShape key={shape.id} shape={shape} />
      ))}
    </group>
  );
};

const SingleShape: React.FC<{ shape: GameShape }> = ({ shape }) => {
  const meshRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smooth movement to target position
      const t = shape.isGrabbed ? 0.8 : 0.1; // Snap fast if grabbed, drift slow if floating
      
      meshRef.current.position.lerp(
        { x: shape.position[0], y: shape.position[1], z: shape.position[2] } as any,
        t
      );

      // Idle animation
      if (!shape.isGrabbed && !shape.isMatched) {
        meshRef.current.rotation.x += delta * 0.5;
        meshRef.current.rotation.y += delta * 0.3;
      }

      // Success animation (spin on floor)
      if (shape.isMatched) {
        meshRef.current.rotation.y += delta * 2;
      }
    }
  });

  const materialProps = {
    color: COLORS[shape.color],
    emissive: shape.isMatched ? COLORS[shape.color] : '#000000',
    emissiveIntensity: shape.isMatched ? 0.5 : 0,
    roughness: 0.2,
    metalness: 0.1,
  };

  const commonProps = {
    ref: meshRef,
    castShadow: true,
    receiveShadow: true,
    scale: shape.isGrabbed ? 1.1 : 1,
  };

  return (
    <group>
      {shape.type === 'cube' && (
        <RoundedBox args={[0.8, 0.8, 0.8]} radius={0.1} smoothness={4} {...commonProps}>
          <meshStandardMaterial {...materialProps} />
        </RoundedBox>
      )}
      {shape.type === 'sphere' && (
        <Sphere args={[0.5, 32, 32]} {...commonProps}>
           <meshStandardMaterial {...materialProps} />
        </Sphere>
      )}
      {shape.type === 'tetrahedron' && (
        <Tetrahedron args={[0.7]} {...commonProps}>
           <meshStandardMaterial {...materialProps} />
        </Tetrahedron>
      )}
    </group>
  );
};
