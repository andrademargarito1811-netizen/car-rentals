<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class FooterSetting extends Model
{
    protected $fillable = [
        'brand_name',
        'brand_tagline',
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

    public function getLogoUrlAttribute(): string
    {
        if ($this->logo_path && !str_starts_with($this->logo_path, '/')) {
            return '/storage/' . $this->logo_path;
        }

        return $this->logo_path ?: '/img/company_logo/company-logos-01.png';
    }

    public function getLogoDiskPathAttribute(): string
    {
        if ($this->logo_path && !str_starts_with($this->logo_path, '/')) {
            $path = Storage::disk('public')->path($this->logo_path);

            return is_file($path) ? $path : public_path('img/company_logo/company-logos-01.png');
        }

        return public_path($this->logo_path ?: 'img/company_logo/company-logos-01.png');
    }
}
