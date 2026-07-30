<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhyChooseUsItem extends Model
{
    protected $table = 'why_choose_us_items';

    protected $fillable = [
        'title',
        'description',
        'icon_svg',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }

    protected static function booted(): void
    {
        static::saved(fn () => cache()->forget('shared.whyChooseUsItems'));
        static::deleted(fn () => cache()->forget('shared.whyChooseUsItems'));
    }
}
