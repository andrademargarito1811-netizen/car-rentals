import type { CarShape } from '@/lib/carZones';

export interface IsometricZone {
    id: string;
    label: string;
    path: string;
    labelPos: { x: number; y: number };
}

export interface IsometricCar {
    viewBox: string;
    body: string;
    shadow: string;
    zones: IsometricZone[];
    details: string[];
}

const SEDAN_ISOMETRIC: IsometricCar = {
    viewBox: '0 0 400 280',
    shadow: 'M60,230 Q200,260 340,230 Q350,240 340,248 Q200,278 60,248 Q50,240 60,230 Z',
    body: `
        M50,180 L50,140 Q50,120 70,110 L120,90 Q140,82 160,80 L240,80 Q260,82 280,90 L330,110 Q350,120 350,140 L350,180 Q350,195 340,200 L60,200 Q50,195 50,180 Z
        M120,90 L120,60 Q120,45 135,40 L190,25 Q200,22 210,25 L265,40 Q280,45 280,60 L280,90
        M80,200 L80,215 Q80,225 90,228 L110,232 Q115,233 118,230 L118,200
        M282,200 L282,230 Q285,233 290,232 L310,228 Q320,225 320,215 L320,200
    `,
    details: [
        // Window shine
        'M135,50 L195,32 Q200,30 205,32 L255,48 Q258,50 255,52 L135,68 Q132,68 135,50 Z',
        // Hood line
        'M100,110 L100,80 M110,108 L110,78 M120,105 L120,76',
        // Door handle
        'M130,140 L150,140 M250,140 L270,140',
        // Headlight
        'M60,155 L55,155 Q48,155 48,160 L48,175 Q48,180 55,180 L65,180',
        // Taillight
        'M340,155 L345,155 Q352,155 352,160 L352,175 Q352,180 345,180 L335,180',
        // Grille
        'M55,160 L55,175 M58,158 L58,177 M61,157 L61,178',
    ],
    zones: [
        // Hood (top-front visible area)
        {
            id: 'hood',
            label: 'Hood',
            path: 'M100,110 L100,80 Q100,72 120,68 L180,55 Q200,50 220,55 L280,68 Q300,72 300,80 L300,110 Q300,115 280,118 L120,118 Q100,115 100,110 Z',
            labelPos: { x: 200, y: 88 },
        },
        // Windshield
        {
            id: 'windshield',
            label: 'Windshield',
            path: 'M135,50 L195,32 Q200,30 205,32 L255,48 Q265,52 260,58 L140,75 Q132,70 135,50 Z',
            labelPos: { x: 200, y: 52 },
        },
        // Roof
        {
            id: 'roof',
            label: 'Roof',
            path: 'M140,75 L260,58 Q268,55 270,48 L280,40 Q285,38 290,40 L330,55 Q335,58 330,62 L100,85 Q95,82 100,78 L130,68 Q135,65 140,68 Z',
            labelPos: { x: 215, y: 62 },
        },
        // Rear windshield
        {
            id: 'rear_windshield',
            label: 'Rear Window',
            path: 'M100,85 L330,62 Q338,60 340,65 L345,80 Q346,88 340,90 L100,110 Q94,108 95,100 L98,88 Q99,85 100,85 Z',
            labelPos: { x: 220, y: 92 },
        },
        // Trunk
        {
            id: 'trunk',
            label: 'Trunk',
            path: 'M100,110 L340,90 Q348,88 350,95 L350,130 Q350,140 340,145 L100,165 Q90,160 90,150 L90,125 Q90,115 100,110 Z',
            labelPos: { x: 220, y: 125 },
        },
        // Left side (visible in isometric)
        {
            id: 'left_side',
            label: 'Left Side',
            path: 'M100,165 L90,170 Q80,175 75,185 L70,200 Q68,210 75,215 L100,225 Q110,228 118,225 L118,200 L120,165 Q115,162 100,165 Z',
            labelPos: { x: 95, y: 195 },
        },
        // Front bumper
        {
            id: 'front_bumper',
            label: 'Front Bumper',
            path: 'M60,180 L60,155 Q55,145 50,140 L50,130 Q48,125 55,120 L80,110 Q90,105 100,110 L100,165 Q95,170 85,175 L70,180 Q65,182 60,180 Z',
            labelPos: { x: 75, y: 148 },
        },
        // Rear bumper
        {
            id: 'rear_bumper',
            label: 'Rear Bumper',
            path: 'M350,140 L350,130 Q352,125 345,120 L330,115 Q320,112 310,115 L310,175 Q315,180 325,182 L340,185 Q348,186 350,180 L350,160 Q352,150 350,140 Z',
            labelPos: { x: 335, y: 152 },
        },
        // Front left wheel
        {
            id: 'front_left_wheel',
            label: 'FL Wheel',
            path: 'M75,200 Q70,195 68,188 Q65,178 72,170 Q80,162 90,165 Q98,168 100,178 Q102,188 98,198 Q94,208 85,212 Q76,214 72,208 Q70,204 75,200 Z',
            labelPos: { x: 84, y: 190 },
        },
        // Rear left wheel
        {
            id: 'rear_left_wheel',
            label: 'RL Wheel',
            path: 'M280,205 Q275,200 273,193 Q270,183 277,175 Q285,167 295,170 Q303,173 305,183 Q307,193 303,203 Q299,213 290,217 Q281,219 277,213 Q275,209 280,205 Z',
            labelPos: { x: 289, y: 195 },
        },
    ],
};

