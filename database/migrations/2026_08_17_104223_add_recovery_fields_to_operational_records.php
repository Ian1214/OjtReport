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
        foreach (['daily_reports', 'documents', 'performance_evaluations', 'dtr_submissions'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->softDeletes();
                $table->string('deletion_reason', 500)->nullable();
                $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (['daily_reports', 'documents', 'performance_evaluations', 'dtr_submissions'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropConstrainedForeignId('deleted_by');
                $table->dropColumn('deletion_reason');
                $table->dropSoftDeletes();
            });
        }
    }
};
