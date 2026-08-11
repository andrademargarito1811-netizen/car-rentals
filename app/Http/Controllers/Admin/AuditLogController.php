<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user:id,name,email')->orderByDesc('created_at');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhere('user_agent', 'like', "%{$search}%");
            });
        }

        if ($action = $request->get('action')) {
            $query->where('action', $action);
        }

        if ($modelType = $request->get('model_type')) {
            $query->where('model_type', 'like', "%{$modelType}%");
        }

        if ($userId = $request->get('user_id')) {
            $query->where('user_id', $userId);
        }

        if ($dateFrom = $request->get('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->get('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $logs = $query->paginate(30)->withQueryString();

        $logs->getCollection()->transform(function ($log) {
            return [
                'id' => $log->id,
                'user' => $log->user ? ['id' => $log->user->id, 'name' => $log->user->name, 'email' => $log->user->email] : null,
                'action' => $log->action,
                'model_type' => $log->model_type ? class_basename($log->model_type) : null,
                'model_id' => $log->model_id,
                'description' => $log->description,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'created_at' => $log->created_at,
            ];
        });

        return Inertia::render('Admin/AuditLogs/Index', [
            'logs' => $logs,
            'filters' => [
                'search' => $request->get('search'),
                'action' => $request->get('action'),
                'model_type' => $request->get('model_type'),
                'user_id' => $request->get('user_id'),
                'date_from' => $request->get('date_from'),
                'date_to' => $request->get('date_to'),
            ],
            'availableActions' => AuditLog::query()
                ->select('action')
                ->distinct()
                ->orderBy('action')
                ->pluck('action'),
            'availableModelTypes' => AuditLog::query()
                ->select('model_type')
                ->distinct()
                ->whereNotNull('model_type')
                ->orderBy('model_type')
                ->pluck('model_type')
                ->map(fn ($type) => class_basename($type)),
            'users' => User::select('id', 'name')->orderBy('name')->limit(100)->get(),
            'stats' => [
                'total' => AuditLog::count(),
                'today' => AuditLog::whereDate('created_at', now()->toDateString())->count(),
                'users_count' => AuditLog::distinct('user_id')->count('user_id'),
            ],
        ]);
    }
}