const SUV_ISOMETRIC: IsometricCar = {
    viewBox: '0 0 400 300',
    shadow: 'M55,250 Q200,280 345,250 Q355,260 345,268 Q200,298 55,268 Q45,260 55,250 Z',
    body: `
        M45,190 L45,145 Q45,125 65,115 L115,95 Q135,87 155,85 L245,85 Q265,87 285,95 L335,115 Q355,125 355,145 L355,190 Q355,205 345,210 L55,210 Q45,205 45,190 Z
        M115,95 L115,55 Q115,38 132,32 L190,18 Q200,15 210,18 L268,32 Q285,38 285,55 L285,95
        M75,210 L75,228 Q75,238 85,241 L108,245 Q113,246 116,243 L116,210
        M284,210 L284,243 Q287,246 292,245 L315,241 Q325,238 325,228 L325,210
    `,
    details: [
        'M130,45 L192,26 Q200,23 208,26 L260,42 Q264,44 260,47 L135,65 Q130,62 130,45 Z',
        'M95,115 L95,82 M105,113 L105,80 M115,110 L115,78',
        'M125,148 L148,148 M252,148 L275,148',
        'M55,160 L50,160 Q42,160 42,166 L42,182 Q42,188 50,188 L60,188',
        'M345,160 L350,160 Q358,160 358,166 L358,182 Q358,188 350,188 L340,188',
        'M50,165 L50,182 M53,163 L53,184 M56,162 L56,185',
    ],
    zones: [
        {
            id: 'hood',
            label: 'Hood',
            path: 'M95,115 L95,82 Q95,74 115,70 L175,56 Q200,50 225,56 L285,70 Q305,74 305,82 L305,115 Q305,120 285,123 L115,123 Q95,120 95,115 Z',
            labelPos: { x: 200, y: 92 },
        },
        {
            id: 'windshield',
            label: 'Windshield',
            path: 'M130,45 L192,26 Q200,23 208,26 L260,42 Q272,48 265,56 L140,75 Q128,68 130,45 Z',
            labelPos: { x: 200, y: 50 },
        },
        {
            id: 'roof',
            label: 'Roof',
            path: 'M140,75 L265,56 Q275,52 278,44 L285,36 Q290,33 295,36 L338,52 Q345,56 340,62 L95,90 Q88,86 92,80 L128,66 Q135,62 140,68 Z',
            labelPos: { x: 218, y: 62 },
        },
        {
            id: 'rear_windshield',
            label: 'Rear Window',
            path: 'M95,90 L340,62 Q350,58 352,65 L355,82 Q356,92 348,95 L95,120 Q88,116 88,108 L90,95 Q92,90 95,90 Z',
            labelPos: { x: 222, y: 98 },
        },
        {
            id: 'trunk',
            label: 'Trunk',
            path: 'M95,120 L348,95 Q358,92 358,100 L358,140 Q358,152 348,157 L95,178 Q85,173 85,163 L85,138 Q85,128 95,120 Z',
            labelPos: { x: 222, y: 138 },
        },
        {
            id: 'left_side',
            label: 'Left Side',
            path: 'M95,178 L85,183 Q75,188 70,198 L65,212 Q63,222 70,227 L100,238 Q110,241 118,238 L118,210 L120,178 Q115,175 95,178 Z',
            labelPos: { x: 92, y: 208 },
        },
        {
            id: 'front_bumper',
            label: 'Front Bumper',
            path: 'M55,190 L55,160 Q50,150 45,145 L45,132 Q42,125 50,120 L75,110 Q88,105 95,110 L95,178 Q90,183 80,188 L68,192 Q60,194 55,190 Z',
            labelPos: { x: 72, y: 155 },
        },
        {
            id: 'rear_bumper',
            label: 'Rear Bumper',
            path: 'M358,155 L358,140 Q360,132 352,127 L338,122 Q328,118 318,122 L318,188 Q322,193 332,195 L345,198 Q355,199 358,192 L358,170 Q360,162 358,155 Z',
            labelPos: { x: 340, y: 160 },
        },
        {
            id: 'front_left_wheel',
            label: 'FL Wheel',
            path: 'M70,212 Q65,207 63,200 Q60,190 67,182 Q75,174 85,177 Q93,180 95,190 Q97,200 93,210 Q89,220 80,224 Q71,226 67,220 Q65,216 70,212 Z',
            labelPos: { x: 80, y: 200 },
        },
        {
            id: 'rear_left_wheel',
            label: 'RL Wheel',
            path: 'M278,218 Q273,213 271,206 Q268,196 275,188 Q283,180 293,183 Q301,186 303,196 Q305,206 301,216 Q297,226 288,230 Q279,232 275,226 Q273,222 278,218 Z',
            labelPos: { x: 288, y: 208 },
        },
    ],
};

