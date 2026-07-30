<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AboutUsSetting extends Model
{
    protected $table = 'about_us_page_settings';

    protected $fillable = [
        'hero_badge',
        'hero_title',
        'hero_highlight',
        'hero_description',
        'hero_image_path',
        'story_heading',
        'story_content',
        'mission_text',
        'vision_text',
        'stats',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'stats' => 'array',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn () => cache()->forget('shared.aboutUsSettings'));
        static::deleted(fn () => cache()->forget('shared.aboutUsSettings'));
    }
}
