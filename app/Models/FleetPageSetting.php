<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FleetPageSetting extends Model
{
    protected $fillable = [
        'hero_badge',
        'hero_title',
        'hero_highlight',
        'hero_description',
        'hero_image_path',
        'section_heading',
        'section_subheading',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn () => cache()->forget('shared.fleetSettings'));
        static::deleted(fn () => cache()->forget('shared.fleetSettings'));
    }
}
