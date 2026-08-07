<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'student_id')) {
                $table->string('student_id')->unique()->after('email');
            }

            if (! Schema::hasColumn('users', 'program')) {
                $table->string('program')->after('student_id');
            }

            if (! Schema::hasColumn('users', 'year')) {
                $table->unsignedTinyInteger('year')->after('program');
            }

            if (! Schema::hasColumn('users', 'company')) {
                $table->string('company')->after('year');
            }

            if (! Schema::hasColumn('users', 'department')) {
                $table->string('department')->after('company');
            }

            if (! Schema::hasColumn('users', 'position')) {
                $table->string('position')->after('department');
            }

            if (! Schema::hasColumn('users', 'required_hours')) {
                $table->unsignedInteger('required_hours')
                    ->default(486)
                    ->after('position');
            }

            if (! Schema::hasColumn('users', 'start_date')) {
                $table->date('start_date')
                    ->nullable()
                    ->after('required_hours');
            }

            if (! Schema::hasColumn('users', 'end_date')) {
                $table->date('end_date')
                    ->nullable()
                    ->after('start_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = [
                'student_id',
                'program',
                'year',
                'company',
                'department',
                'position',
                'required_hours',
                'start_date',
                'end_date',
            ];

            $table->dropColumn(array_filter(
                $columns,
                fn (string $column): bool => Schema::hasColumn('users', $column),
            ));
        });
    }
};
