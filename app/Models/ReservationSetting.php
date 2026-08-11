<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReservationSetting extends Model
{
    protected $fillable = [
        'badge_text',
        'badge_icon',
        'badge_enabled',
        'headline',
        'headline_highlight',
        'subtitle',
        'stat_pills',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'stat_pills' => 'array',
            'is_active' => 'boolean',
            'badge_enabled' => 'boolean',
        ];
    }

    public function heroImages(): HasMany
    {
        return $this->hasMany(ReservationHeroImage::class)->orderBy('sort_order');
    }

    protected static function booted(): void
    {
        static::saved(fn () => cache()->forget('shared.reservationSettings'));
        static::deleted(fn () => cache()->forget('shared.reservationSettings'));
    }
}
