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
            $table->string('approval_status', 20)->default('approved')->after('summary')->index();
            $table->foreignId('reviewed_by')->nullable()->after('approval_status')->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            $table->text('rejection_reason')->nullable()->after('reviewed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daily_reports', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);
            $table->dropIndex(['approval_status']);
            $table->dropColumn([
                'approval_status',
                'reviewed_by',
                'reviewed_at',
                'rejection_reason',
            ]);
        });
    }
};
