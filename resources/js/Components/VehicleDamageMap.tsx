import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent, type PointerEvent } from 'react';
import { Camera, Check, ChevronDown, ChevronLeft, ChevronRight, Images, MousePointerClick, Pencil, Repeat, X, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';
import {
    CAR_SHAPES,
    DAMAGE_TYPES,
    detectShape,
    SEVERITIES,
    SEVERITY_COLORS,
    POSITION_OFFSETS,
    worstSeverity,
    ZONE_BY_ID,
    type CarShape,
    type CarZone,
    type VehicleDamage,
} from '@/lib/carZones';
import { DamageIcon, damageIconFor } from '@/lib/damageIcons';
import topImg from '../../img/car_damage/default/default-top.png';
import frontImg from '../../img/car_damage/default/default-front.png';
import rearImg from '../../img/car_damage/default/default-rear.png';
import leftSideImg from '../../img/car_damage/default/default-leftside.png';
import rightSideImg from '../../img/car_damage/default/default-rightside.png';

interface VehicleDamageMapProps {
    damages: VehicleDamage[];
    onChange?: (damages: VehicleDamage[]) => void;
    readOnly?: boolean;
    variant?: 'new' | 'existing';
    vehicleType?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    stacked?: boolean;
}

const ACCENTS = {
    new: {
        chip: 'border-red-200 bg-red-50 text-red-700',
        badge: '#ef4444',
    },
    existing: {
        chip: 'border-blue-200 bg-blue-50 text-blue-700',
        badge: '#3b82f6',
    },
};

const DIAGRAM_SIZES: Record<NonNullable<VehicleDamageMapProps['size']>, string> = {
    sm: 'max-w-[320px] lg:w-[320px]',
    md: 'max-w-[400px] lg:w-[400px]',
    lg: 'max-w-[520px] lg:w-[520px]',
    xl: 'max-w-[520px] lg:max-w-none lg:w-[60%]',
};

const BLUEPRINT_VIEWS = {
    top:      { x: 0,  y: 0,  w: 22, h: 56 },
    front:    { x: 26, y: 0,  w: 36, h: 38 },
    rear:     { x: 62, y: 0,  w: 36, h: 38 },
    leftSide: { x: 0,  y: 60, w: 49, h: 24 },
    rightSide:{ x: 51, y: 60, w: 49, h: 24 },
} as const;

type BlueprintView = keyof typeof BLUEPRINT_VIEWS;

const VIEW_IMAGES: Record<BlueprintView, string> = {
    top: topImg,
    front: frontImg,
    rear: rearImg,
    leftSide: leftSideImg,
    rightSide: rightSideImg,
};

// Natural aspect (w/h) of each view image so the part view can center it inside
// a fixed box and keep markers aligned with the visible image.
const VIEW_IMAGE_ASPECTS: Record<BlueprintView, number> = {
    top: 292 / 597,
    front: 349 / 243,
    rear: 328 / 236,
    leftSide: 595 / 200,
    rightSide: 606 / 229,
};

function clampNumber(v: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, v));
}

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

// The diagram container always renders with a 3:2 aspect ratio.
const CONTAINER_ASPECT = 1.5;

// Where the view's image sits inside its BLUEPRINT_VIEWS box (fractions of the
// box width/height). Markers and clicks are mapped through this so part-zoom
// and full-car modes interpret stored coordinates identically.
function imageRectInBox(viewId: BlueprintView) {
    const view = BLUEPRINT_VIEWS[viewId];
    const boxAspect = (view.w / view.h) * CONTAINER_ASPECT;
    return containRect(VIEW_IMAGE_ASPECTS[viewId], boxAspect);
}

function zoneToView(zoneId: string): BlueprintView {
    if (/^front_|hood|windshield/.test(zoneId) && zoneId !== 'rear_windshield') return 'front';
    if (/^rear_|trunk|rear_windshield/.test(zoneId)) return 'rear';
    if (/left|driver/.test(zoneId)) return 'leftSide';
    if (/right|passenger/.test(zoneId)) return 'rightSide';
    if (zoneId === 'roof') return 'top';
    return 'top';
}

function viewZoneFromPoint(view: BlueprintView, x: number, y: number): string | null {
    if (view === 'top') return 'roof';
    if (view === 'front') {
        if (y < 0.28) return 'windshield';
        if (y < 0.62) return 'hood';
        return 'front_bumper';
    }
    if (view === 'rear') {
        if (y < 0.28) return 'rear_windshield';
        if (y < 0.62) return 'trunk';
        return 'rear_bumper';
    }
    if (view === 'leftSide') return 'left_side';
    if (view === 'rightSide') return 'right_side';
    return null;
}

function markerPosition(zoneId: string, damage: VehicleDamage) {
    const viewId = zoneToView(zoneId);
    const view = BLUEPRINT_VIEWS[viewId];
    const rect = imageRectInBox(viewId);
    const n = normFor(damage);
    return {
        x: view.x + (rect.x + n.x * rect.w) * view.w,
        y: view.y + (rect.y + n.y * rect.h) * view.h,
    };
}

function viewFromPoint(point: { x: number; y: number }): BlueprintView | null {
    for (const viewId of Object.keys(BLUEPRINT_VIEWS) as BlueprintView[]) {
        const view = BLUEPRINT_VIEWS[viewId];
        if (point.x >= view.x && point.x <= view.x + view.w && point.y >= view.y && point.y <= view.y + view.h) {
            return viewId;
        }
    }
    return null;
}

// Zones are grouped into regions so the selector is scannable instead of a flat
// wall of buttons. `REGION_ORDER` controls display order; wheels are matched
// first so `front_left_wheel` lands under Wheels rather than Front.
const REGION_ORDER = ['Front', 'Sides', 'Glass & Roof', 'Rear', 'Wheels', 'Other'];

const REGION_TEST: [string, (id: string) => boolean][] = [
    ['Wheels', id => /wheel/.test(id)],
    ['Front', id => /^front_/.test(id) || id === 'hood' || id === 'windshield'],
    ['Rear', id => /^rear_/.test(id) || id === 'trunk'],
    ['Sides', id => /side/.test(id) || /mirror/.test(id)],
    ['Glass & Roof', id => id === 'roof' || id === 'rear_windshield'],
];

