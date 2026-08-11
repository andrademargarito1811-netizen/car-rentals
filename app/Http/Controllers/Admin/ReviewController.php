<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $query = Review::with(['car:id,brand,model,image_path', 'user:id,name,email', 'guest:guest_id,first_name,last_name,email']);

        if ($status = $request->get('status')) {
            if ($status === 'approved') {
                $query->where('is_approved', true);
            } elseif ($status === 'pending') {
                $query->where('is_approved', false);
            }
        }

        if ($rating = $request->get('rating')) {
            $query->where('rating', (int) $rating);
        }

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('comment', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('guest', fn ($g) => $g->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%"));
            });
        }

        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $allowed = ['created_at', 'rating', 'id'];
        if (! in_array($sortField, $allowed, true)) {
            $sortField = 'created_at';
        }
        $query->orderBy($sortField, in_array($sortDirection, ['asc', 'desc'], true) ? $sortDirection : 'desc');

        $reviews = $query->paginate(15)->withQueryString();

        $reviews->getCollection()->transform(function ($review) {
            return [
                'id' => $review->id,
                'booking_id' => $review->booking_id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'is_approved' => $review->is_approved,
                'created_at' => $review->created_at,
                'car' => $review->car ? ['id' => $review->car->id, 'name' => $review->car->brand.' '.$review->car->model, 'image_path' => $review->car->image_path] : null,
                'user' => $review->user ? ['id' => $review->user->id, 'name' => $review->user->name, 'email' => $review->user->email] : null,
                'guest' => $review->guest ? ['first_name' => $review->guest->first_name, 'last_name' => $review->guest->last_name, 'email' => $review->guest->email] : null,
                'customer_name' => ($name = $review->user?->name ?? trim(($review->guest?->first_name ?? '').' '.($review->guest?->last_name ?? ''))) !== '' ? $name : 'Anonymous',
                'customer_email' => $review->user?->email ?? $review->guest?->email,
            ];
        });

        return Inertia::render('Admin/Reviews/Index', [
            'reviews' => $reviews,
            'filters' => [
                'search' => $request->get('search'),
                'status' => $request->get('status'),
                'rating' => $request->get('rating'),
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
            ],
            'stats' => [
                'total' => Review::count(),
                'approved' => Review::approved()->count(),
                'pending' => Review::pending()->count(),
                'avg_rating' => round((float) Review::approved()->avg('rating'), 1),
            ],
        ]);
    }

    public function update(Request $request, Review $review)
    {
        $validated = $request->validate([
            'is_approved' => ['required', 'boolean'],
        ]);

        $review->update(['is_approved' => $validated['is_approved']]);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => $validated['is_approved'] ? 'review_approved' : 'review_rejected',
            'model_type' => Review::class,
            'model_id' => $review->id,
            'description' => ($validated['is_approved'] ? 'Approved' : 'Unapproved')." review #{$review->id}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->back()->with(
            'success',
            $validated['is_approved'] ? 'Review approved and published.' : 'Review hidden from public display.'
        );
    }

    public function destroy(Request $request, Review $review)
    {
        $bookingRef = $review->booking?->reference_code;

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'review_deleted',
            'model_type' => Review::class,
            'model_id' => $review->id,
            'description' => "Deleted review #{$review->id}".($bookingRef ? " for booking {$bookingRef}" : ''),
            'old_values' => $review->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $review->delete();

        return redirect()->route('admin.reviews.index')->with('success', 'Review deleted successfully.');
    }
}
