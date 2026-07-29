<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Mail\WelcomeUser;
use App\Models\User;
use App\Models\AuditLog;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->get('role')) {
            $query->where('role', $role);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $users = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $request->get('search'),
                'role' => $request->get('role'),
                'status' => $request->get('status'),
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
            ],
            'stats' => [
                'total' => User::count(),
                'active' => User::where('status', 'active')->count(),
                'admins' => User::where('role', 'admin')->count(),
                'suspended' => User::where('status', 'suspended')->count(),
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Users/Create');
    }

    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();

        if ($request->hasFile('profile_photo')) {
            $path = $request->file('profile_photo')->store('profile-photos', 'public');
            $validated['profile_photo_path'] = $path;
        }

        unset($validated['profile_photo'], $validated['send_welcome_email'], $validated['password_confirmation']);

        unset($validated['password']);

        $user = User::create($validated);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'user_created',
            'model_type' => User::class,
            'model_id' => $user->id,
            'description' => "Created user #{$user->id} ({$user->email})",
            'new_values' => $validated,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        if ($request->boolean('send_welcome_email')) {
            Mail::to($user)->queue(new WelcomeUser($user, $request->password));
        }

        return redirect()->route('admin.users.index')->with('success', 'Account created successfully.');
    }

    public function show(User $user)
    {
        $bookings = Booking::with('car')
            ->where('user_id', $user->id)
            ->latest()
            ->take(10)
            ->get();

        $auditLogs = AuditLog::where('model_type', User::class)
            ->where('model_id', $user->id)
            ->latest()
            ->take(20)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'old_values' => $log->old_values,
                    'new_values' => $log->new_values,
                    'created_at' => $log->created_at?->diffForHumans(),
                ];
            });

        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
            'bookings' => $bookings,
            'auditLogs' => $auditLogs,
            'stats' => [
                'total_bookings' => Booking::where('user_id', $user->id)->count(),
                'active_bookings' => Booking::where('user_id', $user->id)->active()->count(),
                'total_spent' => Booking::where('user_id', $user->id)->sum('total_amount'),
            ],
        ]);
    }

    public function edit(User $user)
    {
        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ];

        $isSelf = auth()->id() === $user->id;

        if (!$isSelf) {
            $rules['role'] = 'required|in:user,admin';
            $rules['status'] = 'required|in:active,suspended';
        }

        $validated = $request->validate($rules);

        if ($request->filled('password')) {
            $request->validate(['password' => 'string|min:8']);
            $validated['password'] = bcrypt($request->password);
        }

        $oldValues = [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->address,
            'role' => $user->role,
            'status' => $user->status,
        ];

        // Last admin guard
        if (isset($validated['role']) && $validated['role'] !== 'admin' && $user->role === 'admin') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return redirect()->back()->withErrors(['role' => 'Cannot remove the last admin account.']);
            }
        }

        $user->update($validated);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'user_updated',
            'model_type' => User::class,
            'model_id' => $user->id,
            'description' => "Updated user #{$user->id} ({$user->email})",
            'old_values' => $oldValues,
            'new_values' => $validated,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->back()->with('success', 'Account updated successfully.');
    }

    public function destroy(Request $request, User $user)
    {
        if (auth()->id() === $user->id) {
            return redirect()->back()->withErrors(['error' => 'You cannot delete your own account.']);
        }

        if ($user->role === 'admin') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return redirect()->back()->withErrors(['error' => 'Cannot delete the last admin account.']);
            }
        }

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'user_deleted',
            'model_type' => User::class,
            'model_id' => $user->id,
            'description' => "Deleted user #{$user->id} ({$user->email})",
            'old_values' => $user->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'Account deleted successfully.');
    }
}
