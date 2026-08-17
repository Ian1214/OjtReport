<?php

use Inertia\Testing\AssertableInertia as Assert;

test('the public landing page is available to guests', function () {
    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('welcome'));
});
