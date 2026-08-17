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
            $table->string('verification_method', 24)->nullable()->after('time_in');
            $table->timestamp('verified_at')->nullable()->after('verification_method');
            $table->decimal('verification_latitude', 10, 7)->nullable()->after('verified_at');
            $table->decimal('verification_longitude', 10, 7)->nullable()->after('verification_latitude');
            $table->unsignedInteger('verification_distance_meters')->nullable()->after('verification_longitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daily_reports', function (Blueprint $table) {
            $table->dropColumn([
                'verification_method',
                'verified_at',
                'verification_latitude',
                'verification_longitude',
                'verification_distance_meters',
            ]);
        });
    }
};
