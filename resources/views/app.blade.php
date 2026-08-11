<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        @php
            $footerLogoUrl = $footerSettings?->logo_url ?? '/img/company_logo/company-logos-01.png';
            $footerLogoVersion = $footerSettings?->updated_at?->timestamp ?? '';
        @endphp
        <link rel="icon" type="image/png" href="{{ asset(ltrim($footerLogoUrl, '/')) }}{{ $footerLogoVersion ? '?v=' . $footerLogoVersion : '' }}">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
        <link href="https://fonts.bunny.net/css?family=playfair-display:500,600,700,800&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
