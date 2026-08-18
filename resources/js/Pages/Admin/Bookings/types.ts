import { type VehicleDamage } from '@/lib/carZones';

export interface BookingPayment {
    id: string;
    type: string;
    amount: number;
    payment_method: string;
    payment_status: string;
    transaction_id: string | null;
    created_at: string;
}

export interface BookingTax {
    tax_desc: string;
    amount: number;
    add_or_minus: boolean;
    tax: { rate: number; value_in: string; calculation: string } | null;
}

export interface BookingExtraCharge {
    id: number;
    name: string;
    rate: string;
    value_in: string;
    calculation: string;
    operator: string;
    taxable: boolean;
    amount: string;
    tax_amount: string;
    source: string;
    created_at: string;
}

export interface RelatedBooking {
    id: number;
    reference_code: string | null;
    start_date: string;
    end_date: string;
    status: string;
    total_amount: number;
    car: { brand: string; model: string; license_plate: string } | null;
}

export interface TimelineEvent {
    id: string;
    type: 'created' | 'status' | 'payment' | 'refund' | 'extension' | 'rebook' | 'swap' | 'modified' | 'rescheduled' | 'cancelled' | 'charges' | 'checkout' | 'checkin' | 'other';
    title: string;
    description: string | null;
    at: string | null;
    user: string | null;
    amount?: number;
    related_booking_id?: number;
    related_reference?: string | null;
}

export interface BookingSwap {
    id: number;
    swap_date: string;
    swap_time: string | null;
    from_days: number;
    to_days: number;
    from_subtotal: number;
    to_subtotal: number;
    old_total_amount: number;
    new_total_amount: number;
    price_delta: number;
    created_at: string;
    from_car: { id: number; brand: string; model: string; year: number; license_plate: string; daily_rate: number } | null;
    to_car: { id: number; brand: string; model: string; year: number; license_plate: string; daily_rate: number } | null;
}

export interface SwapSegment {
    car: { id: number; brand: string; model: string; year: number; license_plate: string; daily_rate: number } | null;
    start_date: string;
    end_date: string;
    days: number;
    daily_rate: number;
    subtotal: number;
}

export interface AdminBooking {
    id: number;
    reference_code: string | null;
    start_date: string;
    end_date: string;
    pickup_time: string | null;
    return_time: string | null;
    pickup_location: { location: string } | null;
    return_location: { location: string } | null;
    total_amount: number;
    status: string;
    notes: string | null;
    extension_source: RelatedBooking | null;
    extension_children: RelatedBooking[];
    timeline: TimelineEvent[];
    swaps: BookingSwap[];
    swap_segments: SwapSegment[];
    user: { id: number; name: string; email: string; phone: string | null; address: string | null; created_at: string } | null;
    guest: { guest_id: number; title: string | null; first_name: string; last_name: string; email: string; phone: string | null; address: string | null; address2: string | null; country: string | null; state: string | null; city: string | null; postal_code: string | null; driver_age: number | null; company_name: string | null; flight_no: string | null } | null;
    car: {
        id: number;
        brand: string;
        model: string;
        year: number;
        license_plate: string;
        daily_rate: number;
        color: string | null;
        transmission: string;
        fuel_type: string;
        seats: number | null;
        vehicle_doors: number | null;
        image_path: string | null;
        air_conditioned: boolean;
        engine: string | null;
        baggage_capacity: number | null;
        description: string | null;
        vin: string | null;
        fuel_charges: number | null;
        free_km_per_day: number | null;
        additional_km_rate: number | null;
        vehicle_type: string | null;
    };
    payment: Omit<BookingPayment, 'created_at'> | null;
    payments: BookingPayment[];
    pickup_handover: { fuel_level: number | null; odometer: number | null; notes: string | null; damages: VehicleDamage[] | null; captured_at: string | null } | null;
    return_handover: { fuel_level: number | null; odometer: number | null; notes: string | null; damages: VehicleDamage[] | null; captured_at: string | null } | null;
    handover_charges: { fuel_refuel: number; fuel_missing: number; excess_mileage: number; excess_km: number; km_driven: number; total: number } | null;
    coupon_usage: { code: string; discount_amount: number } | null;
    booking_taxes: BookingTax[];
    extra_charges: BookingExtraCharge[];
    created_at: string;
}