const VAN_ISOMETRIC: IsometricCar = {
    viewBox: '0 0 400 280',
    shadow: 'M50,232 Q200,260 350,232 Q360,242 350,250 Q200,278 50,250 Q40,242 50,232 Z',
    body: `
        M40,175 L40,125 Q40,105 60,95 L110,78 Q130,70 150,68 L250,68 Q270,70 290,78 L340,95 Q360,105 360,125 L360,175 Q360,190 350,195 L50,195 Q40,190 40,175 Z
        M110,78 L110,45 Q110,28 128,22 L188,10 Q200,7 212,10 L272,22 Q290,28 290,45 L290,78
        M70,195 L70,212 Q70,222 80,225 L102,229 Q107,230 110,227 L110,195
        M290,195 L290,227 Q293,230 298,229 L320,225 Q330,222 330,212 L330,195
    `,
    details: [
        'M125,38 L190,20 Q200,17 210,20 L265,36 Q270,38 265,41 L130,60 Q124,57 125,38 Z',
        'M88,95 L88,72 M98,93 L98,70 M108,90 L108,68',
        'M120,135 L145,135 M255,135 L280,135',
        'M45,148 L40,148 Q32,148 32,155 L32,172 Q32,178 40,178 L50,178',
        'M355,148 L360,148 Q368,148 368,155 L368,172 Q368,178 360,178 L350,178',
        'M38,152 L38,175 M41,150 L41,177 M44,149 L44,178',
    ],
    zones: [
        {
            id: 'hood',
            label: 'Hood',
            path: 'M88,95 L88,72 Q88,64 108,60 L168,46 Q200,40 232,46 L292,60 Q312,64 312,72 L312,95 Q312,100 292,103 L108,103 Q88,100 88,95 Z',
            labelPos: { x: 200, y: 78 },
        },
        {
            id: 'windshield',
            label: 'Windshield',
            path: 'M125,38 L190,20 Q200,17 210,20 L265,36 Q278,42 270,50 L135,70 Q122,62 125,38 Z',
            labelPos: { x: 200, y: 42 },
        },
        {
            id: 'roof',
            label: 'Roof',
            path: 'M135,70 L270,50 Q282,46 285,38 L292,30 Q298,26 304,30 L348,48 Q355,52 350,58 L88,88 Q82,84 85,78 L125,62 Q132,58 138,65 Z',
            labelPos: { x: 220, y: 55 },
        },
        {
            id: 'rear_windshield',
            label: 'Rear Window',
            path: 'M88,88 L350,58 Q360,55 362,62 L365,80 Q366,90 358,93 L88,118 Q80,114 80,105 L82,93 Q84,88 88,88 Z',
            labelPos: { x: 225, y: 95 },
        },
        {
            id: 'trunk',
            label: 'Tailgate',
            path: 'M88,118 L358,93 Q368,90 368,98 L368,135 Q368,148 358,152 L88,175 Q78,170 78,160 L78,138 Q78,125 88,118 Z',
            labelPos: { x: 225, y: 135 },
        },
        {
            id: 'left_side',
            label: 'Left Side',
            path: 'M88,175 L78,180 Q68,185 63,195 L58,210 Q56,220 63,225 L95,236 Q105,239 113,236 L113,195 L115,175 Q110,172 88,175 Z',
            labelPos: { x: 88, y: 205 },
        },
        {
            id: 'front_bumper',
            label: 'Front Bumper',
            path: 'M50,175 L50,148 Q45,138 40,132 L40,120 Q38,112 45,108 L70,98 Q82,93 88,98 L88,175 Q82,180 72,185 L60,188 Q52,190 50,185 Z',
            labelPos: { x: 65, y: 142 },
        },
        {
            id: 'rear_bumper',
            label: 'Rear Bumper',
            path: 'M368,148 L368,135 Q370,128 362,122 L348,117 Q338,113 328,117 L328,188 Q332,193 342,195 L355,198 Q365,199 368,192 L368,165 Q370,155 368,148 Z',
            labelPos: { x: 350, y: 155 },
        },
        {
            id: 'front_left_wheel',
            label: 'FL Wheel',
            path: 'M63,210 Q58,205 56,198 Q53,188 60,180 Q68,172 78,175 Q86,178 88,188 Q90,198 86,208 Q82,218 73,222 Q64,224 60,218 Q58,214 63,210 Z',
            labelPos: { x: 73, y: 198 },
        },
        {
            id: 'rear_left_wheel',
            label: 'RL Wheel',
            path: 'M283,215 Q278,210 276,203 Q273,193 280,185 Q288,177 298,180 Q306,183 308,193 Q310,203 306,213 Q302,223 293,227 Q284,229 280,223 Q278,219 283,215 Z',
            labelPos: { x: 293, y: 203 },
        },
    ],
};

