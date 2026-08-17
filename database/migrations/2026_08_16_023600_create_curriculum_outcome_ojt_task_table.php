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
        Schema::create('curriculum_outcome_ojt_task', function (Blueprint $table) {
            $table->foreignId('curriculum_outcome_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ojt_task_id')->constrained()->cascadeOnDelete();

            $table->primary(['curriculum_outcome_id', 'ojt_task_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('curriculum_outcome_ojt_task');
    }
};
