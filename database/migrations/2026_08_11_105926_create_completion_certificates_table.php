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
        Schema::create('completion_certificates', function (Blueprint $table) {
            $table->id();
            $table->string('certificate_number')->unique();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supervisor_id')->constrained('users')->restrictOnDelete();
            $table->decimal('allocated_hours', 8, 2);
            $table->decimal('approved_hours_snapshot', 8, 2);
            $table->string('status', 32)->default('pending_supervisor');
            $table->string('ojt_name');
            $table->string('student_id')->nullable();
            $table->string('company_name');
            $table->string('program')->nullable();
            $table->string('position')->nullable();
            $table->string('department')->nullable();
            $table->foreignId('admin_signed_by')->constrained('users')->restrictOnDelete();
            $table->string('admin_signature_name');
            $table->json('admin_signature_strokes');
            $table->timestamp('admin_signed_at');
            $table->string('supervisor_signature_name')->nullable();
            $table->json('supervisor_signature_strokes')->nullable();
            $table->timestamp('supervisor_signed_at')->nullable();
            $table->timestamp('finalized_at')->nullable();
            $table->string('snapshot_hash', 64)->nullable();
            $table->timestamps();

            $table->index(['company_id', 'status', 'created_at']);
            $table->index(['user_id', 'status']);
            $table->index(['supervisor_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('completion_certificates');
    }
};
