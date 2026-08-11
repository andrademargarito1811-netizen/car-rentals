export interface CarZone {
    id: string;
    label: string;
    short: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export type DamagePosition =
    | 'top-left' | 'top-center' | 'top-right'
    | 'middle-left' | 'middle-center' | 'middle-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';

export const POSITION_LABELS: Record<DamagePosition, string> = {
    'top-left': 'Top Left',
    'top-center': 'Top Center',
    'top-right': 'Top Right',
    'middle-left': 'Middle Left',
    'middle-center': 'Center',
    'middle-right': 'Middle Right',
    'bottom-left': 'Bottom Left',
    'bottom-center': 'Bottom Center',
    'bottom-right': 'Bottom Right',
};

export const POSITION_OFFSETS: Record<DamagePosition, { x: number; y: number }> = {
    'top-left':      { x: -0.25, y: 0.25 },
    'top-center':    { x: 0,     y: 0.25 },
    'top-right':     { x: 0.25,  y: 0.25 },
    'middle-left':   { x: -0.25, y: 0 },
    'middle-center': { x: 0,     y: 0 },
    'middle-right':  { x: 0.25,  y: 0 },
    'bottom-left':   { x: -0.25, y: -0.25 },
    'bottom-center': { x: 0,     y: -0.25 },
    'bottom-right':  { x: 0.25,  y: -0.25 },
};

export interface VehicleDamage {
    zone: string;
    type: string;
    severity: string;
    position?: DamagePosition;
    note?: string;
    photo?: string | File;
    // Free-placement coordinates (0..1) within the zone's bounding box. Preferred
    // over `position` when present.
    x?: number;
    y?: number;
}

export type CarShape = 'sedan' | 'suv' | 'van' | 'pickup';

export interface CarShapeData {
    id: CarShape;
    label: string;
    bodyPath: string;
    zones: CarZone[];
}

// Top-down car diagrams (viewBox 0 0 220 440), one silhouette per vehicle class.
export const CAR_SHAPES: Record<CarShape, CarShapeData> = {
    sedan: {
        id: 'sedan',
        label: 'Sedan',
        bodyPath:
            'M58,14 C86,14 96,16 104,20 L148,28 C180,36 196,52 196,82 L196,332 C196,364 180,380 148,388 L104,398 C96,401 86,402 58,402 C32,402 20,390 20,362 L20,54 C20,26 32,14 58,14 Z',
        zones: [
            { id: 'front_bumper', label: 'Front Bumper', short: 'Front Bumper', x: 22, y: 14, width: 176, height: 16 },
            { id: 'hood', label: 'Hood', short: 'Hood', x: 28, y: 30, width: 164, height: 38 },
            { id: 'windshield', label: 'Windshield', short: 'Windshield', x: 30, y: 68, width: 160, height: 32 },
            { id: 'roof', label: 'Roof', short: 'Roof', x: 28, y: 100, width: 164, height: 200 },
            { id: 'rear_windshield', label: 'Rear Window', short: 'Rear Window', x: 30, y: 300, width: 160, height: 30 },
            { id: 'trunk', label: 'Trunk', short: 'Trunk', x: 30, y: 330, width: 160, height: 42 },
            { id: 'rear_bumper', label: 'Rear Bumper', short: 'Rear Bumper', x: 22, y: 372, width: 176, height: 20 },
            { id: 'left_side', label: 'Left Side', short: 'Left Side', x: 22, y: 32, width: 14, height: 340 },
            { id: 'right_side', label: 'Right Side', short: 'Right Side', x: 184, y: 32, width: 14, height: 340 },
            { id: 'left_mirror', label: 'Left Mirror', short: 'L. Mirror', x: 12, y: 180, width: 10, height: 62 },
            { id: 'right_mirror', label: 'Right Mirror', short: 'R. Mirror', x: 198, y: 180, width: 10, height: 62 },
            { id: 'front_left_wheel', label: 'Front Left Wheel', short: 'FL Wheel', x: 16, y: 62, width: 16, height: 24 },
            { id: 'front_right_wheel', label: 'Front Right Wheel', short: 'FR Wheel', x: 188, y: 62, width: 16, height: 24 },
            { id: 'rear_left_wheel', label: 'Rear Left Wheel', short: 'RL Wheel', x: 16, y: 336, width: 16, height: 24 },
            { id: 'rear_right_wheel', label: 'Rear Right Wheel', short: 'RR Wheel', x: 188, y: 336, width: 16, height: 24 },
        ],
    },
    suv: {
        id: 'suv',
        label: 'SUV',
        bodyPath:
            'M56,12 C80,12 92,14 104,18 L142,26 C178,34 194,50 194,80 L194,332 C194,362 178,378 142,386 L104,394 C92,397 80,398 56,398 C30,398 18,386 18,358 L18,52 C18,24 30,12 56,12 Z',
        zones: [
            { id: 'front_bumper', label: 'Front Bumper', short: 'Front Bumper', x: 18, y: 12, width: 184, height: 16 },
            { id: 'hood', label: 'Hood', short: 'Hood', x: 26, y: 28, width: 168, height: 38 },
            { id: 'windshield', label: 'Windshield', short: 'Windshield', x: 28, y: 66, width: 164, height: 40 },
            { id: 'roof', label: 'Roof', short: 'Roof', x: 26, y: 106, width: 168, height: 204 },
            { id: 'rear_windshield', label: 'Rear Window', short: 'Rear Window', x: 28, y: 310, width: 164, height: 36 },
            { id: 'trunk', label: 'Trunk', short: 'Trunk', x: 28, y: 346, width: 164, height: 34 },
            { id: 'rear_bumper', label: 'Rear Bumper', short: 'Rear Bumper', x: 18, y: 380, width: 184, height: 16 },
            { id: 'left_side', label: 'Left Side', short: 'Left Side', x: 22, y: 28, width: 12, height: 352 },
            { id: 'right_side', label: 'Right Side', short: 'Right Side', x: 186, y: 28, width: 12, height: 352 },
            { id: 'left_mirror', label: 'Left Mirror', short: 'L. Mirror', x: 12, y: 178, width: 10, height: 62 },
            { id: 'right_mirror', label: 'Right Mirror', short: 'R. Mirror', x: 198, y: 178, width: 10, height: 62 },
            { id: 'front_left_wheel', label: 'Front Left Wheel', short: 'FL Wheel', x: 14, y: 56, width: 16, height: 24 },
            { id: 'front_right_wheel', label: 'Front Right Wheel', short: 'FR Wheel', x: 190, y: 56, width: 16, height: 24 },
            { id: 'rear_left_wheel', label: 'Rear Left Wheel', short: 'RL Wheel', x: 14, y: 330, width: 16, height: 24 },
            { id: 'rear_right_wheel', label: 'Rear Right Wheel', short: 'RR Wheel', x: 190, y: 330, width: 16, height: 24 },
        ],
    },
    van: {
        id: 'van',
        label: 'Van',
        bodyPath:
            'M32,12 C20,12 16,20 16,34 L16,380 C16,394 20,400 32,400 L188,400 C200,400 204,394 204,380 L204,34 C204,20 200,12 188,12 Z',
        zones: [
            { id: 'front_bumper', label: 'Front Bumper', short: 'Front Bumper', x: 16, y: 12, width: 188, height: 14 },
            { id: 'hood', label: 'Hood', short: 'Hood', x: 24, y: 26, width: 172, height: 26 },
            { id: 'windshield', label: 'Windshield', short: 'Windshield', x: 24, y: 52, width: 172, height: 40 },
            { id: 'roof', label: 'Roof', short: 'Roof', x: 22, y: 92, width: 176, height: 242 },
            { id: 'rear_windshield', label: 'Rear Window', short: 'Rear Window', x: 24, y: 334, width: 172, height: 32 },
            { id: 'trunk', label: 'Tailgate', short: 'Tailgate', x: 24, y: 366, width: 172, height: 16 },
            { id: 'rear_bumper', label: 'Rear Bumper', short: 'Rear Bumper', x: 16, y: 382, width: 188, height: 14 },
            { id: 'left_side', label: 'Left Side', short: 'Left Side', x: 20, y: 26, width: 12, height: 356 },
            { id: 'right_side', label: 'Right Side', short: 'Right Side', x: 188, y: 26, width: 12, height: 356 },
            { id: 'left_mirror', label: 'Left Mirror', short: 'L. Mirror', x: 12, y: 176, width: 8, height: 58 },
            { id: 'right_mirror', label: 'Right Mirror', short: 'R. Mirror', x: 200, y: 176, width: 8, height: 58 },
            { id: 'front_left_wheel', label: 'Front Left Wheel', short: 'FL Wheel', x: 14, y: 48, width: 16, height: 24 },
            { id: 'front_right_wheel', label: 'Front Right Wheel', short: 'FR Wheel', x: 190, y: 48, width: 16, height: 24 },
            { id: 'rear_left_wheel', label: 'Rear Left Wheel', short: 'RL Wheel', x: 14, y: 330, width: 16, height: 24 },
            { id: 'rear_right_wheel', label: 'Rear Right Wheel', short: 'RR Wheel', x: 190, y: 330, width: 16, height: 24 },
        ],
    },
    pickup: {
        id: 'pickup',
        label: 'Pickup',
        bodyPath:
            'M56,12 C80,12 92,16 104,22 L150,30 C180,38 196,54 196,84 L196,380 C196,394 188,398 172,398 L48,398 C32,398 24,394 24,380 L24,56 C24,28 36,12 56,12 Z',
        zones: [
            { id: 'front_bumper', label: 'Front Bumper', short: 'Front Bumper', x: 24, y: 12, width: 172, height: 16 },
            { id: 'hood', label: 'Hood', short: 'Hood', x: 30, y: 28, width: 160, height: 38 },
            { id: 'windshield', label: 'Windshield', short: 'Windshield', x: 32, y: 66, width: 156, height: 38 },
            { id: 'roof', label: 'Cab Roof', short: 'Roof', x: 30, y: 104, width: 160, height: 98 },
            { id: 'rear_windshield', label: 'Cab Window', short: 'Cab Window', x: 32, y: 202, width: 156, height: 28 },
            { id: 'bed', label: 'Pickup Bed', short: 'Bed', x: 28, y: 230, width: 164, height: 150 },
            { id: 'rear_bumper', label: 'Rear Bumper', short: 'Rear Bumper', x: 24, y: 380, width: 172, height: 16 },
            { id: 'left_side', label: 'Left Side', short: 'Left Side', x: 24, y: 28, width: 12, height: 352 },
            { id: 'right_side', label: 'Right Side', short: 'Right Side', x: 184, y: 28, width: 12, height: 352 },
            { id: 'left_mirror', label: 'Left Mirror', short: 'L. Mirror', x: 14, y: 120, width: 10, height: 56 },
            { id: 'right_mirror', label: 'Right Mirror', short: 'R. Mirror', x: 196, y: 120, width: 10, height: 56 },
            { id: 'front_left_wheel', label: 'Front Left Wheel', short: 'FL Wheel', x: 16, y: 54, width: 16, height: 24 },
            { id: 'front_right_wheel', label: 'Front Right Wheel', short: 'FR Wheel', x: 188, y: 54, width: 16, height: 24 },
            { id: 'rear_left_wheel', label: 'Rear Left Wheel', short: 'RL Wheel', x: 16, y: 250, width: 16, height: 24 },
            { id: 'rear_right_wheel', label: 'Rear Right Wheel', short: 'RR Wheel', x: 188, y: 250, width: 16, height: 24 },
        ],
    },
};

export const DAMAGE_TYPES = [
    { value: 'scratch', label: 'Scratch' },
    { value: 'dent', label: 'Dent' },
    { value: 'crack', label: 'Crack' },
    { value: 'chip', label: 'Chip' },
    { value: 'stain', label: 'Stain' },
    { value: 'torn', label: 'Torn' },
    { value: 'other', label: 'Other' },
];

export const SEVERITIES = [
    { value: 'minor', label: 'Minor' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'severe', label: 'Severe' },
];

export const SEVERITY_COLORS: Record<string, string> = {
    minor: '#f59e0b',
    moderate: '#f97316',
    severe: '#ef4444',
};

const SEVERITY_RANK = ['severe', 'moderate', 'minor'];

export function worstSeverity(damages: VehicleDamage[]): string {
    for (const s of SEVERITY_RANK) {
        if (damages.some(d => d.severity === s)) return s;
    }
    return 'minor';
}

// Merged zone lookup for labels (shape-independent enough for display).
export const ZONE_BY_ID: Record<string, CarZone> = Object.fromEntries(
    Object.values(CAR_SHAPES)
        .flatMap(s => s.zones)
        .map(z => [z.id, z]),
);

export function detectShape(vehicleType?: string | null): CarShape {
    const t = (vehicleType || '').toLowerCase();
    if (/(van|mpv|minivan|people.?carrier)/.test(t)) return 'van';
    if (/(pickup|pick-up|truck|ute)/.test(t)) return 'pickup';
    if (/(suv|crossover|hatchback|4x4|4wd|all.?wheel)/.test(t)) return 'suv';
    return 'sedan';
}
