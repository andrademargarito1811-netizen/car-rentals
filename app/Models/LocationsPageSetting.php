<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LocationsPageSetting extends Model
{
    protected $fillable = [
        'hero_badge',
        'hero_badge_active',
        'hero_title',
        'hero_highlight',
        'hero_description',
        'hero_image_path',
        'hero_button_text',
        'hero_phone_label',
        'hero_phone_number',
        'hero_active',
        'cta_title',
        'cta_description',
        'cta_button_text',
        'cta_button_url',
        'cta_phone_label',
        'cta_phone_number',
        'cta_active',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'hero_badge_active' => 'boolean',
            'hero_active' => 'boolean',
            'cta_active' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn () => cache()->forget('shared.locations'));
        static::deleted(fn () => cache()->forget('shared.locations'));
    }
}
