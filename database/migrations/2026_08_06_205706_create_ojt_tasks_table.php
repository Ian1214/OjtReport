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
        Schema::create('ojt_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ojt_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('supervisor_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('not_started');
            $table->date('due_date')->nullable();
            $table->timestamps();
            $table->index(['ojt_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ojt_tasks');
    }
};
