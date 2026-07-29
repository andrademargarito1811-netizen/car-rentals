<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservationHeroImage extends Model
{
    protected $fillable = [
        'reservation_setting_id',
        'image_path',
        'alt_text',
        'caption',
        'sort_order',
    ];

    public function reservationSetting(): BelongsTo
    {
        return $this->belongsTo(ReservationSetting::class);
    }

    protected static function booted(): void
    {
        static::saved(fn () => cache()->forget('shared.reservationSettings'));
        static::deleted(fn () => cache()->forget('shared.reservationSettings'));
    }
}