function zoneRegion(zoneId: string): string {
    return REGION_TEST.find(([, test]) => test(zoneId))?.[0] ?? 'Other';
}

const QUICK_ZONE_IDS = ['front_bumper', 'hood', 'roof', 'rear_bumper', 'left_side', 'right_side'];

const SHAPE_LABELS: Record<CarShape, string> = {
    sedan: 'Sedan',
    suv: 'SUV',
    van: 'Van',
    pickup: 'Pickup',
};

// Resolves a stored path (`/storage/...`) or manages the object-URL lifecycle
// for a pending upload (File). Returns a displayable src.
function usePhotoSrc(photo?: string | File | null): string | null {
    const [src, setSrc] = useState<string | null>(null);
    useEffect(() => {
        let url: string | null = null;
        if (photo instanceof File) {
            url = URL.createObjectURL(photo);
            setSrc(url);
        } else {
            setSrc(photo ? `/storage/${photo}` : null);
        }
        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [photo]);
    return src;
}

// Thumbnail for a damage or zone photo.
function DamagePhotoThumb({ photo, onRemove }: { photo: string | File; onRemove?: () => void }) {
    const src = usePhotoSrc(photo);
    if (!src) return null;
    return (
        <span className="relative shrink-0">
            <img src={src} alt="" className="h-8 w-8 rounded-md border border-black/5 object-cover" />
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-foreground/70 text-background transition-colors hover:bg-destructive"
                    title="Remove photo"
                    aria-label="Remove photo"
                >
                    <X className="h-2 w-2" />
                </button>
            )}
        </span>
    );
}

// Resolves a photo (File or stored path) to a displayable <img>.
function PhotoImage({ photo, className, alt = '' }: { photo: string | File; className?: string; alt?: string }) {
    const src = usePhotoSrc(photo);
    if (!src) return null;
    return <img src={src} alt={alt} className={className} />;
}

interface GalleryPhoto {
    key: string;
    photo: string | File;
    label: string;
    // Index of the damage this photo belongs to within the `damages` array so a
    // marker click can open its photo in the lightbox.
    damageIndex?: number;
}

// Filmstrip of all part/damage photos; clicking a thumbnail opens the lightbox.
function PhotoGallery({ photos, onOpen }: { photos: GalleryPhoto[]; onOpen: (index: number) => void }) {
    if (photos.length === 0) return null;
    return (
        <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Images className="h-3 w-3" />
                Photos
                <span className="rounded-full bg-foreground/10 px-1.5 text-[9px] font-bold text-foreground">{photos.length}</span>
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
                {photos.map((p, i) => (
                    <button
                        key={p.key}
                        type="button"
                        onClick={() => onOpen(i)}
                        title={p.label}
                        className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-foreground/40"
                    >
                        <PhotoImage photo={p.photo} className="h-full w-full object-cover transition-transform group-hover:scale-105" alt={p.label} />
                    </button>
                ))}
            </div>
        </div>
    );
}

// Fullscreen photo viewer with prev/next navigation.
function Lightbox({ photos, index, onClose, onPrev, onNext }: {
    photos: GalleryPhoto[];
    index: number | null;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
}) {
    if (index === null || photos.length === 0) return null;
    const p = photos[index];
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4" onClick={onClose} role="dialog" aria-modal="true">
            <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                title="Close"
                aria-label="Close"
            >
                <X className="h-5 w-5" />
            </button>
            <button
                type="button"
                onClick={e => { e.stopPropagation(); onPrev(); }}
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                title="Previous photo"
                aria-label="Previous photo"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="max-w-full" onClick={e => e.stopPropagation()}>
                <PhotoImage photo={p.photo} className="max-h-[78vh] max-w-full rounded-lg object-contain shadow-2xl" alt={p.label} />
                <p className="mt-2 text-center text-xs font-medium text-white">
                    {p.label} <span className="text-white/60">({index + 1}/{photos.length})</span>
                </p>
            </div>
            <button
                type="button"
                onClick={e => { e.stopPropagation(); onNext(); }}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                title="Next photo"
                aria-label="Next photo"
            >
                <ChevronRight className="h-5 w-5" />
            </button>
        </div>
    );
}

function severityLabel(value: string): string {
    return SEVERITIES.find(s => s.value === value)?.label ?? value;
}

function typeLabel(value: string): string {
    return DAMAGE_TYPES.find(t => t.value === value)?.label ?? value;
}

interface DamageRowProps {
    damage: VehicleDamage;
    onEdit?: () => void;
    onRemove?: () => void;
    onPhoto?: () => void;
    onRemovePhoto?: () => void;
}

function DamageRow({ damage, onEdit, onRemove, onPhoto, onRemovePhoto }: DamageRowProps) {
    const color = SEVERITY_COLORS[damage.severity] ?? '#94a3b8';
    return (
        <div
            className={`chip-pop flex flex-col gap-1 rounded-lg border border-border px-2.5 py-2 ${
                onEdit ? 'cursor-pointer transition-colors hover:border-foreground/30' : ''
            }`}
            style={{ borderLeft: `3px solid ${color}`, backgroundColor: `${color}14` }}
            onClick={onEdit}
            role={onEdit ? 'button' : undefined}
        >
            <div className="flex items-center gap-1.5">
                {damage.photo && <DamagePhotoThumb photo={damage.photo} onRemove={onRemovePhoto} />}
                <DamageIcon
                    type={damage.type}
                    className="w-4 h-4 shrink-0"
                    style={{ color }}
                />
                <span className="truncate text-xs font-medium text-foreground">{typeLabel(damage.type)}</span>
                <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: `${color}1f`, color }}
                >
                    {severityLabel(damage.severity)}
                </span>
                <span className="ml-auto flex shrink-0 items-center gap-1">
                    {onEdit && (
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onEdit(); }}
                            className="text-muted-foreground/60 hover:text-foreground transition-colors"
                            title="Edit damage"
                            aria-label={`Edit ${typeLabel(damage.type)} damage`}
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {onPhoto && (
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onPhoto(); }}
                            className="text-muted-foreground/60 hover:text-foreground transition-colors"
                            title="Add or replace photo"
                            aria-label={`Add or replace ${typeLabel(damage.type)} photo`}
                        >
                            <Camera className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {onRemove && (
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onRemove(); }}
                            className="text-muted-foreground/60 hover:text-destructive transition-colors"
                            title="Remove damage"
                            aria-label={`Remove ${typeLabel(damage.type)} damage`}
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </span>
            </div>
            {damage.note && (
                <p className="text-[11px] leading-snug text-muted-foreground">{damage.note}</p>
            )}
        </div>
    );
}

