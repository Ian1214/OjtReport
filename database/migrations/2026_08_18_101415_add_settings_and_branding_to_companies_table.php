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
            $table->string('legal_name')->nullable()->after('name');
            $table->string('logo_path')->nullable()->after('legal_name');
            $table->text('address')->nullable()->after('logo_path');
            $table->string('contact_email')->nullable()->after('address');
            $table->string('contact_phone', 40)->nullable()->after('contact_email');
            $table->string('authorized_signatory_name')->nullable()->after('contact_phone');
            $table->string('authorized_signatory_title')->nullable()->after('authorized_signatory_name');
            $table->json('settings')->nullable()->after('authorized_signatory_title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'legal_name',
                'logo_path',
                'address',
                'contact_email',
                'contact_phone',
                'authorized_signatory_name',
                'authorized_signatory_title',
                'settings',
            ]);
        });
    }
};
