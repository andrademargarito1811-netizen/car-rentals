import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DEFAULT_CENTER: [number, number] = [7.5149, 134.5825];

interface LocationMapPickerProps {
    lat: string | number;
    lng: string | number;
    onLatChange: (lat: string) => void;
    onLngChange: (lng: string) => void;
    errors?: Record<string, string>;
    className?: string;
    standalone?: boolean;
}

function DraggableMarker({ lat, lng, onLatChange, onLngChange }: {
    lat: number;
    lng: number;
    onLatChange: (v: string) => void;
    onLngChange: (v: string) => void;
}) {
    const markerRef = useRef<L.Marker>(null);

    useMapEvents({
        click(e) {
            onLatChange(e.latlng.lat.toFixed(6));
            onLngChange(e.latlng.lng.toFixed(6));
        },
    });

    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        }
    }, [lat, lng]);

    return (
        <Marker
            ref={markerRef}
            position={[lat, lng]}
            draggable
            eventHandlers={{
                dragend(e) {
                    const m = e.target as L.Marker;
                    const pos = m.getLatLng();
                    onLatChange(pos.lat.toFixed(6));
                    onLngChange(pos.lng.toFixed(6));
                },
            }}
        />
    );
}

function MapController({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current && lat && lng) {
            map.setView([lat, lng], 15);
            initialized.current = true;
        }
    }, [lat, lng, map]);

    return null;
}

function MapView({ lat, lng, onLatChange, onLngChange, className }: {
    lat: number;
    lng: number;
    onLatChange: (v: string) => void;
    onLngChange: (v: string) => void;
    className?: string;
}) {
    return (
        <div className={cn('h-72 rounded-xl overflow-hidden border border-input', className)}>
            <MapContainer
                center={DEFAULT_CENTER}
                zoom={6}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <DraggableMarker
                    lat={lat}
                    lng={lng}
                    onLatChange={onLatChange}
                    onLngChange={onLngChange}
                />
                <MapController lat={lat} lng={lng} />
            </MapContainer>
        </div>
    );
}

export default function LocationMapPicker({
    lat,
    lng,
    onLatChange,
    onLngChange,
    errors,
    className,
    standalone,
}: LocationMapPickerProps) {
    const latNum = Number(lat) || DEFAULT_CENTER[0];
    const lngNum = Number(lng) || DEFAULT_CENTER[1];

    if (standalone) {
        return (
            <MapView
                lat={latNum}
                lng={lngNum}
                onLatChange={onLatChange}
                onLngChange={onLngChange}
                className={cn('h-full rounded-none border-0', className)}
            />
        );
    }

    return (
        <div className="space-y-3">
            <Label className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                Location on Map
            </Label>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Input
                        type="number"
                        step="any"
                        placeholder="Latitude"
                        value={lat}
                        onChange={e => onLatChange(e.target.value)}
                    />
                    {errors?.lat && <p className="text-xs text-red-500">{errors.lat}</p>}
                </div>
                <div className="space-y-1">
                    <Input
                        type="number"
                        step="any"
                        placeholder="Longitude"
                        value={lng}
                        onChange={e => onLngChange(e.target.value)}
                    />
                    {errors?.lng && <p className="text-xs text-red-500">{errors.lng}</p>}
                </div>
            </div>
            <MapView
                lat={latNum}
                lng={lngNum}
                onLatChange={onLatChange}
                onLngChange={onLngChange}
                className={className}
            />
            <p className="text-xs text-surface-500">Click on the map or drag the marker to set coordinates</p>
        </div>
    );
}
