import {
    DAMAGE_TYPES,
    SEVERITIES,
    SEVERITY_COLORS,
    POSITION_LABELS,
    POSITION_OFFSETS,
    detectShape,
    type VehicleDamage,
} from '@/lib/carZones';
import { DamageIcon, damageIconFor } from '@/lib/damageIcons';
import { ISOMETRIC_CARS } from '@/lib/isometricCars';
import { cn } from '@/lib/utils';
import topImg from '../../../img/car_damage/default/default-top.png';
import frontImg from '../../../img/car_damage/default/default-front.png';
import rearImg from '../../../img/car_damage/default/default-rear.png';
import leftSideImg from '../../../img/car_damage/default/default-leftside.png';
import rightSideImg from '../../../img/car_damage/default/default-rightside.png';

interface PrintDamageSummaryProps {
    damages: VehicleDamage[];
    variant?: 'new' | 'existing';
    vehicleType?: string | null;
}

// Blueprint layout view regions (percentage-based coordinates on the image).
// Each box is sized to its image's aspect ratio so the car fills the box.
// The image has 5 views: top (tall, left), front (top left), rear (top right),
// left side (bottom left), right side (bottom right).
const BLUEPRINT_VIEWS = {
    top:      { x: 0,  y: 0,  w: 22, h: 56 },
    front:    { x: 26, y: 0,  w: 36, h: 38 },
    rear:     { x: 62, y: 0,  w: 36, h: 38 },
    leftSide: { x: 0,  y: 60, w: 49, h: 24 },
    rightSide:{ x: 51, y: 60, w: 49, h: 24 },
} as const;

const VIEW_IMAGES: Record<keyof typeof BLUEPRINT_VIEWS, string> = {
    top: topImg,
    front: frontImg,
    rear: rearImg,
    leftSide: leftSideImg,
    rightSide: rightSideImg,
};

// Natural aspect (w/h) of each view image so markers stay aligned with the
// visible car inside its view box (same values as VehicleDamageMap).
const VIEW_IMAGE_ASPECTS: Record<keyof typeof BLUEPRINT_VIEWS, number> = {
    top: 292 / 597,
    front: 349 / 243,
    rear: 328 / 236,
    leftSide: 595 / 200,
    rightSide: 606 / 229,
};

// Map damage zones to blueprint views.
// Zones follow the pattern: front_bumper, hood, rear_bumper, trunk, left_side,
// right_side, roof, windshield, rear_windshield, *_wheel, etc.
function zoneToView(zoneId: string): keyof typeof BLUEPRINT_VIEWS {
    if (/^front_|hood|windshield/.test(zoneId) && zoneId !== 'rear_windshield') return 'front';
    if (/^rear_|trunk|rear_windshield/.test(zoneId)) return 'rear';
    if (/left|driver/.test(zoneId)) return 'leftSide';
    if (/right|passenger/.test(zoneId)) return 'rightSide';
    if (zoneId === 'roof') return 'top';
    return 'top';
}

// The print diagram container is 330x220 (3:2), the same ratio used by the
// on-screen editor so stored marker coordinates map identically to images.
const CONTAINER_ASPECT = 1.5;

// Where an image of `imgAspect` sits inside a `boxAspect` box when object-fit:
// contain (fractions of the box width/height).
function containRect(imgAspect: number, boxAspect: number) {
    if (imgAspect > boxAspect) {
        const h = boxAspect / imgAspect;
        return { x: 0, y: (1 - h) / 2, w: 1, h };
    }
    const w = imgAspect / boxAspect;
    return { x: (1 - w) / 2, y: 0, w, h: 1 };
}

// Get (x, y) center point within a blueprint view for a given zone.
// Stored coordinates are image-relative (same as on-screen), so markers are
// mapped through the image's contain rect inside the view box to stay aligned
// with the visible car.
function markerPosition(zoneId: string, damage: VehicleDamage): { x: number; y: number } {
    const viewId = zoneToView(zoneId);
    const view = BLUEPRINT_VIEWS[viewId];
    const rect = containRect(VIEW_IMAGE_ASPECTS[viewId], (view.w / view.h) * CONTAINER_ASPECT);
    let nx = 0.5;
    let ny = 0.5;

    if (damage.x != null && damage.y != null) {
        nx = damage.x;
        ny = damage.y;
    } else if (damage.position) {
        const off = POSITION_OFFSETS[damage.position];
        nx = 0.5 + off.x;
        ny = 0.5 - off.y;
    }

    return {
        x: view.x + (rect.x + nx * rect.w) * view.w,
        y: view.y + (rect.y + ny * rect.h) * view.h,
    };
}

