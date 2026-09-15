<?php

namespace App\Http\Controllers\Company;

use App\Actions\BuildActionCenter;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActionCenterController extends Controller
{
    public function __invoke(Request $request, BuildActionCenter $buildActionCenter): Response
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless(in_array($user->role, ['company_admin', 'company_staff', 'supervisor', 'ojt'], true), 403);

        return Inertia::render('action-center/index', [
            'items' => $buildActionCenter->handle($user),
        ]);
    }
}
