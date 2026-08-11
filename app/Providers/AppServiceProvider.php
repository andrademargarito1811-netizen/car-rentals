<?php

namespace App\Providers;

use App\Models\FooterSetting;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        View::composer([
            'app',
            'emails.booking-completed',
            'emails.guest-booking-confirmation',
            'emails.upcoming-pickup-reminder',
            'emails.upcoming-return-reminder',
            'emails.overdue-return-notice',
        ], function (\Illuminate\View\View $view) {
            $view->with('footerSettings', FooterSetting::first());
        });
    }
}
