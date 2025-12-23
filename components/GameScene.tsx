import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import { Vector3 } from 'three';
import { HandData, GameShape, ColorType } from '../types';
import { ZONES, OBJECT_Y_FLOAT, OBJECT_Y_FLOOR, ZONES as ZONES_CONST } from '../constants';
import { ZoneFloor } from './ZoneFloor';
import { GameObjects } from './GameObjects';
import { HandCursor } from './HandCursor';

// Helper to generate random shapes
const generateShapes = (count: number): GameShape[] => {
  const types: GameShape['type'][] = ['cube', 'sphere', 'tetrahedron'];
  const colors: ColorType[] = ['red', 'green', 'blue'];
  
  return Array.from({ length: count }).map((_, i) => ({
    id: `shape-${i}`,
    type: types[Math.floor(Math.random() * types.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
    position: [
      (Math.random() - 0.5) * 8, // Random X
      OBJECT_Y_FLOAT + Math.random(), // Random Y height
      (Math.random() - 0.5) * 2 // Random Z depth
    ],
    isMatched: false,
    isGrabbed: false,
  }));
};

interface GameLogicProps {
  handRef: React.MutableRefObject<HandData>;
  shapes: GameShape[];
  setShapes: React.Dispatch<React.SetStateAction<GameShape[]>>;
  onScore: () => void;
}

const GameLogic: React.FC<GameLogicProps> = ({ handRef, shapes, setShapes, onScore }) => {
  const { viewport } = useThree();
  const grabbedShapeId = useRef<string | null>(null);

  useFrame(() => {
    const { x, y, isPinching, isPresent } = handRef.current;
    
    if (!isPresent) return;

    // Convert hand 2D to 3D roughly
    // Map normalized coordinates (0..1) to viewport dimensions at Z=0
    const handX = (0.5 - x) * viewport.width;
    const handY = (0.5 - y) * viewport.height;
    const handZ = 0; // Changed from 2 to 0 to align with object plane

    setShapes(prevShapes => {
      return prevShapes.map(shape => {
        // If this shape is already matched, ignore physics
        if (shape.isMatched) return shape;

        const distToHand = new Vector3(handX, handY, handZ).distanceTo(new Vector3(...shape.position));
        
        // GRAB LOGIC
        // Increased threshold to 1.5 (from 1.2) to be more forgiving with Z-depth differences
        if (isPinching && !grabbedShapeId.current && distToHand < 1.5) {
          grabbedShapeId.current = shape.id;
          return { ...shape, isGrabbed: true };
        }

        // MOVE LOGIC
        if (isPinching && shape.id === grabbedShapeId.current) {
          return { 
            ...shape, 
            position: [handX, handY, handZ] 
          };
        }

        // RELEASE LOGIC
        if (!isPinching && shape.id === grabbedShapeId.current) {
          grabbedShapeId.current = null;
          
          // CHECK ZONES
          const matchingZone = ZONES_CONST.find(z => z.color === shape.color);
          if (matchingZone) {
            // Check distance to zone center (ignoring Y height)
            const distToZone = new Vector3(shape.position[0], 0, shape.position[2]).distanceTo(new Vector3(...matchingZone.position));
            
            if (distToZone < matchingZone.radius) {
              // SUCCESS
              onScore();
              return {
                ...shape,
                isGrabbed: false,
                isMatched: true,
                position: [matchingZone.position[0], OBJECT_Y_FLOOR, matchingZone.position[2]]
              };
            }
          }

          // FAIL - FLOAT BACK
          return {
            ...shape,
            isGrabbed: false,
            position: [shape.position[0], OBJECT_Y_FLOAT, 0]
          };
        }

        return shape;
      });
    });
  });

  return null;
};

interface GameSceneProps {
  handRef: React.MutableRefObject<HandData>;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
}

export const GameScene: React.FC<GameSceneProps> = ({ handRef, setScore }) => {
  const [shapes, setShapes] = useState<GameShape[]>(() => generateShapes(12));

  // Reset game when all matched
  useEffect(() => {
    if (shapes.every(s => s.isMatched)) {
      setTimeout(() => {
        setShapes(generateShapes(12));
      }, 2000);
    }
  }, [shapes]);

  return (
    <div className="w-full h-full relative">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={60} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <spotLight position={[0, 15, 0]} angle={0.5} penumbra={1} intensity={1} castShadow />

        {/* Environment */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Environment preset="city" />

        {/* Game Elements */}
        <ZoneFloor />
        <GameObjects shapes={shapes} />
        <HandCursor handRef={handRef} />
        
        {/* Physics/Logic Loop */}
        <GameLogic 
          handRef={handRef} 
          shapes={shapes} 
          setShapes={setShapes} 
          onScore={() => setScore(s => s + 10)} 
        />
      </Canvas>
    </div>
  );
};