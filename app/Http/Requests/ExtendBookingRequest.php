<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExtendBookingRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'new_end_date' => 'required|date',
            'new_return_time' => ['nullable', 'string', 'max:5', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'car_id' => 'nullable|integer|exists:tblcars,id',
        ];
    }

    public function messages(): array
    {
        return [
            'new_end_date.required' => 'Please choose a new return date.',
            'new_end_date.date' => 'The new return date is invalid.',
            'new_return_time.regex' => 'The return time must be in HH:MM format.',
        ];
    }
}
