<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HeroImage extends Model
{
    protected $fillable = [
        'hero_setting_id',
        'image_path',
        'tagline',
        'alt_text',
        'sort_order',
    ];

    public function heroSetting(): BelongsTo
    {
        return $this->belongsTo(HeroSetting::class);
    }

    protected static function booted(): void
    {
        static::saved(fn () => cache()->forget('shared.heroSettings'));
        static::deleted(fn () => cache()->forget('shared.heroSettings'));
    }
}
