<?php

namespace App\Exceptions;

use RuntimeException;

class BookingExtensionException extends RuntimeException
{
    /**
     * The last date the rental could be extended to before a conflict
     * (the day before the next reservation starts). Null when the car is
     * free indefinitely or the conflict is time-based.
     */
    public function __construct(
        string $message,
        public ?string $maxExtendableDate = null,
        public array $alternateCars = [],
    ) {
        parent::__construct($message);
    }
}
