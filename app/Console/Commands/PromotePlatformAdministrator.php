<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('platform:make-admin {email : Existing verified user email} {--force : Confirm the account should become a platform administrator}')]
#[Description('Promote an existing account to the isolated platform administrator role')]
class PromotePlatformAdministrator extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if (! $this->option('force')) {
            $this->error('Add --force after verifying the target email. This removes company-level access from the account.');

            return self::FAILURE;
        }

        $user = User::query()->where('email', (string) $this->argument('email'))->first();

        if ($user === null) {
            $this->error('No account exists with that email address.');

            return self::FAILURE;
        }

        $user->update([
            'role' => 'platform_admin',
            'company_id' => null,
            'company' => null,
            'company_permissions' => null,
            'account_active' => true,
            'suspended_at' => null,
            'suspended_by' => null,
        ]);

        $this->info("{$user->email} is now a platform administrator.");

        return self::SUCCESS;
    }
}
