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
        Schema::table('companies', function (Blueprint $table) {
            $table->string('attendance_verification_mode', 24)->default('disabled');
            $table->decimal('attendance_latitude', 10, 7)->nullable();
            $table->decimal('attendance_longitude', 10, 7)->nullable();
            $table->unsignedInteger('attendance_radius_meters')->default(150);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'attendance_verification_mode',
                'attendance_latitude',
                'attendance_longitude',
                'attendance_radius_meters',
            ]);
        });
    }
};
