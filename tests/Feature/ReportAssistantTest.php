<?php

test('the removed report assistant endpoint is unavailable', function () {
    $this->postJson('/reports/assistant', [
        'notes' => 'This note has enough content.',
    ])->assertMethodNotAllowed();
});
