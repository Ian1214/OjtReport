<?php

namespace App\Actions;

class AssessOjtRisk
{
    /**
     * @return array{level: string, score: int, signals: list<string>, recommendedAction: string}
     */
    public function handle(
        int $missingWorkdays,
        int $pendingReports,
        int $lateDays,
        int $unfinishedTasks,
        float $completionPercentage,
    ): array {
        $score = 0;
        $signals = [];

        if ($missingWorkdays >= 3) {
            $score += min(40, $missingWorkdays * 6);
            $signals[] = "{$missingWorkdays} scheduled workdays have no attendance record this month";
        }

        if ($pendingReports >= 3) {
            $score += min(25, $pendingReports * 4);
            $signals[] = "{$pendingReports} reports are waiting for review";
        }

        if ($lateDays >= 3) {
            $score += min(20, $lateDays * 3);
            $signals[] = "{$lateDays} late arrivals are recorded";
        }

        if ($unfinishedTasks >= 5) {
            $score += 15;
            $signals[] = "{$unfinishedTasks} assigned tasks remain unfinished";
        }

        if ($completionPercentage < 25 && ($missingWorkdays + $lateDays) >= 5) {
            $score += 10;
            $signals[] = 'Low completion progress is combined with attendance concerns';
        }

        $score = min(100, $score);
        $level = match (true) {
            $score >= 60 => 'high',
            $score >= 30 => 'medium',
            default => 'low',
        };

        return [
            'level' => $level,
            'score' => $score,
            'signals' => $signals,
            'recommendedAction' => match ($level) {
                'high' => 'Contact the OJT and supervisor today, document the intervention, and agree on a recovery plan.',
                'medium' => 'Review the flagged records with the supervisor this week.',
                default => 'Continue normal monitoring.',
            },
        ];
    }
}