// In-place editor for an existing damage mark (severity, type, note).
function InlineDamageEditor({ damage, onSave, onCancel }: { damage: VehicleDamage; onSave: (d: VehicleDamage) => void; onCancel: () => void }) {
    const [type, setType] = useState(damage.type);
    const [severity, setSeverity] = useState(damage.severity);
    const [note, setNote] = useState(damage.note ?? '');
    return (
        <div className="space-y-1.5 rounded-md border border-primary/30 bg-background p-2">
            <div className="flex gap-1">
                {SEVERITIES.map(s => (
                    <button
                        key={s.value}
                        type="button"
                        onClick={() => setSeverity(s.value)}
                        aria-pressed={severity === s.value}
                        className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                            severity === s.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[s.value] }} />
                        {s.label}
                    </button>
                ))}
            </div>
            <div className="flex flex-wrap gap-1">
                {DAMAGE_TYPES.map(t => (
                    <button
                        key={t.value}
                        type="button"
                        onClick={() => setType(t.value)}
                        aria-pressed={type === t.value}
                        className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                            type === t.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        <DamageIcon type={t.value} className="w-3.5 h-3.5" />
                        {t.label}
                    </button>
                ))}
            </div>
            <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Note (optional)"
                className="h-7 w-full rounded-md border bg-background px-2 text-xs"
            />
            <div className="flex gap-1.5">
                <button
                    type="button"
                    onClick={() => onSave({ ...damage, type, severity, note: note.trim() ? note.trim() : undefined })}
                    className="h-7 flex-1 rounded-md bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    Save
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="h-7 rounded-md border bg-background px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// Normalize a damage to (0..1) coordinates within its zone's bounding box.
function normFor(damage: VehicleDamage): { x: number; y: number } {
    if (damage.x != null && damage.y != null) return { x: damage.x, y: damage.y };
    if (damage.position) {
        const off = POSITION_OFFSETS[damage.position];
        return { x: 0.5 + off.x, y: 0.5 - off.y };
    }
    return { x: 0.5, y: 0.5 };
}

interface BlueprintDiagramProps {
    damages: VehicleDamage[];
    selected: string | null;
    readOnly: boolean;
    onPlace: (zoneId: string, x: number, y: number) => void;
    mode?: 'sheet' | 'part';
    zone?: CarZone | null;
    // When true the zoom/pan controls stay available in readOnly mode (used by
    // the enlarged diagram overlay) without enabling mark placement.
    enableZoom?: boolean;
    // Invoked with the damage array index when a marker that has a photo is
    // clicked (readOnly only).
    onPhotoClick?: (damageIndex: number) => void;
}

// Marker badge rendered inside a diagram: white halo + the damage-type icon
// colored by severity. `size` is in diagram user units so markers stay a
// consistent on-screen size regardless of sheet/part zoom.
function DiagramMarker({ damage, cx, cy, size, hasPhoto = false, onPhotoClick }: {
    damage: VehicleDamage;
    cx: number;
    cy: number;
    size: number;
    hasPhoto?: boolean;
    onPhotoClick?: () => void;
}) {
    const color = SEVERITY_COLORS[damage.severity] ?? '#94a3b8';
    const icon = damageIconFor(damage.type);
    const half = size / 2;
    const interactive = !!onPhotoClick && hasPhoto;
    return (
        <svg
            x={cx - half}
            y={cy - half}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={icon.filled ? color : 'none'}
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            onClick={interactive ? (e) => { e.stopPropagation(); onPhotoClick(); } : undefined}
            onPointerDown={interactive ? (e) => e.stopPropagation() : undefined}
            onKeyDown={interactive ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPhotoClick();
                }
            } : undefined}
            style={interactive ? { pointerEvents: 'auto', cursor: 'pointer' } : undefined}
            role={interactive ? 'button' : undefined}
            aria-label={interactive ? 'View damage photo' : undefined}
            tabIndex={interactive ? 0 : undefined}
        >
            <circle cx="12" cy="12" r="10" fill="#ffffff" stroke="none" opacity="0.92" />
            <path d={icon.d} />
            {interactive && (
                <g>
                    <circle cx="17" cy="7" r="5.2" fill="#ffffff" stroke={color} strokeWidth="1" />
                    <path
                        d="M15.1 6.1h1l.6-.9h.6l.6.9h1v2.7a.9.9 0 0 1-.9.9h-3a.9.9 0 0 1-.9-.9z"
                        fill={color}
                        stroke="none"
                    />
                    <circle cx="17" cy="7.4" r="1.1" fill="#ffffff" stroke="none" />
                </g>
            )}
        </svg>
    );
}

function ZoomControls({ zoom, onIn, onOut, onReset }: { zoom: number; onIn: () => void; onOut: () => void; onReset: () => void }) {
    return (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-md border bg-background/90 p-0.5 shadow-sm backdrop-blur">
            <button
                type="button"
                onClick={onIn}
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Zoom in"
                title="Zoom in"
            >
                <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
                type="button"
                onClick={onOut}
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Zoom out"
                title="Zoom out"
            >
                <ZoomOut className="h-3.5 w-3.5" />
            </button>
            {zoom > 1 && (
                <button
                    type="button"
                    onClick={onReset}
                    className="flex h-6 items-center justify-center rounded px-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Reset zoom"
                    title="Reset zoom"
                >
                    {Math.round(zoom * 100)}%
                </button>
            )}
        </div>
    );
}

