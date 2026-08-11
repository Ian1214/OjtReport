<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;
use InvalidArgumentException;
use JsonException;

final class SignatureStrokes implements ValidationRule
{
    private const COORDINATE_MAX = 10_000;

    private const MAX_BYTES = 65_536;

    private const MAX_POINTS_PER_STROKE = 512;

    private const MAX_STROKES = 64;

    private const MAX_TOTAL_POINTS = 2_048;

    private const MIN_BOUNDING_BOX_SPAN = 300;

    private const MIN_DISTINCT_POINTS = 6;

    private const MIN_PATH_LENGTH = 800;

    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        try {
            self::normalize($value);
        } catch (InvalidArgumentException|JsonException) {
            $fail('Draw a complete signature before continuing.');
        }
    }

    /**
     * @return array{version: 1, strokes: list<list<array{x: int, y: int}>>}
     *
     * @throws InvalidArgumentException|JsonException
     */
    public static function normalize(mixed $value): array
    {
        if (! is_string($value) || $value === '' || strlen($value) > self::MAX_BYTES) {
            throw new InvalidArgumentException('The signature payload is invalid.');
        }

        $decoded = json_decode($value, true, 512, JSON_THROW_ON_ERROR);

        if (! is_array($decoded) || array_is_list($decoded) || ! self::hasExactKeys($decoded, ['strokes', 'version'])) {
            throw new InvalidArgumentException('The signature envelope is invalid.');
        }

        if (($decoded['version'] ?? null) !== 1 || ! is_array($decoded['strokes'] ?? null) || ! array_is_list($decoded['strokes'])) {
            throw new InvalidArgumentException('The signature version or strokes are invalid.');
        }

        $rawStrokes = $decoded['strokes'];

        if ($rawStrokes === [] || count($rawStrokes) > self::MAX_STROKES) {
            throw new InvalidArgumentException('The signature stroke count is invalid.');
        }

        $normalizedStrokes = [];
        $distinctPoints = [];
        $totalPoints = 0;
        $pathLength = 0.0;
        $minimumX = self::COORDINATE_MAX;
        $minimumY = self::COORDINATE_MAX;
        $maximumX = 0;
        $maximumY = 0;

        foreach ($rawStrokes as $rawStroke) {
            if (! is_array($rawStroke) || ! array_is_list($rawStroke) || $rawStroke === [] || count($rawStroke) > self::MAX_POINTS_PER_STROKE) {
                throw new InvalidArgumentException('A signature stroke is invalid.');
            }

            $totalPoints += count($rawStroke);

            if ($totalPoints > self::MAX_TOTAL_POINTS) {
                throw new InvalidArgumentException('The signature has too many points.');
            }

            $normalizedStroke = [];
            $previousPoint = null;

            foreach ($rawStroke as $rawPoint) {
                if (! is_array($rawPoint) || array_is_list($rawPoint) || ! self::hasExactKeys($rawPoint, ['x', 'y'])) {
                    throw new InvalidArgumentException('A signature point is invalid.');
                }

                $x = $rawPoint['x'];
                $y = $rawPoint['y'];

                if (! is_int($x) || ! is_int($y) || $x < 0 || $x > self::COORDINATE_MAX || $y < 0 || $y > self::COORDINATE_MAX) {
                    throw new InvalidArgumentException('A signature coordinate is invalid.');
                }

                $point = ['x' => $x, 'y' => $y];

                if ($previousPoint === $point) {
                    continue;
                }

                if ($previousPoint !== null) {
                    $pathLength += hypot($x - $previousPoint['x'], $y - $previousPoint['y']);
                }

                $normalizedStroke[] = $point;
                $previousPoint = $point;
                $distinctPoints[$x.':'.$y] = true;
                $minimumX = min($minimumX, $x);
                $minimumY = min($minimumY, $y);
                $maximumX = max($maximumX, $x);
                $maximumY = max($maximumY, $y);
            }

            if ($normalizedStroke !== []) {
                $normalizedStrokes[] = $normalizedStroke;
            }
        }

        $boundingBoxSpan = max($maximumX - $minimumX, $maximumY - $minimumY);

        if (count($distinctPoints) < self::MIN_DISTINCT_POINTS || $pathLength < self::MIN_PATH_LENGTH || $boundingBoxSpan < self::MIN_BOUNDING_BOX_SPAN) {
            throw new InvalidArgumentException('The signature is incomplete.');
        }

        return [
            'version' => 1,
            'strokes' => $normalizedStrokes,
        ];
    }

    /**
     * @param  array<array-key, mixed>  $value
     * @param  list<string>  $expectedKeys
     */
    private static function hasExactKeys(array $value, array $expectedKeys): bool
    {
        $actualKeys = array_keys($value);
        sort($actualKeys);
        sort($expectedKeys);

        return $actualKeys === $expectedKeys;
    }
}
