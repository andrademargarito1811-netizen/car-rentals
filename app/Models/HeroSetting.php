<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HeroSetting extends Model
{
    protected $fillable = [
        'badge_text',
        'badge_enabled',
        'badge_icon',
        'booking_badge_text',
        'booking_badge_enabled',
        'booking_badge_icon',
        'headline',
        'headline_highlight',
        'tagline',
        'description',
        'image_path',
        'fleet_image_path',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'badge_enabled' => 'boolean',
            'badge_icon' => 'string',
            'booking_badge_enabled' => 'boolean',
            'booking_badge_icon' => 'string',
            'is_active' => 'boolean',
        ];
    }

    public function images(): HasMany
    {
        return $this->hasMany(HeroImage::class)->orderBy('sort_order');
    }

    protected static function booted(): void
    {
        static::saved(fn () => cache()->forget('shared.heroSettings'));
        static::deleted(fn () => cache()->forget('shared.heroSettings'));
    }
}
