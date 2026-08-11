import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { POSITION_OFFSETS, type CarShape, type DamagePosition, type VehicleDamage } from '@/lib/carZones';

interface CarModelProps {
    shape: CarShape;
    selectedZone: string | null;
    onSelectZone: (zoneId: string) => void;
    damagedEntries: VehicleDamage[];
    readOnly: boolean;
}

export interface PanelDef {
    id: string;
    geometry: 'box' | 'cylinder' | 'sphere';
    args: [number, number, number] | [number, number, number, number];
    position: [number, number, number];
    rotation?: [number, number, number];
}

const SEDAN_PANELS: PanelDef[] = [
    { id: 'front_bumper', geometry: 'box', args: [1.8, 0.25, 0.3], position: [0, 0.35, -2.1] },
    { id: 'hood', geometry: 'box', args: [1.7, 0.08, 0.9], position: [0, 0.65, -1.5] },
    { id: 'windshield', geometry: 'box', args: [1.6, 0.6, 0.05], position: [0, 1.05, -0.85], rotation: [0.35, 0, 0] },
    { id: 'roof', geometry: 'box', args: [1.65, 0.08, 1.6], position: [0, 1.35, 0.2] },
    { id: 'rear_windshield', geometry: 'box', args: [1.55, 0.5, 0.05], position: [0, 1.05, 1.1], rotation: [-0.3, 0, 0] },
    { id: 'trunk', geometry: 'box', args: [1.65, 0.08, 0.7], position: [0, 0.72, 1.6] },
    { id: 'rear_bumper', geometry: 'box', args: [1.8, 0.25, 0.3], position: [0, 0.35, 2.1] },
    { id: 'left_side', geometry: 'box', args: [0.08, 0.7, 3.2], position: [-0.85, 0.75, 0] },
    { id: 'right_side', geometry: 'box', args: [0.08, 0.7, 3.2], position: [0.85, 0.75, 0] },
    { id: 'left_mirror', geometry: 'box', args: [0.2, 0.12, 0.15], position: [-1.05, 0.95, -0.7] },
    { id: 'right_mirror', geometry: 'box', args: [0.2, 0.12, 0.15], position: [1.05, 0.95, -0.7] },
    { id: 'front_left_wheel', geometry: 'cylinder', args: [0.3, 0.3, 0.2, 16], position: [-0.9, 0.3, -1.3], rotation: [0, 0, Math.PI / 2] },
    { id: 'front_right_wheel', geometry: 'cylinder', args: [0.3, 0.3, 0.2, 16], position: [0.9, 0.3, -1.3], rotation: [0, 0, Math.PI / 2] },
    { id: 'rear_left_wheel', geometry: 'cylinder', args: [0.3, 0.3, 0.2, 16], position: [-0.9, 0.3, 1.3], rotation: [0, 0, Math.PI / 2] },
    { id: 'rear_right_wheel', geometry: 'cylinder', args: [0.3, 0.3, 0.2, 16], position: [0.9, 0.3, 1.3], rotation: [0, 0, Math.PI / 2] },
];