const PICKUP_ISOMETRIC: IsometricCar = {
    viewBox: '0 0 420 280',
    shadow: 'M55,235 Q210,265 365,235 Q375,245 365,253 Q210,283 55,253 Q45,245 55,235 Z',
    body: `
        M50,180 L50,140 Q50,120 70,110 L120,92 Q140,84 160,82 L230,82 Q250,84 270,92 L320,110 Q340,120 340,140 L340,155 Q340,160 335,162 L230,165 L230,180 Q230,195 220,200 L80,215 Q65,218 58,210 L50,195 Z
        M120,92 L120,58 Q120,42 138,36 L192,22 Q202,19 212,22 L266,36 Q284,42 284,58 L284,92
        M78,215 L78,230 Q78,240 88,243 L108,247 Q113,248 116,245 L116,215
        M298,175 L298,245 Q301,248 306,247 L326,243 Q336,240 336,230 L336,175
    `,
    details: [
        'M133,48 L195,30 Q202,27 210,30 L262,46 Q266,48 262,51 L138,70 Q132,67 133,48 Z',
        'M92,112 L92,82 M102,110 L102,80 M112,108 L112,78',
        'M128,140 L152,140 M248,140 L272,140',
        'M55,155 L50,155 Q42,155 42,162 L42,178 Q42,184 50,184 L60,184',
        'M338,155 L343,155 Q351,155 351,162 L351,178 Q351,184 343,184 L333,184',
        'M48,160 L48,178 M51,158 L51,180 M54,157 L54,181',
        // Bed lines
        'M85,200 L225,185 M90,205 L220,190 M95,210 L215,195',
    ],
    zones: [
        {
            id: 'hood',
            label: 'Hood',
            path: 'M92,112 L92,82 Q92,74 112,70 L172,56 Q202,50 232,56 L292,70 Q312,74 312,82 L312,112 Q312,117 292,120 L112,120 Q92,117 92,112 Z',
            labelPos: { x: 202, y: 90 },
        },
        {
            id: 'windshield',
            label: 'Windshield',
            path: 'M133,48 L195,30 Q202,27 210,30 L262,46 Q274,52 266,60 L138,80 Q126,72 133,48 Z',
            labelPos: { x: 202, y: 52 },
        },
        {
            id: 'roof',
            label: 'Roof',
            path: 'M138,80 L266,60 Q278,56 280,48 L284,40 Q290,36 296,40 L338,56 Q345,60 340,66 L92,96 Q85,92 88,85 L128,72 Q135,68 140,75 Z',
            labelPos: { x: 218, y: 65 },
        },
        {
            id: 'rear_windshield',
            label: 'Cab Window',
            path: 'M92,96 L340,66 Q350,62 352,70 L355,88 Q356,98 348,100 L92,128 Q84,124 84,115 L86,100 Q88,96 92,96 Z',
            labelPos: { x: 222, y: 102 },
        },
        {
            id: 'bed',
            label: 'Pickup Bed',
            path: 'M92,128 L348,100 Q358,97 358,105 L358,140 Q358,152 348,157 L92,178 Q82,173 82,163 L82,140 Q82,132 92,128 Z',
            labelPos: { x: 222, y: 142 },
        },
        {
            id: 'left_side',
            label: 'Left Side',
            path: 'M92,178 L82,183 Q72,188 67,198 L62,212 Q60,222 67,227 L97,238 Q107,241 115,238 L115,215 L117,178 Q112,175 92,178 Z',
            labelPos: { x: 90, y: 208 },
        },
        {
            id: 'front_bumper',
            label: 'Front Bumper',
            path: 'M55,180 L55,155 Q50,145 45,140 L45,128 Q42,120 50,115 L75,105 Q88,100 92,105 L92,178 Q87,183 77,188 L65,192 Q57,194 55,190 Z',
            labelPos: { x: 70, y: 150 },
        },
        {
            id: 'rear_bumper',
            label: 'Rear Bumper',
            path: 'M358,150 L358,140 Q360,132 352,127 L338,122 Q328,118 318,122 L318,188 Q322,193 332,195 L345,198 Q355,199 358,192 L358,168 Q360,158 358,150 Z',
            labelPos: { x: 340, y: 158 },
        },
        {
            id: 'front_left_wheel',
            label: 'FL Wheel',
            path: 'M67,212 Q62,207 60,200 Q57,190 64,182 Q72,174 82,177 Q90,180 92,190 Q94,200 90,210 Q86,220 77,224 Q68,226 64,220 Q62,216 67,212 Z',
            labelPos: { x: 77, y: 200 },
        },
        {
            id: 'rear_left_wheel',
            label: 'RL Wheel',
            path: 'M290,218 Q285,213 283,206 Q280,196 287,188 Q295,180 305,183 Q313,186 315,196 Q317,206 313,216 Q309,226 300,230 Q291,232 287,226 Q285,222 290,218 Z',
            labelPos: { x: 300, y: 208 },
        },
    ],
};

