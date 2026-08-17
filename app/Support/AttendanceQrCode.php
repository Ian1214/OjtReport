<?php

namespace App\Support;

use App\Models\Company;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\URL;

class AttendanceQrCode
{
    /** @return array{qrImage: string, expiresAt: string} */
    public function forCompany(Company $company): array
    {
        $expiresAt = now()->addMinutes(10);
        $token = URL::temporarySignedRoute('reports.verify-attendance', $expiresAt, [
            'company' => $company->id,
        ]);
        $renderer = new ImageRenderer(
            new RendererStyle(360, 2),
            new SvgImageBackEnd,
        );
        $svg = (new Writer($renderer))->writeString($token);

        return [
            'qrImage' => 'data:image/svg+xml;base64,'.base64_encode($svg),
            'expiresAt' => $expiresAt->toIso8601String(),
        ];
    }
}
