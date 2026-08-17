<?php

namespace App\Http\Controllers\Company;

use App\Actions\RecordActivity;
use App\Http\Controllers\Controller;
use App\Http\Requests\ImportOjtsRequest;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class OjtBulkImportController extends Controller
{
    private const HEADERS = ['name', 'email', 'program', 'year', 'department', 'position', 'required_hours', 'start_date'];

    public function __invoke(ImportOjtsRequest $request, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $administrator */
        $administrator = $request->user();
        $rows = $this->readRows($request->file('file')->getRealPath());

        if ($rows === []) {
            throw ValidationException::withMessages(['file' => 'The CSV does not contain any OJT records.']);
        }

        if (count($rows) > 100) {
            throw ValidationException::withMessages(['file' => 'Import up to 100 OJT accounts at a time.']);
        }

        $seenEmails = [];
        foreach ($rows as $index => $row) {
            $validator = Validator::make($row, [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255', Rule::unique(User::class, 'email')],
                'program' => ['required', 'string', 'max:100'],
                'year' => ['required', 'integer', 'between:1,6'],
                'department' => ['required', 'string', 'max:255'],
                'position' => ['required', 'string', 'max:255'],
                'required_hours' => ['required', 'integer', 'between:1,2000'],
                'start_date' => ['required', 'date'],
            ]);
            $email = Str::lower((string) ($row['email'] ?? ''));

            if (isset($seenEmails[$email])) {
                $validator->errors()->add('email', 'The email is duplicated in this CSV.');
            }
            $seenEmails[$email] = true;

            if ($validator->fails()) {
                throw ValidationException::withMessages([
                    'file' => 'Row '.($index + 2).': '.$validator->errors()->first(),
                ]);
            }
        }

        /** @var list<User> $createdOjts */
        $createdOjts = DB::transaction(function () use ($administrator, $rows): array {
            $latestStudentId = User::query()
                ->where('student_id', 'like', now()->year.'-%')
                ->lockForUpdate()
                ->orderByDesc('student_id')
                ->value('student_id');
            $nextNumber = $latestStudentId === null ? 1 : ((int) str($latestStudentId)->after('-')->toString()) + 1;
            $created = [];

            foreach ($rows as $row) {
                $department = Department::query()->firstOrCreate(
                    ['company_id' => $administrator->company_id, 'name' => Str::squish($row['department'])],
                    ['is_active' => true],
                );
                $department->refresh();

                if (! $department->is_active || ($department->capacity !== null && $department->ojts()->count() >= $department->capacity)) {
                    throw ValidationException::withMessages(['file' => "The {$department->name} department is unavailable or at capacity."]);
                }

                $created[] = User::query()->create([
                    'company_id' => $administrator->company_id,
                    'department_id' => $department->id,
                    'role' => 'ojt',
                    'ojt_status' => User::OJT_STATUS_ONBOARDING,
                    'name' => Str::squish($row['name']),
                    'email' => Str::lower($row['email']),
                    'student_id' => sprintf('%s-%04d', now()->year, $nextNumber++),
                    'program' => Str::squish($row['program']),
                    'year' => (int) $row['year'],
                    'company' => $administrator->companyRecord->name,
                    'department' => $department->name,
                    'position' => Str::squish($row['position']),
                    'required_hours' => (int) $row['required_hours'],
                    'start_date' => $row['start_date'],
                    'password' => Str::password(32, symbols: false),
                    'must_change_password' => true,
                    'email_verified_at' => now(),
                ]);
            }

            return $created;
        }, attempts: 3);

        $queued = collect($createdOjts)
            ->filter(fn (User $ojt): bool => Password::sendResetLink(['email' => $ojt->email]) === Password::ResetLinkSent)
            ->count();
        $recordActivity->handle($administrator, 'account.ojts_bulk_imported', "{$administrator->name} imported ".count($createdOjts).' OJT accounts.', properties: ['count' => count($createdOjts), 'setup_emails_queued' => $queued]);
        Inertia::flash('toast', [
            'type' => $queued === count($createdOjts) ? 'success' : 'warning',
            'message' => count($createdOjts)." OJT accounts imported; {$queued} setup emails queued.",
        ]);

        return to_route('company.ojts.index');
    }

    /** @return list<array<string, string>> */
    private function readRows(string $path): array
    {
        $handle = fopen($path, 'rb');

        if ($handle === false) {
            throw ValidationException::withMessages(['file' => 'The CSV file could not be read.']);
        }

        $header = fgetcsv($handle);
        $normalizedHeader = array_map(static fn (mixed $value): string => Str::snake(trim((string) $value)), $header ?: []);

        if ($normalizedHeader !== self::HEADERS) {
            fclose($handle);
            throw ValidationException::withMessages(['file' => 'Use this exact header order: '.implode(', ', self::HEADERS).'.']);
        }

        $rows = [];
        while (($values = fgetcsv($handle)) !== false) {
            if (count(array_filter($values, static fn (mixed $value): bool => trim((string) $value) !== '')) === 0) {
                continue;
            }
            if (count($values) !== count(self::HEADERS)) {
                fclose($handle);
                throw ValidationException::withMessages(['file' => 'Every CSV row must contain exactly eight columns.']);
            }
            /** @var array<string, string> $row */
            $row = array_combine(self::HEADERS, array_map(static fn (mixed $value): string => trim((string) $value), $values));
            $rows[] = $row;
        }
        fclose($handle);

        return $rows;
    }
}