const SUV_PANELS: PanelDef[] = [
    { id: 'front_bumper', geometry: 'box', args: [1.9, 0.3, 0.3], position: [0, 0.4, -2.2] },
    { id: 'hood', geometry: 'box', args: [1.8, 0.08, 0.9], position: [0, 0.75, -1.55] },
    { id: 'windshield', geometry: 'box', args: [1.7, 0.7, 0.05], position: [0, 1.2, -0.85], rotation: [0.3, 0, 0] },
    { id: 'roof', geometry: 'box', args: [1.75, 0.08, 1.8], position: [0, 1.55, 0.25] },
    { id: 'rear_windshield', geometry: 'box', args: [1.65, 0.6, 0.05], position: [0, 1.2, 1.3], rotation: [-0.25, 0, 0] },
    { id: 'trunk', geometry: 'box', args: [1.75, 0.08, 0.6], position: [0, 0.9, 1.7] },
    { id: 'rear_bumper', geometry: 'box', args: [1.9, 0.3, 0.3], position: [0, 0.4, 2.2] },
    { id: 'left_side', geometry: 'box', args: [0.08, 0.85, 3.5], position: [-0.9, 0.85, 0] },
    { id: 'right_side', geometry: 'box', args: [0.08, 0.85, 3.5], position: [0.9, 0.85, 0] },
    { id: 'left_mirror', geometry: 'box', args: [0.22, 0.14, 0.16], position: [-1.1, 1.1, -0.7] },
    { id: 'right_mirror', geometry: 'box', args: [0.22, 0.14, 0.16], position: [1.1, 1.1, -0.7] },
    { id: 'front_left_wheel', geometry: 'cylinder', args: [0.35, 0.35, 0.22, 16], position: [-0.95, 0.35, -1.35], rotation: [0, 0, Math.PI / 2] },
    { id: 'front_right_wheel', geometry: 'cylinder', args: [0.35, 0.35, 0.22, 16], position: [0.95, 0.35, -1.35], rotation: [0, 0, Math.PI / 2] },
    { id: 'rear_left_wheel', geometry: 'cylinder', args: [0.35, 0.35, 0.22, 16], position: [-0.95, 0.35, 1.35], rotation: [0, 0, Math.PI / 2] },
    { id: 'rear_right_wheel', geometry: 'cylinder', args: [0.35, 0.35, 0.22, 16], position: [0.95, 0.35, 1.35], rotation: [0, 0, Math.PI / 2] },
];

const VAN_PANELS: PanelDef[] = [
    { id: 'front_bumper', geometry: 'box', args: [1.8, 0.3, 0.25], position: [0, 0.4, -2.0] },
    { id: 'hood', geometry: 'box', args: [1.7, 0.08, 0.6], position: [0, 0.7, -1.5] },
    { id: 'windshield', geometry: 'box', args: [1.65, 0.8, 0.05], position: [0, 1.2, -0.95], rotation: [0.25, 0, 0] },
    { id: 'roof', geometry: 'box', args: [1.7, 0.08, 2.2], position: [0, 1.6, 0.4] },
    { id: 'rear_windshield', geometry: 'box', args: [1.6, 0.7, 0.05], position: [0, 1.2, 1.65] },
    { id: 'trunk', geometry: 'box', args: [1.7, 0.08, 0.3], position: [0, 0.9, 1.9] },
    { id: 'rear_bumper', geometry: 'box', args: [1.8, 0.3, 0.25], position: [0, 0.4, 2.1] },
    { id: 'left_side', geometry: 'box', args: [0.08, 1.0, 3.8], position: [-0.85, 0.9, 0.1] },
    { id: 'right_side', geometry: 'box', args: [0.08, 1.0, 3.8], position: [0.85, 0.9, 0.1] },
    { id: 'left_mirror', geometry: 'box', args: [0.2, 0.12, 0.14], position: [-1.05, 1.05, -0.8] },
    { id: 'right_mirror', geometry: 'box', args: [0.2, 0.12, 0.14], position: [1.05, 1.05, -0.8] },
    { id: 'front_left_wheel', geometry: 'cylinder', args: [0.32, 0.32, 0.2, 16], position: [-0.9, 0.32, -1.2], rotation: [0, 0, Math.PI / 2] },
    { id: 'front_right_wheel', geometry: 'cylinder', args: [0.32, 0.32, 0.2, 16], position: [0.9, 0.32, -1.2], rotation: [0, 0, Math.PI / 2] },
    { id: 'rear_left_wheel', geometry: 'cylinder', args: [0.32, 0.32, 0.2, 16], position: [-0.9, 0.32, 1.5], rotation: [0, 0, Math.PI / 2] },
    { id: 'rear_right_wheel', geometry: 'cylinder', args: [0.32, 0.32, 0.2, 16], position: [0.9, 0.32, 1.5], rotation: [0, 0, Math.PI / 2] },
];

