<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Guest extends Model
{
    use HasFactory;
    protected $table = 'tblguests';
    protected $primaryKey = 'guest_id';

    protected $fillable = [
        'title', 'first_name', 'last_name', 'company_name', 'driver_age',
        'phone', 'email',
        'address', 'address2', 'country', 'state', 'city', 'postal_code',
        'flight_no',
    ];

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'guest_id', 'guest_id');
    }

    public function drivers()
    {
        return $this->hasMany(Driver::class, 'guest_id', 'guest_id');
    }
}
