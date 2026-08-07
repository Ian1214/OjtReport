<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('timezone', 64)->default('Asia/Manila')->after('late_grace_minutes');
            $table->json('work_days')->nullable()->after('timezone');
        });

        Schema::create('company_holidays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->date('holiday_date');
            $table->string('name');
            $table->timestamps();

            $table->unique(['company_id', 'holiday_date']);
        });

        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 30);
            $table->date('start_date');
            $table->date('end_date');
            $table->text('reason');
            $table->string('status', 30)->index();
            $table->foreignId('supervisor_reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('supervisor_reviewed_at')->nullable();
            $table->text('supervisor_comment')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('admin_comment')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'start_date', 'end_date']);
            $table->index(['user_id', 'status']);
        });

        Schema::create('dtr_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('total_hours', 8, 2)->default(0);
            $table->string('status', 30)->index();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('supervisor_reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('supervisor_reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->string('snapshot_hash', 64)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'period_start', 'period_end']);
        });

        Schema::table('daily_reports', function (Blueprint $table) {
            $table->foreignId('dtr_submission_id')->nullable()->after('user_id')
                ->constrained()->nullOnDelete();
            $table->index(['dtr_submission_id', 'report_date']);
        });

        Schema::create('system_backups', function (Blueprint $table) {
            $table->id();
            $table->string('disk');
            $table->string('path');
            $table->unsignedBigInteger('size')->default(0);
            $table->string('checksum', 64)->nullable();
            $table->string('status', 20)->index();
            $table->text('failure_message')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        Schema::dropIfExists('system_backups');
        Schema::table('daily_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('dtr_submission_id');
        });
        Schema::dropIfExists('dtr_submissions');
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('company_holidays');
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['timezone', 'work_days']);
        });
    }
};
