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
            $table->foreignId('company_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->nullOnDelete()
                ->index();
            $table->string('role')->default('ojt')->after('password')->index();
            $table->boolean('must_change_password')->default(false)->after('role');

            $table->string('student_id')->nullable()->change();
            $table->string('program')->nullable()->change();
            $table->unsignedTinyInteger('year')->nullable()->change();
            $table->string('company')->nullable()->change();
            $table->string('department')->nullable()->change();
            $table->string('position')->nullable()->change();
            $table->unsignedInteger('required_hours')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('company_id');
            $table->dropIndex(['role']);
            $table->dropColumn(['role', 'must_change_password']);
        });
    }
};
