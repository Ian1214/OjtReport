<?php

namespace App\Http\Controllers\Company;

use App\Actions\RecordActivity;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCompanyOjtRequest;
use App\Http\Requests\UpdateOjtSupervisorRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class OjtController extends Controller
{
    public function store(StoreCompanyOjtRequest $request, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $companyAdmin */
        $companyAdmin = $request->user();
        $company = $companyAdmin->companyRecord;

        Gate::authorize('update', $company);

        $initialPassword = Str::password(32, letters: true, numbers: true, symbols: false);

        $supervisor = $this->supervisorForCompany($company->id, $request->integer('supervisor_id'));

        $ojt = DB::transaction(function () use ($company, $request, $initialPassword, $supervisor): User {
            $studentId = $this->nextStudentId();

            return $company->ojts()->create([
                ...$request->validated(),
                'supervisor_id' => $supervisor?->id,
                'supervisor_name' => $supervisor?->name ?? $request->string('supervisor_name')->trim()->toString(),
                'student_id' => $studentId,
                'company' => $company->name,
                'email' => $request->string('email')->lower()->toString(),
                'password' => $initialPassword,
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]);
        }, attempts: 3);

        $this->sendSetupLink($ojt);
        $recordActivity->handle(
            $companyAdmin,
            'account.ojt_created',
            "{$companyAdmin->name} created the OJT account for {$ojt->name}.",
            $ojt,
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "{$ojt->name}'s account was created and the setup email was queued.",
        ]);

        return to_route('company.ojts.index')->with('createdAccount', [
            'name' => $ojt->name,
            'email' => $ojt->email,
        ]);
    }

    public function resendSetupLink(Request $request, User $ojt, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $companyAdmin */
        $companyAdmin = $request->user();
        $company = $companyAdmin->companyRecord;

        Gate::authorize('update', $company);

        abort_unless($ojt->company_id === $company->id && ! $ojt->isCompanyAdmin(), 404);

        $this->sendSetupLink($ojt);
        $recordActivity->handle(
            $companyAdmin,
            'account.setup_link_resent',
            "{$companyAdmin->name} resent an account setup link to {$ojt->name}.",
            $ojt,
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "A new setup link has been queued for {$ojt->email}.",
        ]);

        return to_route('company.ojts.index');
    }

    public function updateSupervisor(UpdateOjtSupervisorRequest $request, User $ojt): RedirectResponse
    {
        /** @var User $companyAdmin */
        $companyAdmin = $request->user();
        $company = $companyAdmin->companyRecord;

        Gate::authorize('update', $company);

        abort_unless($ojt->company_id === $company->id && ! $ojt->isCompanyAdmin(), 404);

        $supervisor = $this->supervisorForCompany($company->id, $request->integer('supervisor_id'));

        if ($request->has('supervisor_id')) {
            $ojt->update([
                'supervisor_id' => $supervisor?->id,
                'supervisor_name' => $supervisor?->name,
            ]);
        } else {
            $ojt->update([
                'supervisor_id' => null,
                'supervisor_name' => $request->string('supervisor_name')->trim()->toString(),
            ]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Supervisor assigned to {$ojt->name}.",
        ]);

        return to_route('company.ojts.index');
    }

    public function destroy(Request $request, User $ojt, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $companyAdmin */
        $companyAdmin = $request->user();
        $company = $companyAdmin->companyRecord;

        Gate::authorize('delete', $company);

        abort_unless($ojt->company_id === $company->id && ! $ojt->isCompanyAdmin(), 404);

        $recordActivity->handle(
            $companyAdmin,
            'account.ojt_archived',
            "{$companyAdmin->name} archived the OJT account for {$ojt->name}.",
            $ojt,
            ['deleted_user_name' => $ojt->name, 'deleted_user_email' => $ojt->email],
        );
        $ojt->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "{$ojt->name}'s OJT account was archived. Its audit records remain protected by the retention policy.",
        ]);

        return to_route('company.ojts.index');
    }

    public function restore(Request $request, int $ojt, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $companyAdmin */
        $companyAdmin = $request->user();
        Gate::authorize('delete', $companyAdmin->companyRecord);

        $archivedOjt = User::onlyTrashed()
            ->whereKey($ojt)
            ->where('company_id', $companyAdmin->company_id)
            ->where('role', 'ojt')
            ->firstOrFail();
        $archivedOjt->restore();
        $recordActivity->handle($companyAdmin, 'account.ojt_restored', "{$companyAdmin->name} restored the OJT account for {$archivedOjt->name}.", $archivedOjt);
        Inertia::flash('toast', ['type' => 'success', 'message' => "{$archivedOjt->name}'s account was restored."]);

        return back();
    }

    private function nextStudentId(): string
    {
        $year = (string) now()->year;

        $latestStudentId = User::query()
            ->where('student_id', 'like', "{$year}-%")
            ->lockForUpdate()
            ->orderByDesc('student_id')
            ->value('student_id');

        $nextNumber = $latestStudentId === null
            ? 1
            : (int) str($latestStudentId)->after("{$year}-")->toString() + 1;

        return sprintf('%s-%04d', $year, $nextNumber);
    }

    private function sendSetupLink(User $ojt): void
    {
        $status = Password::sendResetLink(['email' => $ojt->email]);

        if ($status !== Password::ResetLinkSent) {
            throw ValidationException::withMessages([
                'email' => 'The password setup link could not be sent. Please try again shortly.',
            ]);
        }
    }

    private function supervisorForCompany(int $companyId, int $supervisorId): ?User
    {
        if ($supervisorId === 0) {
            return null;
        }

        return User::query()
            ->whereKey($supervisorId)
            ->where('company_id', $companyId)
            ->where('role', 'supervisor')
            ->firstOrFail();
    }
}
