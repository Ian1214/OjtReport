<?php

use App\Rules\SignatureStrokes;

test('signature strokes are normalized into a deterministic shape', function () {
    $signature = json_encode([
        'strokes' => [[
            ['y' => 6_200, 'x' => 800],
            ['x' => 2_100, 'y' => 3_800],
            ['x' => 2_100, 'y' => 3_800],
            ['x' => 3_400, 'y' => 6_100],
            ['x' => 4_800, 'y' => 3_600],
            ['x' => 6_100, 'y' => 5_900],
            ['x' => 8_900, 'y' => 4_100],
        ]],
        'version' => 1,
    ], JSON_THROW_ON_ERROR);

    expect(SignatureStrokes::normalize($signature))->toBe([
        'version' => 1,
        'strokes' => [[
            ['x' => 800, 'y' => 6_200],
            ['x' => 2_100, 'y' => 3_800],
            ['x' => 3_400, 'y' => 6_100],
            ['x' => 4_800, 'y' => 3_600],
            ['x' => 6_100, 'y' => 5_900],
            ['x' => 8_900, 'y' => 4_100],
        ]],
    ]);
});

test('unsafe or incomplete signature data is rejected', function (string $signature) {
    expect(fn () => SignatureStrokes::normalize($signature))->toThrow(Exception::class);
})->with([
    'malformed JSON' => '{not-json}',
    'wrong version' => json_encode(['version' => 2, 'strokes' => []], JSON_THROW_ON_ERROR),
    'extra envelope key' => json_encode(['version' => 1, 'strokes' => [], 'html' => '<svg />'], JSON_THROW_ON_ERROR),
    'empty drawing' => json_encode(['version' => 1, 'strokes' => []], JSON_THROW_ON_ERROR),
    'one dot' => json_encode(['version' => 1, 'strokes' => [[['x' => 5_000, 'y' => 5_000]]]], JSON_THROW_ON_ERROR),
    'numeric string coordinate' => json_encode(['version' => 1, 'strokes' => [[
        ['x' => '800', 'y' => 6_200], ['x' => 2_100, 'y' => 3_800], ['x' => 3_400, 'y' => 6_100],
        ['x' => 4_800, 'y' => 3_600], ['x' => 6_100, 'y' => 5_900], ['x' => 8_900, 'y' => 4_100],
    ]]], JSON_THROW_ON_ERROR),
    'out of range coordinate' => json_encode(['version' => 1, 'strokes' => [[
        ['x' => -1, 'y' => 6_200], ['x' => 2_100, 'y' => 3_800], ['x' => 3_400, 'y' => 6_100],
        ['x' => 4_800, 'y' => 3_600], ['x' => 6_100, 'y' => 5_900], ['x' => 8_900, 'y' => 4_100],
    ]]], JSON_THROW_ON_ERROR),
    'point with extra content' => json_encode(['version' => 1, 'strokes' => [[
        ['x' => 800, 'y' => 6_200, 'svg' => '<svg />'], ['x' => 2_100, 'y' => 3_800], ['x' => 3_400, 'y' => 6_100],
        ['x' => 4_800, 'y' => 3_600], ['x' => 6_100, 'y' => 5_900], ['x' => 8_900, 'y' => 4_100],
    ]]], JSON_THROW_ON_ERROR),
    'oversized payload' => str_repeat('x', 65_537),
]);
