<?php

namespace App\Http\Controllers\Company;

use App\Actions\RecordActivity;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCompanyHolidayRequest;
use App\Models\CompanyHoliday;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CompanyHolidayController extends Controller
{
    public function store(StoreCompanyHolidayRequest $request, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $admin */
        $admin = $request->user();

        if ($admin->companyRecord->holidays()->whereDate('holiday_date', $request->date('holiday_date'))->exists()) {
            throw ValidationException::withMessages(['holiday_date' => 'A holiday already exists on this date.']);
        }

        $holiday = $admin->companyRecord->holidays()->create($request->validated());
        $recordActivity->handle($admin, 'calendar.holiday_created', "{$admin->name} added {$holiday->name} to the work calendar.", $holiday);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Company holiday added.']);

        return back();
    }

    public function destroy(Request $request, CompanyHoliday $companyHoliday, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $admin */
        $admin = $request->user();
        abort_unless($admin->isCompanyAdmin(), 403);
        abort_unless($companyHoliday->company_id === $admin->company_id, 404);
        $recordActivity->handle($admin, 'calendar.holiday_deleted', "{$admin->name} removed {$companyHoliday->name} from the work calendar.", $companyHoliday);
        $companyHoliday->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Company holiday removed.']);

        return back();
    }
}