export const ISOMETRIC_CARS: Record<CarShape, IsometricCar> = {
    sedan: SEDAN_ISOMETRIC,
    suv: SUV_ISOMETRIC,
    van: VAN_ISOMETRIC,
    pickup: PICKUP_ISOMETRIC,
};

export interface ZoneBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

const zoneBoxesCache: Partial<Record<CarShape, Record<string, ZoneBox>>> = {};

// Measures each zone path's bounding box (in the car's viewBox units) so damage
// marks can be placed at normalized (x, y) coordinates. Uses an off-screen SVG so
// it also works when the host layout is display:none (e.g. the print layout).
export function getIsoZoneBoxes(shape: CarShape): Record<string, ZoneBox> {
    if (zoneBoxesCache[shape]) return zoneBoxesCache[shape]!;

    const iso = ISOMETRIC_CARS[shape];
    const boxes: Record<string, ZoneBox> = {};
    if (typeof document !== 'undefined') {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('xmlns', ns);
        svg.style.position = 'absolute';
        svg.style.left = '-9999px';
        svg.style.top = '-9999px';
        svg.style.width = '1px';
        svg.style.height = '1px';
        iso.zones.forEach(zone => {
            const path = document.createElementNS(ns, 'path');
            path.setAttribute('d', zone.path);
            svg.appendChild(path);
        });
        document.body.appendChild(svg);
        iso.zones.forEach((zone, i) => {
            const b = (svg.children[i] as SVGPathElement).getBBox();
            boxes[zone.id] = { x: b.x, y: b.y, width: b.width, height: b.height };
        });
        document.body.removeChild(svg);
    }
    zoneBoxesCache[shape] = boxes;
    return boxes;
}
