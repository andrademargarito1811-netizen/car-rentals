<?php

return [
    'default_grace_minutes' => env('DEFAULT_GRACE_MINUTES', 30),

    // Days a pending booking may stay unconfirmed past its pickup date before
    // the auto-cancel housekeeping command releases the car.
    'pending_auto_cancel_after_days' => env('PENDING_AUTO_CANCEL_AFTER_DAYS', 1),

    // Look-ahead (days) used by the reminder command to schedule pickup/return emails.
    'reminder_lookahead_days' => env('REMINDER_LOOKAHEAD_DAYS', 1),
];
