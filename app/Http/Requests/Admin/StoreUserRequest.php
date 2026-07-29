<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:50', 'alpha_dash', Rule::unique('users')],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'in:male,female,other,prefer_not_to_say'],
            'address' => ['nullable', 'string', 'max:500'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'driver_license_number' => ['nullable', 'string', 'max:50'],
            'driver_license_expiry' => ['nullable', 'date', 'after:today'],
            'preferred_language' => ['nullable', 'string', 'max:10'],
            'timezone' => ['nullable', 'string', 'max:100', 'timezone'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'role' => ['required', 'in:user,admin'],
            'status' => ['required', 'in:active,suspended'],
            'profile_photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'send_welcome_email' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'username.alpha_dash' => 'Username may only contain letters, numbers, dashes and underscores.',
            'date_of_birth.before' => 'Date of birth must be before today.',
            'driver_license_expiry.after' => 'License expiry must be a future date.',
            'profile_photo.max' => 'Profile photo must not exceed 2MB.',
        ];
    }
}