const PICKUP_PANELS: PanelDef[] = [
    { id: 'front_bumper', geometry: 'box', args: [1.85, 0.28, 0.3], position: [0, 0.38, -2.2] },
    { id: 'hood', geometry: 'box', args: [1.75, 0.08, 0.9], position: [0, 0.68, -1.55] },
    { id: 'windshield', geometry: 'box', args: [1.65, 0.6, 0.05], position: [0, 1.08, -0.85], rotation: [0.35, 0, 0] },
    { id: 'roof', geometry: 'box', args: [1.65, 0.08, 1.0], position: [0, 1.38, -0.1] },
    { id: 'rear_windshield', geometry: 'box', args: [1.55, 0.45, 0.05], position: [0, 1.05, 0.5], rotation: [-0.2, 0, 0] },
    { id: 'bed', geometry: 'box', args: [1.65, 0.15, 1.6], position: [0, 0.65, 1.5] },
    { id: 'rear_bumper', geometry: 'box', args: [1.85, 0.28, 0.3], position: [0, 0.38, 2.4] },
    { id: 'left_side', geometry: 'box', args: [0.08, 0.7, 2.6], position: [-0.85, 0.75, -0.5] },
    { id: 'right_side', geometry: 'box', args: [0.08, 0.7, 2.6], position: [0.85, 0.75, -0.5] },
    { id: 'left_mirror', geometry: 'box', args: [0.2, 0.12, 0.15], position: [-1.05, 0.95, -0.7] },
    { id: 'right_mirror', geometry: 'box', args: [0.2, 0.12, 0.15], position: [1.05, 0.95, -0.7] },
    { id: 'front_left_wheel', geometry: 'cylinder', args: [0.33, 0.33, 0.22, 16], position: [-0.92, 0.33, -1.35], rotation: [0, 0, Math.PI / 2] },
    { id: 'front_right_wheel', geometry: 'cylinder', args: [0.33, 0.33, 0.22, 16], position: [0.92, 0.33, -1.35], rotation: [0, 0, Math.PI / 2] },
    { id: 'rear_left_wheel', geometry: 'cylinder', args: [0.33, 0.33, 0.22, 16], position: [-0.92, 0.33, 1.8], rotation: [0, 0, Math.PI / 2] },
    { id: 'rear_right_wheel', geometry: 'cylinder', args: [0.33, 0.33, 0.22, 16], position: [0.92, 0.33, 1.8], rotation: [0, 0, Math.PI / 2] },
];

export const PANELS_BY_SHAPE: Record<CarShape, PanelDef[]> = {
    sedan: SEDAN_PANELS,
    suv: SUV_PANELS,
    van: VAN_PANELS,
    pickup: PICKUP_PANELS,
};

const GLASS_IDS = new Set(['windshield', 'rear_windshield']);
const WHEEL_IDS = new Set(['front_left_wheel', 'front_right_wheel', 'rear_left_wheel', 'rear_right_wheel']);

const SEVERITY_COLORS: Record<string, string> = {
    minor: '#f59e0b',
    moderate: '#f97316',
    severe: '#ef4444',
};

function getPositionOffset(panel: PanelDef, position?: DamagePosition): [number, number, number] {
    if (!position) return [0, 0, 0];

    const offset = POSITION_OFFSETS[position];
    const [w, h, d] = panel.args as [number, number, number];

    const isSide = panel.id.includes('side');
    const isWheel = WHEEL_IDS.has(panel.id);
    const isBumper = panel.id.includes('bumper');

    if (isSide) {
        return [0, offset.y * h * 0.4, offset.x * d * 0.4];
    }
    if (isWheel) {
        return [offset.x * 0.15, offset.y * 0.15, 0];
    }
    if (isBumper) {
        return [offset.x * w * 0.35, offset.y * h * 0.5, 0];
    }
    return [offset.x * w * 0.35, offset.y * h * 0.5, offset.x * d * 0.3];
}

interface PanelMeshProps {
    panel: PanelDef;
    isSelected: boolean;
    hasDamage: boolean;
    onSelect: () => void;
    readOnly: boolean;
}

