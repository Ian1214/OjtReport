<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Fortify\Features;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $application = parent::createApplication();
        $defaultConnection = (string) $application['config']->get('database.default');
        $database = (string) $application['config']->get("database.connections.{$defaultConnection}.database");
        $normalizedDatabase = strtolower($database);

        if ($database !== ':memory:' && ! str_contains($normalizedDatabase, 'test')) {
            throw new RuntimeException(
                "Refusing to run tests against database [{$database}]. Configure an isolated testing database first.",
            );
        }

        return $application;
    }

    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }
}
