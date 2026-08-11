import { Suspense, useCallback, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import { RotateCcw, Eye, EyeOff, X, Loader2 } from 'lucide-react';
import {
    DAMAGE_TYPES,
    SEVERITIES,
    SEVERITY_COLORS,
    ZONE_BY_ID,
    POSITION_LABELS,
    detectShape,
    type DamagePosition,
    type VehicleDamage,
} from '@/lib/carZones';
import CarModel from './CarModel';
import PositionGrid from './PositionGrid';

interface Car3DDamageMapProps {
    damages: VehicleDamage[];
    onChange?: (damages: VehicleDamage[]) => void;
    readOnly?: boolean;
    variant?: 'new' | 'existing';
    vehicleType?: string | null;
}

const ACCENTS = {
    new: {
        fill: 'bg-red-50 border-red-200 text-red-700',
    },
    existing: {
        fill: 'bg-blue-50 border-blue-200 text-blue-700',
    },
};

function LoadingFallback() {
    return (
        <Html center>
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs">Loading 3D model...</span>
            </div>
        </Html>
    );
}

export default function Car3DDamageMap({
    damages,
    onChange,
    readOnly = false,
    variant = 'new',
    vehicleType,
}: Car3DDamageMapProps) {
    const accent = ACCENTS[variant];
    const shape = detectShape(vehicleType);

    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [selectedPosition, setSelectedPosition] = useState<DamagePosition | null>(null);
    const [type, setType] = useState('scratch');
    const [severity, setSeverity] = useState('minor');
    const [note, setNote] = useState('');
    const [showLabels, setShowLabels] = useState(true);

    const existingPositionsForZone = useMemo(() => {
        if (!selectedZone) return [];
        return damages
            .filter(d => d.zone === selectedZone && d.position)
            .map(d => d.position as DamagePosition);
    }, [damages, selectedZone]);

    const selectZone = useCallback((zoneId: string) => {
        if (readOnly) return;
        setSelectedZone(zoneId);
        setSelectedPosition(null);
        setType('scratch');
        setSeverity('minor');
        setNote('');
    }, [readOnly]);

    const addDamage = useCallback(() => {
        if (!selectedZone || !onChange) return;
        onChange([
            ...damages,
            {
                zone: selectedZone,
                type,
                severity,
                position: selectedPosition ?? undefined,
                note: note.trim() || undefined,
            },
        ]);
        setNote('');
        setSelectedZone(null);
        setSelectedPosition(null);
    }, [selectedZone, selectedPosition, onChange, damages, type, severity, note]);

    const removeDamage = useCallback((index: number) => {
        if (!onChange) return;
        onChange(damages.filter((_, i) => i !== index));
    }, [onChange, damages]);

    const resetView = useCallback(() => {
        setSelectedZone(null);
        setSelectedPosition(null);
    }, []);

    return (
        <div className="space-y-2.5">
            {!readOnly && (
                <>
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] text-muted-foreground">
                            {damages.length === 0
                                ? 'Click a car part, then pick position'
                                : `${damages.length} damage mark${damages.length !== 1 ? 's' : ''}`}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setShowLabels(!showLabels)}
                                className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors"
                                title={showLabels ? 'Hide labels' : 'Show labels'}
                            >
                                {showLabels ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </button>
                            <button
                                type="button"
                                onClick={resetView}
                                className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors"
                                title="Reset view"
                            >
                                <RotateCcw className="w-3 h-3" />
                            </button>
                            {damages.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => onChange?.([])}
                                    className="text-[10px] text-destructive hover:underline"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>

                    {selectedZone && (
                        <div className="space-y-2.5 rounded-lg border bg-muted/30 p-2.5">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-semibold text-foreground">
                                    {ZONE_BY_ID[selectedZone]?.label ?? selectedZone}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedZone(null); setSelectedPosition(null); }}
                                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>

                            <PositionGrid
                                selected={selectedPosition}
                                onSelect={setSelectedPosition}
                                existingPositions={existingPositionsForZone}
                            />

                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={type}
                                    onChange={e => setType(e.target.value)}
                                    className="h-8 rounded-md border bg-background px-2 text-xs"
                                >
                                    {DAMAGE_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                                <select
                                    value={severity}
                                    onChange={e => setSeverity(e.target.value)}
                                    className="h-8 rounded-md border bg-background px-2 text-xs"
                                >
                                    {SEVERITIES.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>

                            <input
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Note (optional)"
                                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                            />

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setSelectedZone(null); setSelectedPosition(null); }}
                                    className="h-8 flex-1 rounded-md border bg-background text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    Done
                                </button>
                                <button
                                    type="button"
                                    onClick={addDamage}
                                    disabled={!selectedPosition}
                                    className="h-8 flex-1 rounded-md bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {selectedPosition ? 'Add Damage' : 'Pick Position'}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="relative rounded-lg border bg-muted/20 overflow-hidden" style={{ height: 320 }}>
                <Canvas>
                    <PerspectiveCamera makeDefault position={[3, 2.5, 4]} fov={40} />
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
                    <directionalLight position={[-3, 4, -2]} intensity={0.3} />
                    <Suspense fallback={<LoadingFallback />}>
                        <CarModel
                            shape={shape}
                            selectedZone={selectedZone}
                            onSelectZone={selectZone}
                            damagedEntries={damages}
                            readOnly={readOnly}
                        />
                    </Suspense>
                    <OrbitControls
                        enablePan={false}
                        minDistance={3}
                        maxDistance={10}
                        minPolarAngle={0.3}
                        maxPolarAngle={Math.PI / 2.1}
                        enableDamping
                        dampingFactor={0.05}
                    />
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                        <planeGeometry args={[20, 20]} />
                        <meshStandardMaterial color="#f1f5f9" opacity={0.5} transparent />
                    </mesh>
                </Canvas>

                {showLabels && !readOnly && damages.length > 0 && (
                    <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 pointer-events-none">
                        {damages.filter(d => d.position).map((d, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded-full border bg-background/90 px-1.5 py-0.5 text-[9px] font-medium backdrop-blur-sm"
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: SEVERITY_COLORS[d.severity] ?? '#94a3b8' }}
                                />
                                {ZONE_BY_ID[d.zone]?.short ?? d.zone}
                                {d.position && ` · ${POSITION_LABELS[d.position]}`}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {damages.length > 0 && (
                <div className="space-y-1">
                    {damages.map((d, i) => {
                        const zone = ZONE_BY_ID[d.zone];
                        const typeLabel = DAMAGE_TYPES.find(t => t.value === d.type)?.label ?? d.type;
                        const severityLabel = SEVERITIES.find(s => s.value === d.severity)?.label ?? d.severity;
                        const posLabel = d.position ? POSITION_LABELS[d.position] : null;
                        return (
                            <div key={i} className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] ${accent.fill}`}>
                                <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: SEVERITY_COLORS[d.severity] ?? '#94a3b8' }}
                                />
                                <span className="font-semibold truncate">{zone?.label ?? d.zone}</span>
                                {posLabel && <span className="opacity-70 text-[10px]">({posLabel})</span>}
                                <span className="opacity-70 truncate">{typeLabel}</span>
                                <span className="opacity-70">{severityLabel}</span>
                                {d.note && <span className="opacity-60 truncate hidden sm:inline">· {d.note}</span>}
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={() => removeDamage(i)}
                                        className="ml-auto shrink-0 text-muted-foreground/60 hover:text-destructive transition-colors"
                                        title="Remove damage"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {damages.length === 0 && readOnly && (
                <p className="text-[11px] text-muted-foreground">No damages recorded</p>
            )}
        </div>
    );
}
