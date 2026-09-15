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
            $table->string('status', 20)->default('active')->index();
            $table->timestamp('suspended_at')->nullable()->index();
            $table->text('status_reason')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropIndex(['suspended_at']);
            $table->dropIndex(['status']);
            $table->dropColumn(['status', 'suspended_at', 'status_reason']);
        });
    }
};