function PanelMesh({ panel, isSelected, hasDamage, onSelect, readOnly }: PanelMeshProps) {
    const ref = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame(() => {
        if (!ref.current) return;
        const mat = ref.current.material as THREE.MeshStandardMaterial;
        if (hasDamage) {
            mat.color.lerp(new THREE.Color('#ef4444'), 0.08);
            mat.emissive.lerp(new THREE.Color('#ef4444'), 0.05);
        } else if (isSelected) {
            mat.color.lerp(new THREE.Color('#3b82f6'), 0.1);
            mat.emissive.lerp(new THREE.Color('#3b82f6'), 0.05);
        } else if (hovered && !readOnly) {
            mat.color.lerp(new THREE.Color('#60a5fa'), 0.08);
            mat.emissive.lerp(new THREE.Color('#1e40af'), 0.03);
        } else {
            if (GLASS_IDS.has(panel.id)) {
                mat.color.lerp(new THREE.Color('#94a3b8'), 0.05);
                mat.emissive.lerp(new THREE.Color('#000000'), 0.05);
            } else if (WHEEL_IDS.has(panel.id)) {
                mat.color.lerp(new THREE.Color('#1e293b'), 0.05);
                mat.emissive.lerp(new THREE.Color('#000000'), 0.05);
            } else {
                mat.color.lerp(new THREE.Color('#e2e8f0'), 0.05);
                mat.emissive.lerp(new THREE.Color('#000000'), 0.05);
            }
        }
    });

    const baseColor = GLASS_IDS.has(panel.id) ? '#94a3b8' : WHEEL_IDS.has(panel.id) ? '#1e293b' : '#e2e8f0';

    return (
        <mesh
            ref={ref}
            position={panel.position}
            rotation={panel.rotation}
            onClick={(e) => {
                e.stopPropagation();
                if (!readOnly) onSelect();
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                if (!readOnly) {
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                }
            }}
            onPointerOut={() => {
                setHovered(false);
                document.body.style.cursor = 'auto';
            }}
        >
            {panel.geometry === 'box' && <boxGeometry args={panel.args as [number, number, number]} />}
            {panel.geometry === 'cylinder' && <cylinderGeometry args={panel.args as [number, number, number, number]} />}
            <meshStandardMaterial
                color={isSelected ? '#3b82f6' : baseColor}
                roughness={GLASS_IDS.has(panel.id) ? 0.1 : 0.6}
                metalness={GLASS_IDS.has(panel.id) ? 0.8 : 0.2}
                transparent={GLASS_IDS.has(panel.id)}
                opacity={GLASS_IDS.has(panel.id) ? 0.5 : 1}
            />
        </mesh>
    );
}

function DamageMarker({ panel, damage, index }: { panel: PanelDef; damage: VehicleDamage; index: number }) {
    const ref = useRef<THREE.Group>(null);
    const color = SEVERITY_COLORS[damage.severity] ?? '#94a3b8';
    const basePos = panel.position;
    const offset = getPositionOffset(panel, damage.position);

    const markerPos: [number, number, number] = [
        basePos[0] + offset[0],
        basePos[1] + 0.2 + offset[1],
        basePos[2] + offset[2],
    ];

    useFrame(({ clock }) => {
        if (ref.current) {
            ref.current.position.y = markerPos[1] + Math.sin(clock.getElapsedTime() * 2 + index * 0.5) * 0.03;
        }
    });

    return (
        <group ref={ref} position={markerPos}>
            <mesh>
                <sphereGeometry args={[0.07, 12, 12]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, -0.09, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 0.1, 6]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
        </group>
    );
}

export default function CarModel({ shape, selectedZone, onSelectZone, damagedEntries, readOnly }: CarModelProps) {
    const groupRef = useRef<THREE.Group>(null);
    const panels = PANELS_BY_SHAPE[shape];

    const damagedZones = new Set(damagedEntries.map(d => d.zone));

    useFrame(({ clock }) => {
        if (groupRef.current && !groupRef.current.userData.interacted) {
            groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.15;
        }
    });

    const markerEntries: { panel: PanelDef; damage: VehicleDamage; index: number }[] = [];
    let idx = 0;
    for (const damage of damagedEntries) {
        const panel = panels.find(p => p.id === damage.zone);
        if (panel) {
            markerEntries.push({ panel, damage, index: idx++ });
        }
    }

    return (
        <group ref={groupRef}>
            {panels.map((panel) => (
                <PanelMesh
                    key={panel.id}
                    panel={panel}
                    isSelected={selectedZone === panel.id}
                    hasDamage={damagedZones.has(panel.id)}
                    onSelect={() => onSelectZone(panel.id)}
                    readOnly={readOnly}
                />
            ))}

            {markerEntries.map(({ panel, damage, index }) => (
                <DamageMarker
                    key={`${panel.id}-${index}`}
                    panel={panel}
                    damage={damage}
                    index={index}
                />
            ))}
        </group>
    );
}
