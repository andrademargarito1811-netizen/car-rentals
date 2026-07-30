<?php

namespace Database\Seeders;

use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class TestimonialSeeder extends Seeder
{
    public function run(): void
    {
        $testimonials = [
            [
                'name' => 'Sarah Johnson',
                'role' => 'Business Traveler',
                'content' => 'Absolutely seamless experience. The car was pristine and the service was outstanding.',
                'rating' => 5,
                'sort_order' => 0,
                'is_active' => true,
            ],
            [
                'name' => 'Michael Chen',
                'role' => 'Family Vacation',
                'content' => 'Best rental experience we have ever had. Affordable rates and excellent vehicles.',
                'rating' => 5,
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Emma Davis',
                'role' => 'Weekend Explorer',
                'content' => 'Quick pickup, great car, and hassle-free return. Will definitely use again!',
                'rating' => 5,
                'sort_order' => 2,
                'is_active' => true,
            ],
        ];

        foreach ($testimonials as $item) {
            Testimonial::create($item);
        }
    }
}
