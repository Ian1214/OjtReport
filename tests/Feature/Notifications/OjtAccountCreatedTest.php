<?php

use App\Models\User;
use App\Notifications\OjtAccountCreated;

test('the OJT account email contains a secure password setup link', function () {
    $user = User::factory()->make(['email' => 'student@gmail.com']);
    $message = (new OjtAccountCreated('Example Company', 'setup-token'))->toMail($user);

    expect($message->subject)->toBe('Set up your OJT Report account')
        ->and($message->markdown)->toBe('mail.ojt-account-created')
        ->and($message->viewData)->toMatchArray([
            'companyName' => 'Example Company',
            'recipientName' => $user->name,
            'email' => 'student@gmail.com',
            'setupUrl' => route('password.reset', [
                'token' => 'setup-token',
                'email' => 'student@gmail.com',
            ]),
        ]);
});