function BlueprintDiagram({ damages, selected, readOnly, onPlace, mode = 'sheet', zone, enableZoom = false, onPhotoClick }: BlueprintDiagramProps) {
    const [hoverZone, setHoverZone] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [dragState, setDragState] = useState<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
    const draggedRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const isPart = mode === 'part' && !!zone;
    const partRect = isPart && zone
        ? containRect(VIEW_IMAGE_ASPECTS[zoneToView(zone.id)], CONTAINER_ASPECT)
        : null;

    useEffect(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, [zone?.id, mode]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const maxX = ((zoom - 1) * el.clientWidth) / 2;
        const maxY = ((zoom - 1) * el.clientHeight) / 2;
        setPan(p => ({ x: clampNumber(p.x, -maxX, maxX), y: clampNumber(p.y, -maxY, maxY) }));
    }, [zoom]);

    const zoomIn = () => setZoom(z => Math.min(4, Math.round(z * 1.35 * 10) / 10));
    const zoomOut = () => setZoom(z => Math.max(1, Math.round((z / 1.35) * 10) / 10));

    function handlePointerDown(e: PointerEvent<SVGSVGElement>) {
        if ((readOnly && !enableZoom) || zoom <= 1) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setDragState({ startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y });
        draggedRef.current = false;
    }

    function handlePointerMove(e: PointerEvent<SVGSVGElement>) {
        if (!dragState) return;
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) draggedRef.current = true;
        const el = containerRef.current;
        const maxX = el ? ((zoom - 1) * el.clientWidth) / 2 : 0;
        const maxY = el ? ((zoom - 1) * el.clientHeight) / 2 : 0;
        setPan({
            x: clampNumber(dragState.panX + dx, -maxX, maxX),
            y: clampNumber(dragState.panY + dy, -maxY, maxY),
        });
    }

    function handlePointerUp(e: PointerEvent<SVGSVGElement>) {
        if (!dragState) return;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        setDragState(null);
    }

    function pointFromEvent(e: MouseEvent<SVGSVGElement>): { x: number; y: number } | null {
        const rect = e.currentTarget.getBoundingClientRect();
        const u = ((e.clientX - rect.left) / rect.width) * 100;
        const v = ((e.clientY - rect.top) / rect.height) * 100;
        if (Number.isNaN(u) || Number.isNaN(v)) return null;
        return { x: Math.min(100, Math.max(0, u)), y: Math.min(100, Math.max(0, v)) };
    }

    function zoneUnder(point: { x: number; y: number }): string | null {
        const view = viewFromPoint(point);
        if (!view) return null;
        const relX = (point.x - BLUEPRINT_VIEWS[view].x) / BLUEPRINT_VIEWS[view].w;
        const relY = (point.y - BLUEPRINT_VIEWS[view].y) / BLUEPRINT_VIEWS[view].h;
        return viewZoneFromPoint(view, relX, relY);
    }

    function handleClick(e: MouseEvent<SVGSVGElement>) {
        if (readOnly) return;
        if (draggedRef.current) {
            draggedRef.current = false;
            return;
        }
        const point = pointFromEvent(e);
        if (!point) return;
        if (isPart && selected && partRect) {
            const u = point.x / 100;
            const v = point.y / 100;
            const x = Math.min(1, Math.max(0, (u - partRect.x) / partRect.w));
            const y = Math.min(1, Math.max(0, (v - partRect.y) / partRect.h));
            onPlace(selected, x, y);
            return;
        }
        const zoneId = zoneUnder(point);
        if (!zoneId) return;
        const view = viewFromPoint(point);
        if (!view) return;
        const box = BLUEPRINT_VIEWS[view];
        const rect = imageRectInBox(view);
        const u = (point.x - box.x) / box.w;
        const v = (point.y - box.y) / box.h;
        const x = Math.min(1, Math.max(0, (u - rect.x) / rect.w));
        const y = Math.min(1, Math.max(0, (v - rect.y) / rect.h));
        onPlace(zoneId, x, y);
    }

    function handleMove(e: MouseEvent<SVGSVGElement>) {
        if (readOnly || isPart) return;
        const point = pointFromEvent(e);
        setHoverZone(point ? zoneUnder(point) : null);
    }

    const selectedView = selected ? zoneToView(selected) : null;
    const hoverView = hoverZone ? zoneToView(hoverZone) : null;

    if (isPart && zone && partRect) {
        const viewId = zoneToView(zone.id);
        const zoneDamages = damages.map((d, i) => ({ d, i })).filter(({ d }) => d.zone === zone.id);
        return (
            <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl border border-border bg-background" style={{ aspectRatio: '3 / 2' }}>
                <div className="absolute inset-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center' }}>
                    <img
                        src={VIEW_IMAGES[viewId]}
                        alt={`${viewId} vehicle view`}
                        className="absolute inset-0 h-full w-full"
                        style={{ objectFit: 'contain' }}
                    />
                    <svg
                        ref={svgRef}
                        viewBox="0 0 100 100"
                        className="absolute inset-0 h-full w-full"
                        preserveAspectRatio="none"
                        onClick={readOnly ? undefined : handleClick}
                        onPointerDown={(readOnly && !enableZoom) ? undefined : handlePointerDown}
                        onPointerMove={(readOnly && !enableZoom) ? undefined : handlePointerMove}
                        onPointerUp={(readOnly && !enableZoom) ? undefined : handlePointerUp}
                        role={readOnly ? 'img' : 'button'}
                        aria-label={readOnly ? 'Vehicle part diagram' : `Part diagram — click to mark ${zone.label}`}
                        aria-pressed={readOnly ? undefined : true}
                        tabIndex={readOnly ? -1 : 0}
                        style={{ pointerEvents: (readOnly && !enableZoom) ? 'none' : 'auto', touchAction: zoom > 1 ? 'none' : 'auto', cursor: zoom > 1 && (!readOnly || enableZoom) ? (dragState ? 'grabbing' : 'grab') : undefined }}
                    >
                        {zoneDamages.map(({ d, i }) => {
                            const n = normFor(d);
                            return (
                                <DiagramMarker
                                    key={i}
                                    damage={d}
                                    cx={(partRect.x + n.x * partRect.w) * 100}
                                    cy={(partRect.y + n.y * partRect.h) * 100}
                                    size={7}
                                    hasPhoto={!!d.photo}
                                    onPhotoClick={onPhotoClick && d.photo ? () => onPhotoClick(i) : undefined}
                                />
                            );
                        })}
                    </svg>
                </div>
                {(!readOnly || enableZoom) && <ZoomControls zoom={zoom} onIn={zoomIn} onOut={zoomOut} onReset={() => setZoom(1)} />}
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl border border-border bg-background" style={{ aspectRatio: '3 / 2' }}>
            <div className="absolute inset-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center' }}>
                {Object.entries(BLUEPRINT_VIEWS).map(([viewId, view]) => (
                    <img
                        key={viewId}
                        src={VIEW_IMAGES[viewId as BlueprintView]}
                        alt={`${viewId} vehicle view`}
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
                <svg
                    ref={svgRef}
                    viewBox="0 0 100 100"
                    className="absolute inset-0 h-full w-full"
                    preserveAspectRatio="none"
                    onClick={readOnly ? undefined : handleClick}
                    onPointerDown={(readOnly && !enableZoom) ? undefined : handlePointerDown}
                    onPointerMove={(readOnly && !enableZoom) ? undefined : handlePointerMove}
                    onPointerUp={(readOnly && !enableZoom) ? undefined : handlePointerUp}
                    onMouseMove={readOnly ? undefined : handleMove}
                    onMouseLeave={readOnly ? undefined : () => setHoverZone(null)}
                    role={readOnly ? 'img' : 'button'}
                    aria-label={readOnly ? 'Vehicle blueprint diagram' : 'Blueprint diagram — click an exact spot to mark damage'}
                    aria-pressed={readOnly ? undefined : true}
                    tabIndex={readOnly ? -1 : 0}
                    style={{ pointerEvents: (readOnly && !enableZoom) ? 'none' : 'auto', touchAction: zoom > 1 ? 'none' : 'auto', cursor: zoom > 1 && (!readOnly || enableZoom) ? (dragState ? 'grabbing' : 'grab') : undefined }}
                >
                    {Object.entries(BLUEPRINT_VIEWS).map(([viewId, view]) => (
                        <rect
                            key={viewId}
                            x={view.x}
                            y={view.y}
                            width={view.w}
                            height={view.h}
                            fill={selectedView === viewId ? 'rgba(59,130,246,0.12)' : hoverView === viewId ? 'rgba(148,163,184,0.16)' : 'transparent'}
                            stroke={selectedView === viewId ? '#3b82f6' : hoverView === viewId ? '#94a3b8' : 'rgba(148,163,184,0.5)'}
                            strokeWidth={selectedView === viewId || hoverView === viewId ? 0.9 : 0.4}
                        />
                    ))}
                    {damages.map((d, i) => {
                        const pt = markerPosition(d.zone, d);
                        return (
                            <DiagramMarker
                                key={i}
                                damage={d}
                                cx={pt.x}
                                cy={pt.y}
                                size={3}
                                hasPhoto={!!d.photo}
                                onPhotoClick={onPhotoClick && d.photo ? () => onPhotoClick(i) : undefined}
                            />
                        );
                    })}
                </svg>
            </div>
            {(!readOnly || enableZoom) && <ZoomControls zoom={zoom} onIn={zoomIn} onOut={zoomOut} onReset={() => setZoom(1)} />}
        </div>
    );
}

export default function VehicleDamageMap({
    damages,
    onChange,
    readOnly = false,
    variant = 'new',
    vehicleType,
    size = 'md',
    stacked = false,
}: VehicleDamageMapProps) {
    const accent = ACCENTS[variant];
    const shape: CarShape = detectShape(vehicleType);
    const zones = CAR_SHAPES[shape].zones;

    const [selected, setSelected] = useState<string | null>(null);
    const [partMode, setPartMode] = useState(true);
    const [type, setType] = useState('scratch');
    const [severity, setSeverity] = useState('minor');
    const [note, setNote] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [markContinue, setMarkContinue] = useState(false);

    const historyRef = useRef<VehicleDamage[][]>([]);
    const [historyLen, setHistoryLen] = useState(0);
    const toastRef = useRef<string | number | null>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const photoTargetRef = useRef<number | 'new' | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const enlargePressRef = useRef<{ x: number; y: number } | null>(null);

    const zoneLabel = (id: string) => ZONE_BY_ID[id]?.label ?? id;
    const countFor = (id: string) => damages.filter(d => d.zone === id).length;
    const selectedZone = selected ? zones.find(z => z.id === selected) ?? null : null;
    const zoneIndex = selected ? zones.findIndex(z => z.id === selected) : -1;
    const prevZone = zoneIndex > 0 ? zones[zoneIndex - 1].id : null;
    const nextZone = zoneIndex >= 0 && zoneIndex < zones.length - 1 ? zones[zoneIndex + 1].id : null;

    const photoItems: GalleryPhoto[] = [
        ...damages
            .map((d, i) => ({ d, i }))
            .filter((entry): entry is { d: VehicleDamage & { photo: string | File }; i: number } => !!entry.d.photo)
            .map(({ d, i }) => ({
                key: `damage-${i}`,
                damageIndex: i,
                photo: d.photo,
                label: `${typeLabel(d.type)} · ${zoneLabel(d.zone)}`,
            })),
    ];

    // damage-array-index → photoItems index, so a marker click can open its photo.
    const photoIndexForDamage = useMemo(() => {
        const map: Record<number, number> = {};
        photoItems.forEach((item, pi) => {
            if (item.damageIndex != null) map[item.damageIndex] = pi;
        });
        return map;
    }, [photoItems]);

    const openDamagePhoto = (damageIndex: number) => {
        const pi = photoIndexForDamage[damageIndex];
        if (pi == null) return;
        setLightboxIndex(pi);
    };

    const prevPhoto = () =>
        setLightboxIndex(i => (i === null || photoItems.length === 0 ? null : (i - 1 + photoItems.length) % photoItems.length));
    const nextPhoto = () =>
        setLightboxIndex(i => (i === null || photoItems.length === 0 ? null : (i + 1) % photoItems.length));

    // Keyboard navigation + scroll lock while the lightbox is open.
    useEffect(() => {
        if (lightboxIndex === null) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxIndex(null);
            if (e.key === 'ArrowLeft') prevPhoto();
            if (e.key === 'ArrowRight') nextPhoto();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKey);
        };
    }, [lightboxIndex]);

    // Close the enlarged diagram with the Escape key.
    useEffect(() => {
        if (!expanded) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setExpanded(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [expanded]);

    const quickZones = useMemo(() => zones.filter(z => QUICK_ZONE_IDS.includes(z.id)), [zones]);

    const regionGroups = useMemo(() => {
        const map = new Map<string, typeof zones>();
        for (const zone of zones) {
            const region = zoneRegion(zone.id);
            if (!map.has(region)) map.set(region, []);
            map.get(region)!.push(zone);
        }
        return REGION_ORDER
            .filter(region => (map.get(region) ?? []).length > 0)
            .map(region => ({ label: region, zones: map.get(region)! }));
    }, [zones]);

    const zoneGroups = useMemo(() => {
        const order = zones.map(z => z.id);
        const map = new Map<string, { damage: VehicleDamage; index: number }[]>();
        damages.forEach((d, i) => {
            if (!map.has(d.zone)) map.set(d.zone, []);
            map.get(d.zone)!.push({ damage: d, index: i });
        });
        return [...map.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    }, [damages, zones]);

    const selectedEntries = selected
        ? damages.map((d, i) => ({ damage: d, index: i })).filter(e => e.damage.zone === selected)
        : [];

    const severityCounts = useMemo(() => {
        const counts: Record<string, number> = { minor: 0, moderate: 0, severe: 0 };
        for (const d of damages) counts[d.severity] = (counts[d.severity] ?? 0) + 1;
        return counts;
    }, [damages]);

    const commit = (next: VehicleDamage[]) => {
        historyRef.current = [...historyRef.current.slice(-19), damages];
        setHistoryLen(historyRef.current.length);
        onChange?.(next);
    };

    const undo = () => {
        const h = historyRef.current;
        if (!h.length) return;
        const prev = h[h.length - 1];
        historyRef.current = h.slice(0, -1);
        setHistoryLen(historyRef.current.length);
        onChange?.(prev);
        if (toastRef.current !== null) {
            toast.dismiss(toastRef.current);
            toastRef.current = null;
        }
    };

    const selectZone = (zoneId: string) => {
        if (readOnly) return;
        setSelected(zoneId);
        setPartMode(true);
        setEditingIndex(null);
    };

    // Scroll the editor into view on smaller screens so tapping a part doesn't
    // leave the controls below the fold.
    useEffect(() => {
        if (selected && !readOnly && window.innerWidth < 1024) {
            editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [selected, readOnly]);

    const openPhotoPicker = (target: number | 'new') => {
        photoTargetRef.current = target;
        photoInputRef.current?.click();
    };

    const handlePhotoPicked = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !onChange) return;
        const target = photoTargetRef.current;
        photoTargetRef.current = null;
        if (target === 'new') {
            setPhoto(file);
        } else if (typeof target === 'number') {
            commit(damages.map((d, i) => (i === target ? { ...d, photo: file } : d)));
        }
    };

    // Add a mark at a normalized (0..1) point inside the given zone. Note and
    // photo are per-mark and cleared so they don't leak into the next mark;
    // type/severity persist as defaults.
    const addDamageAt = (zoneId: string, x: number, y: number) => {
        if (!onChange) return;
        commit([
            ...damages,
            {
                zone: zoneId,
                type,
                severity,
                x,
                y,
                note: note.trim() ? note.trim() : undefined,
                photo: photo ?? undefined,
            },
        ]);
        if (!markContinue) {
            setNote('');
        }
        setPhoto(null);
        toastRef.current = toast('Damage added', {
            action: { label: 'Undo', onClick: undo },
        });
    };

    const handleDiagramPlace = (zoneId: string, x: number, y: number) => {
        setSelected(zoneId);
        setPartMode(true);
        setEditingIndex(null);
        addDamageAt(zoneId, x, y);
    };

    const removeDamage = (index: number) => {
        if (!onChange) return;
        if (editingIndex === index) setEditingIndex(null);
        commit(damages.filter((_, i) => i !== index));
        toastRef.current = toast('Damage removed', {
            action: { label: 'Undo', onClick: undo },
        });
    };

    const clearAll = () => {
        if (!onChange || !damages.length) return;
        setEditingIndex(null);
        commit([]);
        toastRef.current = toast(`Cleared ${damages.length} damage mark${damages.length !== 1 ? 's' : ''}`, {
            action: { label: 'Undo', onClick: undo },
        });
    };

    const startEdit = (index: number) => {
        const d = damages[index];
        if (!d) return;
        setEditingIndex(index);
    };

    const saveEdit = (payload: VehicleDamage) => {
        if (editingIndex === null || !onChange) return;
        commit(damages.map((d, i) =>
            i === editingIndex
                ? { ...d, ...payload }
                : d,
        ));
        setEditingIndex(null);
    };

    const renderRow = (damage: VehicleDamage, index: number, editable: boolean) => {
        if (editable && index === editingIndex) {
            return (
                <InlineDamageEditor
                    key={index}
                    damage={damage}
                    onSave={saveEdit}
                    onCancel={() => setEditingIndex(null)}
                />
            );
        }
        return (
            <DamageRow
                key={index}
                damage={damage}
                onEdit={editable ? () => startEdit(index) : undefined}
                onRemove={editable ? () => removeDamage(index) : undefined}
                onPhoto={editable ? () => openPhotoPicker(index) : undefined}
                onRemovePhoto={editable ? () => commit(damages.map((d, i) => (i === index ? { ...d, photo: undefined } : d))) : undefined}
            />
        );
    };

    return (
        <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                    {SEVERITIES.map(s => (
                        <span key={s.value} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[s.value] }} />
                            <span className="font-semibold text-foreground">{severityCounts[s.value] ?? 0}</span>
                            <span>{s.label}</span>
                        </span>
                    ))}
                    {damages.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                            {damages.length} total
                        </span>
                    )}
                </div>
                {!readOnly && (historyLen > 0 || damages.length > 0) && (
                    <div className="flex items-center gap-2">
                        {historyLen > 0 && (
                            <button
                                type="button"
                                onClick={undo}
                                className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                            >
                                Undo
                            </button>
                        )}
                        {damages.length > 0 && (
                            <button
                                type="button"
                                onClick={clearAll}
                                className="text-[10px] text-destructive hover:underline"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className={`flex flex-col gap-3 ${stacked ? '' : 'lg:flex-row lg:items-stretch'}`}>
                <div className={`mx-auto w-full ${DIAGRAM_SIZES[size]} shrink-0 lg:mx-0`}>
                    <div className="rounded-xl border bg-muted/20 p-4">
                        <div className="flex shrink-0 items-center justify-center gap-2">
                            <p className="text-[11px] font-medium text-foreground">
                                {SHAPE_LABELS[shape]}
                            </p>
                            {damages.length > 0 ? (
                                <span
                                    className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                                    style={{ backgroundColor: accent.badge }}
                                >
                                    {damages.length} mark{damages.length !== 1 ? 's' : ''}
                                </span>
                            ) : (
                                <span className="text-[10px] text-muted-foreground">No damage marked</span>
                            )}
                        </div>

                        {!readOnly && quickZones.length > 0 && (
                            <div className="mt-3">
                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Quick parts
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {quickZones.map(zone => {
                                        const count = countFor(zone.id);
                                        const isSelected = selected === zone.id;
                                        const heat = count > 0 ? SEVERITY_COLORS[worstSeverity(damages.filter(d => d.zone === zone.id))] : null;
                                        return (
                                            <button
                                                key={zone.id}
                                                type="button"
                                                onClick={() => selectZone(zone.id)}
                                                aria-pressed={isSelected}
                                                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                                    isSelected
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                                }`}
                                                style={heat && !isSelected ? { borderColor: heat, color: heat } : undefined}
                                            >
                                                {zone.label}
                                                {count > 0 && <span className="ml-1 font-bold">{count}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="mt-3">
                            {selected && selectedZone && !readOnly ? (
                                <div>
                                    <div className="mb-2 flex items-center justify-between gap-1">
                                        <button
                                            type="button"
                                            onClick={() => prevZone && selectZone(prevZone)}
                                            disabled={!prevZone}
                                            className="flex h-7 w-7 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                                            aria-label="Previous part"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <span className="truncate text-[11px] font-semibold text-foreground">{zoneLabel(selected)}</span>
                                        <button
                                            type="button"
                                            onClick={() => nextZone && selectZone(nextZone)}
                                            disabled={!nextZone}
                                            className="flex h-7 w-7 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                                            aria-label="Next part"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="mb-2 flex items-center justify-between gap-1.5">
                                        <div className="flex rounded-md border bg-background p-0.5">
                                            <button
                                                type="button"
                                                onClick={() => setPartMode(false)}
                                                aria-pressed={!partMode}
                                                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${!partMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                Full car
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPartMode(true)}
                                                aria-pressed={partMode}
                                                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${partMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                Part zoom
                                            </button>
                                        </div>
                                    </div>
                                    <BlueprintDiagram
                                        damages={damages}
                                        selected={selected}
                                        readOnly={readOnly}
                                        onPlace={handleDiagramPlace}
                                        mode={partMode ? 'part' : 'sheet'}
                                        zone={selectedZone}
                                        onPhotoClick={readOnly ? openDamagePhoto : undefined}
                                    />
                                </div>
                            ) : (
                                <div
                                    onPointerDown={readOnly && damages.length > 0 ? (e) => {
                                        enlargePressRef.current = { x: e.clientX, y: e.clientY };
                                    } : undefined}
                                    onPointerUp={readOnly && damages.length > 0 ? (e) => {
                                        const start = enlargePressRef.current;
                                        enlargePressRef.current = null;
                                        if (!start) return;
                                        const dx = e.clientX - start.x;
                                        const dy = e.clientY - start.y;
                                        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) return;
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
                                        setExpanded(true);
                                    } : undefined}
                                    onPointerCancel={readOnly && damages.length > 0 ? () => {
                                        enlargePressRef.current = null;
                                    } : undefined}
                                    role={readOnly && damages.length > 0 ? 'button' : undefined}
                                    tabIndex={readOnly && damages.length > 0 ? 0 : undefined}
                                    onKeyDown={readOnly && damages.length > 0 ? (e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setExpanded(true);
                                        }
                                    } : undefined}
                                    className={readOnly && damages.length > 0 ? 'cursor-zoom-in select-none' : ''}
                                    title={readOnly && damages.length > 0 ? 'Click to enlarge' : undefined}
                                >
                                    <BlueprintDiagram
                                        damages={damages}
                                        selected={selected}
                                        readOnly={readOnly}
                                        onPlace={handleDiagramPlace}
                                        onPhotoClick={readOnly ? openDamagePhoto : undefined}
                                    />
                                    {readOnly && damages.length > 0 && (
                                        <p className="mt-1 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                                            <ZoomIn className="h-3 w-3" />
                                            Click diagram to enlarge
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-3 max-h-[30vh] space-y-3 overflow-y-auto pr-1">
                            <PhotoGallery photos={photoItems} onOpen={setLightboxIndex} />

                            <div className="space-y-0.5">
                            {regionGroups.map(region => {
                                const regionCount = region.zones.reduce((sum, z) => sum + countFor(z.id), 0);
                                return (
                                    <details key={region.label} className="group">
                                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
                                            <span className="flex items-center gap-1.5">
                                                {region.label}
                                                {regionCount > 0 && (
                                                    <span
                                                        className="rounded-full px-1.5 text-[9px] font-bold text-white"
                                                        style={{ backgroundColor: accent.badge }}
                                                    >
                                                        {regionCount}
                                                    </span>
                                                )}
                                            </span>
                                            <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                                        </summary>
                                        <div className="mt-1 grid grid-cols-2 gap-1.5 pb-1.5">
                                            {region.zones.map(zone => {
                                                const count = countFor(zone.id);
                                                const isSelected = selected === zone.id;
                                                const heat = count > 0 ? SEVERITY_COLORS[worstSeverity(damages.filter(d => d.zone === zone.id))] : null;
                                                return (
                                                    <button
                                                        key={zone.id}
                                                        type="button"
                                                        onClick={readOnly ? undefined : () => selectZone(zone.id)}
                                                        aria-pressed={isSelected}
                                                        className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-left text-[11px] font-medium transition-colors ${
                                                            isSelected
                                                                ? 'border-primary bg-primary/10 text-primary'
                                                                : heat
                                                                    ? 'border-transparent'
                                                                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                                        } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                                        style={heat && !isSelected ? { backgroundColor: `${heat}1f`, color: heat } : undefined}
                                                    >
                                                        <span className="truncate">{zone.label}</span>
                                                        {count > 0 && (
                                                            <span
                                                                className="ml-auto rounded-full px-1 text-[9px] font-bold text-white shrink-0"
                                                                style={{ backgroundColor: heat ?? '#94a3b8' }}
                                                            >
                                                                {count}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </details>
                                );
                            })}
                            </div>
                        </div>
                    </div>
                </div>

                <div ref={editorRef} className="min-w-0 flex-1 space-y-2 lg:flex lg:flex-col">
                    {!readOnly && selected ? (
                        <div className="space-y-2.5 rounded-lg border bg-muted/30 p-2.5 lg:flex lg:flex-1 lg:flex-col">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-semibold text-foreground">{zoneLabel(selected)}</p>
                                <button
                                    type="button"
                                    onClick={() => setSelected(null)}
                                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1.5">
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                        Next mark
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setMarkContinue(v => !v)}
                                        aria-pressed={markContinue}
                                        className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                                            markContinue
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                    >
                                        <Repeat className="h-3 w-3" />
                                        Mark & continue
                                    </button>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-2 py-1.5">
                                    <DamageIcon
                                        type={type}
                                        className="h-4 w-4 shrink-0"
                                        style={{ color: SEVERITY_COLORS[severity] ?? '#94a3b8' }}
                                    />
                                    <span className="truncate text-xs font-medium text-foreground">{typeLabel(type)}</span>
                                    <span
                                        className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                                        style={{ backgroundColor: `${SEVERITY_COLORS[severity] ?? '#94a3b8'}1f`, color: SEVERITY_COLORS[severity] ?? '#94a3b8' }}
                                    >
                                        {severityLabel(severity)}
                                    </span>
                                    {note.trim() && <span className="truncate text-[11px] text-muted-foreground">· {note.trim()}</span>}
                                </div>
                            </div>

                            {selectedEntries.length > 0 && (
                                <div className="space-y-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                        Marked on this part
                                    </p>
                                    {selectedEntries.map(({ damage, index }) => renderRow(damage, index, true))}
                                </div>
                            )}

                            <div className="space-y-1">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                    Severity
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {SEVERITIES.map(s => (
                                        <button
                                            key={s.value}
                                            type="button"
                                            onClick={() => setSeverity(s.value)}
                                            aria-pressed={severity === s.value}
                                            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                                                severity === s.value
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                            }`}
                                        >
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[s.value] }} />
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                    Type
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {DAMAGE_TYPES.map(t => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => setType(t.value)}
                                            aria-pressed={type === t.value}
                                            className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                                                type === t.value
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <input
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Note (optional)"
                                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                            />

                            <div className="flex items-center gap-2">
                                {photo ? (
                                    <DamagePhotoThumb photo={photo} onRemove={() => setPhoto(null)} />
                                ) : (
                                    <span className="text-[10px] text-muted-foreground">Photo (optional)</span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => openPhotoPicker('new')}
                                    className="ml-auto h-8 rounded-md border bg-background px-2.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                >
                                    {photo ? 'Replace photo' : 'Upload photo'}
                                </button>
                            </div>

                            <div className="space-y-1 border-t border-border pt-2">
                                <p className="text-[10px] text-muted-foreground">
                                    {markContinue
                                        ? `Tap the car to keep adding ${typeLabel(type).toLowerCase()} marks — the note stays.`
                                        : 'Tap the exact spot on the car — the mark is placed right there.'}
                                </p>
                            </div>
                        </div>
                    ) : damages.length === 0 ? (
                        readOnly ? (
                            <p className="flex items-center gap-1 text-[11px] text-muted-foreground leading-snug">
                                <Check className="w-3 h-3 shrink-0 text-emerald-500" />
                                No damages recorded
                            </p>
                        ) : (
                            <div className="rounded-lg border bg-muted/20 p-4 lg:flex-1">
                                <div className="flex items-center gap-2">
                                    <MousePointerClick className="h-4 w-4 text-primary" />
                                    <p className="text-xs font-semibold text-foreground">Mark damage where it is</p>
                                </div>
                                <ol className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                                    <li>1. Set severity, type, note or photo first (tap a part to open the controls)</li>
                                    <li>2. Tap the exact spot on the car — the mark is placed there</li>
                                </ol>
                                <div className="mt-3 flex items-center gap-3 border-t pt-2">
                                    {SEVERITIES.map(s => (
                                        <span key={s.value} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SEVERITY_COLORS[s.value] }} />
                                            {s.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="max-h-60 space-y-2 overflow-y-auto pr-1 lg:max-h-none lg:min-h-0 lg:flex-1">
                            {zoneGroups.map(([zoneId, list]) => (
                                <div key={zoneId}>
                                    <div className="mb-1 flex items-center gap-1.5">
                                        <p className="text-[10px] font-medium text-muted-foreground">{zoneLabel(zoneId)}</p>
                                        <span
                                            className="rounded-full px-1.5 text-[9px] font-bold text-white"
                                            style={{ backgroundColor: SEVERITY_COLORS[worstSeverity(list.map(e => e.damage))] }}
                                        >
                                            {list.length}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {list.map(({ damage, index }) => renderRow(damage, index, !readOnly))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoPicked}
            />
            <Lightbox
                photos={photoItems}
                index={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onPrev={prevPhoto}
                onNext={nextPhoto}
            />
            {expanded && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
                    onClick={() => setExpanded(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <button
                        type="button"
                        onClick={() => setExpanded(false)}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        title="Close"
                        aria-label="Close enlarged diagram"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                        <div className="mb-2 flex items-center justify-center gap-2 text-sm font-medium text-white">
                            {SHAPE_LABELS[shape]}
                            {damages.length > 0 && (
                                <span
                                    className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                                    style={{ backgroundColor: accent.badge }}
                                >
                                    {damages.length} mark{damages.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <div className="rounded-xl border border-white/15 bg-background p-3">
                            <BlueprintDiagram
                                damages={damages}
                                selected={selected}
                                readOnly
                                enableZoom
                                onPlace={handleDiagramPlace}
                                onPhotoClick={openDamagePhoto}
                            />
                        </div>
                        <p className="mt-2 text-center text-[11px] text-white/60">
                            Use the zoom controls or drag to inspect damage marks
                            {damages.some(d => !!d.photo) && ' · click a camera badge to view its photo'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
