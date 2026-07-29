<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleClass extends Model
{
    use HasFactory;
    protected $table = 'tblvehicle_classes';
    protected $primaryKey = 'class_no';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'class_no', 'class_desc', 'grace_minutes', 'is_active',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }
}
