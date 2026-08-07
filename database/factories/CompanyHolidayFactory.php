<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\CompanyHoliday;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<CompanyHoliday> */
class CompanyHolidayFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'holiday_date' => fake()->unique()->dateTimeBetween('+1 day', '+1 year'),
            'name' => fake()->words(2, true),
        ];
    }
}
