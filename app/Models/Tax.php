<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tax extends Model
{
    use HasFactory;
    protected $fillable = [
        'tax_desc', 'calculation', 'category_id', 'value_in',
        'add_or_minus', 'rate', 'apply_always', 'location_id', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'add_or_minus' => 'boolean',
            'apply_always' => 'boolean',
            'is_active' => 'boolean',
            'location_id' => 'integer',
            'rate' => 'decimal:2',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(TaxCategory::class, 'category_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(VehicleLocation::class, 'location_id');
    }

    public function vehicleClasses(): BelongsToMany
    {
        return $this->belongsToMany(VehicleClass::class, 'tax_vehicle_class', 'tax_id', 'class_no');
    }
}
