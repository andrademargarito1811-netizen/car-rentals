export interface AdminLocation {
    location_id: number;
    location: string;
    subtitle: string | null;
    city: string | null;
    address: string | null;
    phone: string | null;
    hours: string | null;
    lat: number | null;
    lng: number | null;
    image: string | null;
    description: string | null;
    features: string[] | null;
    sort_order: number;
    is_active: number;
}
