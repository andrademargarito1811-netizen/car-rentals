<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Dashboard Report - {{ $date }}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; font-size: 12px; line-height: 1.5; }
        h1 { font-size: 22px; margin: 0 0 4px; }
        h2 { font-size: 16px; margin: 24px 0 12px; border-bottom: 2px solid #8b5cf6; padding-bottom: 6px; }
        .subtitle { color: #64748b; font-size: 13px; margin-bottom: 20px; }
        .stats { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
        .stat { flex: 1; min-width: 120px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
        .stat .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
        th { background: #f1f5f9; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.3px; font-size: 10px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .fw-bold { font-weight: 700; }
        .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        .mt-4 { margin-top: 16px; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <h1>Dashboard Report</h1>
    <p class="subtitle">Generated on {{ $date }}</p>

    <div class="stats">
        <div class="stat">
            <div class="label">Total Cars</div>
            <div class="value">{{ $total_cars }}</div>
        </div>
        <div class="stat">
            <div class="label">Available</div>
            <div class="value">{{ $available_cars }}</div>
        </div>
        <div class="stat">
            <div class="label">Rented</div>
            <div class="value">{{ $rented_cars }}</div>
        </div>
        <div class="stat">
            <div class="label">Active Bookings</div>
            <div class="value">{{ $active_bookings }}</div>
        </div>
        <div class="stat">
            <div class="label">Total Bookings</div>
            <div class="value">{{ $total_bookings }}</div>
        </div>
        <div class="stat">
            <div class="label">Revenue</div>
            <div class="value">${{ number_format($revenue, 2) }}</div>
        </div>
        <div class="stat">
            <div class="label">Users</div>
            <div class="value">{{ $total_users }}</div>
        </div>
        <div class="stat">
            <div class="label">Guests</div>
            <div class="value">{{ $total_guests }}</div>
        </div>
    </div>

    <h2>Booking Status</h2>
    <table>
        <thead>
            <tr>
                <th>Status</th>
                <th class="text-right">Count</th>
            </tr>
        </thead>
        <tbody>
            @foreach($booking_status_breakdown as $status)
            <tr>
                <td>{{ ucfirst($status->status) }}</td>
                <td class="text-right fw-bold">{{ $status->count }}</td>
            </tr>
            @endforeach
            <tr>
                <td class="fw-bold">Total</td>
                <td class="text-right fw-bold">{{ $booking_status_breakdown->sum('count') }}</td>
            </tr>
        </tbody>
    </table>

    <h2>Revenue by Location</h2>
    <table>
        <thead>
            <tr>
                <th>Location</th>
                <th class="text-right">Revenue</th>
            </tr>
        </thead>
        <tbody>
            @foreach($revenue_by_location as $loc)
            <tr>
                <td>{{ $loc->location }}</td>
                <td class="text-right fw-bold">${{ number_format($loc->revenue, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <h2>Recent Bookings</h2>
    <table>
        <thead>
            <tr>
                <th>Car</th>
                <th>Customer</th>
                <th>Dates</th>
                <th>Status</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($recent_bookings as $booking)
            <tr>
                <td>{{ $booking->car->brand }} {{ $booking->car->model }}</td>
                <td>{{ $booking->user?->name ?? ($booking->guest ? $booking->guest->first_name . ' ' . $booking->guest->last_name : 'Guest') }}</td>
                <td>{{ $booking->start_date->format('M d') }} - {{ $booking->end_date->format('M d, Y') }}</td>
                <td>{{ ucfirst($booking->status) }}</td>
                <td class="text-right fw-bold">${{ number_format($booking->total_amount, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        West Car Rental &mdash; Dashboard Report &mdash; {{ $date }}
    </div>
</body>
</html>
