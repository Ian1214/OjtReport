<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('users')
            ->where('role', 'ojt')
            ->whereNotNull('end_date')
            ->update(['ojt_status' => 'completed']);

        DB::table('users')
            ->where('role', 'ojt')
            ->whereNotNull('company_id')
            ->whereNotNull('department')
            ->where('department', '!=', '')
            ->select(['id', 'company_id', 'department'])
            ->orderBy('id')
            ->chunkById(200, function ($users): void {
                foreach ($users as $user) {
                    $departmentId = DB::table('departments')
                        ->where('company_id', $user->company_id)
                        ->where('name', $user->department)
                        ->value('id');

                    if ($departmentId === null) {
                        $departmentId = DB::table('departments')->insertGetId([
                            'company_id' => $user->company_id,
                            'name' => $user->department,
                            'is_active' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }

                    DB::table('users')->where('id', $user->id)->update([
                        'department_id' => $departmentId,
                    ]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('users')->update(['department_id' => null]);
    }
};
