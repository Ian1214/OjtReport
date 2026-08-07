<?php

use Illuminate\Support\Facades\Route;

it('generates secure URLs when HTTPS is terminated by a trusted proxy', function () {
    Route::get('/testing/trusted-proxy', fn () => [
        'is_secure' => request()->secure(),
        'asset_url' => url('/build/test.js'),
    ]);

    $response = $this->withServerVariables([
        'REMOTE_ADDR' => '10.0.0.10',
        'HTTP_X_FORWARDED_HOST' => 'ojt-report.example.com',
        'HTTP_X_FORWARDED_PORT' => '443',
        'HTTP_X_FORWARDED_PROTO' => 'https',
    ])->get('/testing/trusted-proxy');

    $response
        ->assertSuccessful()
        ->assertJson([
            'is_secure' => true,
            'asset_url' => 'https://ojt-report.example.com/build/test.js',
        ]);
});
