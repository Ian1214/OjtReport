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
        Schema::table('dtr_submissions', function (Blueprint $table) {
            $table->string('student_signature_name')->nullable()->after('submitted_at');
            $table->timestamp('student_signed_at')->nullable()->after('student_signature_name');
            $table->string('supervisor_signature_name')->nullable()->after('supervisor_reviewed_at');
            $table->timestamp('supervisor_signed_at')->nullable()->after('supervisor_signature_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dtr_submissions', function (Blueprint $table) {
            $table->dropColumn([
                'student_signature_name',
                'student_signed_at',
                'supervisor_signature_name',
                'supervisor_signed_at',
            ]);
        });
    }
};
