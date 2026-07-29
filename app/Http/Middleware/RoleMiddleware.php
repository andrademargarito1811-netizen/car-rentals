<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user() || !in_array($request->user()->role, $roles)) {
            \App\Models\AuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'UNAUTHORIZED_ACCESS',
                'description' => 'Failed access attempt to ' . $request->path() . ' (required roles: ' . implode(', ', $roles) . ')',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            abort(403, 'Unauthorized access.');
        }

        return $next($request);
    }
}
