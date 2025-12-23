import React from 'react';
import { Cylinder, Text } from '@react-three/drei';
import { ZONES, COLORS } from '../constants';
import { ColorType } from '../types';

export const ZoneFloor: React.FC = () => {
  return (
    <group>
      {/* Main Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#202020" roughness={0.8} />
      </mesh>
      
      {/* Grid Helper */}
      <gridHelper args={[50, 50, '#444', '#222']} position={[0, 0, 0]} />

      {/* Drop Zones */}
      {ZONES.map((zone) => (
        <group key={zone.color} position={zone.position}>
           {/* Zone Ring */}
           <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[zone.radius * 0.9, zone.radius, 32]} />
            <meshBasicMaterial color={COLORS[zone.color as ColorType]} opacity={0.5} transparent />
          </mesh>
          
          {/* Zone Base */}
          <Cylinder args={[zone.radius, zone.radius, 0.1, 32]} position={[0, -0.05, 0]}>
            <meshStandardMaterial 
              color={COLORS[zone.color as ColorType]} 
              transparent 
              opacity={0.1} 
            />
          </Cylinder>

          {/* Label */}
          <Text
            position={[0, 0.2, 1.5]}
            rotation={[-Math.PI / 4, 0, 0]}
            fontSize={0.4}
            color={COLORS[zone.color as ColorType]}
            anchorX="center"
            anchorY="middle"
          >
            {zone.color.toUpperCase()} ZONE
          </Text>
        </group>
      ))}
    </group>
  );
};
