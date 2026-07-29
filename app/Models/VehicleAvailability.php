<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleAvailability extends Model
{
    use HasFactory;
    protected $table = 'tblvehicle_availability';
    protected $primaryKey = 'available_id';

    protected $fillable = [
        'available_desc', 'is_active',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }
}
