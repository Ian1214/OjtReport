<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    public function store(RegisterRequest $request): RedirectResponse
    {
        $user = DB::transaction(function () use ($request): User {
            $validated = $request->validated();
            $company = Company::create(['name' => $validated['company_name']]);

            return User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'company_id' => $company->id,
                'company' => $company->name,
                'role' => 'company_admin',
                'email_verified_at' => now(),
                'terms_accepted_at' => now(),
            ]);
        }, attempts: 3);

        Auth::login($user);

        return redirect()->route('dashboard');
    }
}
