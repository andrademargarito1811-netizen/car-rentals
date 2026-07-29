<?php

return [
    'enabled' => env('AUDIT_ENABLED', true),
    'events' => [
        'created', 'updated', 'deleted',
    ],
];
