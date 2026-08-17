<?php

namespace App\Http\Controllers;

use App\Services\SystemHealthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicStatusController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, SystemHealthService $health): JsonResponse
    {
        $snapshot = $health->snapshot();
        $checks = collect(['database', 'cache', 'storage', 'scheduler', 'queue'])
            ->mapWithKeys(fn (string $name): array => [$name => (bool) data_get($snapshot, "{$name}.healthy")]);
        $healthy = $checks->every(fn (bool $check): bool => $check);

        return response()->json([
            'status' => $healthy ? 'operational' : 'degraded',
            'checked_at' => $snapshot['checkedAt'],
            'checks' => $checks,
        ], $healthy ? 200 : 503, [
            'Cache-Control' => 'no-store',
        ]);
    }
}
