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
        Schema::create('attendance_correction_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->time('original_time_in');
            $table->time('original_time_out');
            $table->time('proposed_time_in')->nullable();
            $table->time('proposed_time_out')->nullable();
            $table->text('reason');
            $table->string('status', 30)->index();
            $table->text('supervisor_comment')->nullable();
            $table->foreignId('supervisor_reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('supervisor_reviewed_at')->nullable();
            $table->text('admin_comment')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['daily_report_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_correction_requests');
    }
};
