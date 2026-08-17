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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('school_acknowledged_by')
                ->nullable()
                ->after('end_date')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('school_acknowledged_at')->nullable()->after('school_acknowledged_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('school_acknowledged_by');
            $table->dropColumn('school_acknowledged_at');
        });
    }
};