export function DamageDiagram({ damages, vehicleType, className = 'max-w-[330px]' }: { damages: VehicleDamage[]; vehicleType?: string | null; className?: string }) {
    const shape = detectShape(vehicleType);

    return (
        <div className={cn('relative w-full overflow-hidden rounded-lg border border-surface-200 bg-white dark:border-surface-700/60 dark:bg-brand-900', className)} style={{ aspectRatio: '3 / 2' }}>
                    {Object.entries(BLUEPRINT_VIEWS).map(([viewId, view]) => (
                        <img
                            key={viewId}
                            src={VIEW_IMAGES[viewId as keyof typeof BLUEPRINT_VIEWS]}
                            alt={`${viewId} vehicle view`}
                            loading="lazy"
                            decoding="async"
                            className="absolute"
                            style={{
                                left: `${view.x}%`,
                                top: `${view.y}%`,
                                width: `${view.w}%`,
                                height: `${view.h}%`,
                                objectFit: 'contain',
                            }}
                        />
                    ))}
                    {/* Damage markers overlaid on the blueprint */}
                    <svg
                        viewBox="0 0 100 100"
                        className="absolute inset-0 w-full h-full"
                        preserveAspectRatio="none"
                    >
                        {damages.map((d, i) => {
                            const pos = markerPosition(d.zone, d);
                            const color = SEVERITY_COLORS[d.severity] || '#94a3b8';
                            const icon = damageIconFor(d.type);
                            const bx = pos.x + 2.6;
                            const by = pos.y + 2.6;
                            return (
                                <g key={i}>
                                    {/* White halo + severity ring so the marker stands out over the blueprint */}
                                    <circle cx={pos.x} cy={pos.y} r="2.4" fill="#ffffff" stroke={color} strokeWidth="0.22" opacity="0.95" />
                                    {/* Damage icon centered on the marker */}
                                    <path
                                        d={icon.d}
                                        transform={`translate(${pos.x},${pos.y}) scale(0.15) translate(-12,-12)`}
                                        fill={icon.filled ? color : 'none'}
                                        stroke={color}
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    {/* Number badge */}
                                    <g transform={`translate(${bx},${by})`}>
                                        <circle r="1.8" fill={color} stroke="#ffffff" strokeWidth="0.3" />
                                        <text
                                            x="0"
                                            y="0"
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fontSize="2.3"
                                            fontWeight="bold"
                                            fill="#ffffff"
                                        >
                                            {i + 1}
                                        </text>
                                    </g>
                                </g>
                            );
                        })}
                    </svg>
                </div>
    );
}

export function DamageLegend({ damages, vehicleType, size = 'default' }: { damages: VehicleDamage[]; vehicleType?: string | null; size?: 'default' | 'lg' }) {
    const shape = detectShape(vehicleType);
    const iso = ISOMETRIC_CARS[shape];

    return (
        <div>
            {damages.length > 0 && (
                <p className={cn('font-semibold mb-1', size === 'lg' ? 'text-xs text-surface-700 dark:text-surface-300 print:text-[0.625rem]' : 'text-[0.625rem] text-foreground print:text-[0.5rem]')}>Damage Legend</p>
            )}
            <div className={damages.length > 1 ? 'grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2 print:grid-cols-2' : 'space-y-1'}>
                {damages.map((d, i) => {
                    const typeLabel = DAMAGE_TYPES.find(t => t.value === d.type)?.label ?? d.type;
                    const severityLabel = SEVERITIES.find(s => s.value === d.severity)?.label ?? d.severity;
                    const posLabel = d.position ? POSITION_LABELS[d.position] : null;
                    const zoneLabel = iso.zones.find(z => z.id === d.zone)?.label ?? d.zone;
                    return (
                        <div key={i} className={cn('flex items-center gap-1.5 leading-tight', size === 'lg' ? 'text-xs print:text-[0.625rem]' : 'text-[0.625rem] print:text-[0.5rem]')}>
                            <DamageIcon
                                type={d.type}
                                className={cn('shrink-0', size === 'lg' ? 'w-3.5 h-3.5 print:w-3 print:h-3' : 'w-3 h-3 print:w-2 print:h-2')}
                                style={{ color: SEVERITY_COLORS[d.severity] || '#94a3b8' }}
                            />
                            <span className="font-semibold">{i + 1}.</span>
                            <span className="font-medium">{typeLabel}</span>
                            <span className="text-muted-foreground">· {severityLabel}</span>
                            <span className="text-muted-foreground">· {zoneLabel}</span>
                            {posLabel && <span className="text-muted-foreground">· {posLabel}</span>}
                            {d.note && <span className="text-muted-foreground italic">({d.note})</span>}
                        </div>
                    );
                })}
                {damages.length === 0 && (
                    <p className={cn('text-muted-foreground italic', size === 'lg' ? 'text-xs print:text-[0.625rem]' : 'text-[0.625rem] print:text-[0.5rem]')}>No damages recorded</p>
                )}
            </div>
        </div>
    );
}

export default function PrintDamageSummary({ damages, variant = 'new', vehicleType }: PrintDamageSummaryProps) {
    return (
        <div className="space-y-3" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            <div className="flex items-start gap-4">
                <DamageDiagram damages={damages} vehicleType={vehicleType} />
                <DamageLegend damages={damages} vehicleType={vehicleType} />
            </div>
        </div>
    );
}
