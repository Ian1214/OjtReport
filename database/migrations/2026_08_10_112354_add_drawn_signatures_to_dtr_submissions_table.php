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
            $table->json('student_signature_strokes')->nullable()->after('student_signature_name');
            $table->json('supervisor_signature_strokes')->nullable()->after('supervisor_signature_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dtr_submissions', function (Blueprint $table) {
            $table->dropColumn([
                'student_signature_strokes',
                'supervisor_signature_strokes',
            ]);
        });
    }
};
