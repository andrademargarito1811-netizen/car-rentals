<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class InvoiceSetting extends Model
{
    protected $fillable = [
        'company_name',
        'company_legal_name',
        'phone',
        'emergency_phone',
        'fax',
        'email',
        'address',
        'tax_id',
        'logo_path',
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
        static::saved(fn () => cache()->forget('shared.invoiceSettings'));
        static::deleted(fn () => cache()->forget('shared.invoiceSettings'));
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
