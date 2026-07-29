<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FooterSetting extends Model
{
    protected $fillable = [
        'brand_name',
        'brand_description',
        'logo_path',
        'newsletter_heading',
        'newsletter_description',
        'newsletter_placeholder',
        'newsletter_active',
        'contact_email',
        'contact_phone',
        'contact_hours',
        'contact_address',
        'copyright_text',
        'quick_links',
        'legal_links',
        'social_links',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'newsletter_active' => 'boolean',
            'is_active' => 'boolean',
            'quick_links' => 'array',
            'legal_links' => 'array',
            'social_links' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn () => cache()->forget('shared.footerSettings'));
        static::deleted(fn () => cache()->forget('shared.footerSettings'));
    }
}
