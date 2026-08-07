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
        Schema::table('daily_reports', function (Blueprint $table) {
            $table->time('scheduled_time_in')->nullable()->after('time_in');
            $table->unsignedSmallInteger('scheduled_grace_minutes')->nullable()->after('scheduled_time_in');
            $table->string('attendance_status', 20)->nullable()->after('scheduled_grace_minutes');
            $table->unsignedInteger('late_minutes')->nullable()->after('attendance_status');
            $table->index(['user_id', 'attendance_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daily_reports', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'attendance_status']);
            $table->dropColumn(['scheduled_time_in', 'scheduled_grace_minutes', 'attendance_status', 'late_minutes']);
        });
    }
};
