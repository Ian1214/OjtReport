import { Eraser } from 'lucide-react';
import { useEffect, useId, useMemo, useRef } from 'react';
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SignaturePoint = {
    x: number;
    y: number;
};

export type SignatureStroke = SignaturePoint[];

export type SignatureValue = {
    version: 1;
    strokes: SignatureStroke[];
};

type SignaturePadProps = {
    value: SignatureValue;
    onChange: (value: SignatureValue) => void;
    name?: string;
    id?: string;
    label?: string;
    instructions?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
};

type SignaturePreviewProps = {
    value: SignatureValue | null;
    label?: string;
    className?: string;
};

const SIGNATURE_VERSION = 1;
const COORDINATE_MAX = 10_000;
const MAX_STROKES = 64;
const MAX_TOTAL_POINTS = 2_048;
const MAX_POINTS_PER_STROKE = 512;
const MIN_POINT_DISTANCE_PX = 1.75;
const MIN_DISTINCT_POINTS = 6;
const MIN_PATH_LENGTH = 800;
const MIN_BOUNDING_BOX_SPAN = 300;

export default function SignaturePad({
    value,
    onChange,
    name = 'signature_data',
    id,
    label = 'Draw your signature',
    instructions = 'Use your mouse, finger, or stylus to sign inside the box.',
    error,
    disabled = false,
    required = false,
    className,
}: SignaturePadProps) {
    const generatedId = useId();
    const padId = id ?? `signature-pad-${generatedId}`;
    const instructionsId = `${padId}-instructions`;
    const statusId = `${padId}-status`;
    const errorId = `${padId}-error`;
    const activePointerId = useRef<number | null>(null);
    const normalizedValue = useMemo(() => normalizeValue(value), [value]);
    const strokesRef = useRef<SignatureStroke[]>(normalizedValue.strokes);

    useEffect(() => {
        strokesRef.current = normalizedValue.strokes;
    }, [normalizedValue]);

    const totalPoints = countPoints(normalizedValue.strokes);
    const hasSignature = totalPoints > 0;
    const hasCompleteSignature = isSignatureComplete(normalizedValue);
    const captureLimitReached =
        totalPoints >= MAX_TOTAL_POINTS ||
        normalizedValue.strokes.length >= MAX_STROKES;
    const describedBy = [instructionsId, statusId, error ? errorId : null]
        .filter(Boolean)
        .join(' ');

    const commit = (strokes: SignatureStroke[]) => {
        const nextValue: SignatureValue = {
            version: SIGNATURE_VERSION,
            strokes,
        };

        strokesRef.current = strokes;
        onChange(nextValue);
    };

    const clear = () => {
        activePointerId.current = null;
        commit([]);
    };

    const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
        if (
            disabled ||
            activePointerId.current !== null ||
            (event.pointerType === 'mouse' && event.button !== 0)
        ) {
            return;
        }

        const strokes = strokesRef.current;

        if (
            strokes.length >= MAX_STROKES ||
            countPoints(strokes) >= MAX_TOTAL_POINTS
        ) {
            return;
        }

        event.preventDefault();
        activePointerId.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);

        const point = pointFromClient(
            event.clientX,
            event.clientY,
            event.currentTarget.getBoundingClientRect(),
        );

        commit([...strokes, [point]]);
    };

    const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
        if (
            disabled ||
            activePointerId.current !== event.pointerId ||
            !event.currentTarget.hasPointerCapture(event.pointerId)
        ) {
            return;
        }

        event.preventDefault();

        const rect = event.currentTarget.getBoundingClientRect();
        const coalescedEvents = event.nativeEvent.getCoalescedEvents?.() ?? [
            event.nativeEvent,
        ];
        const points = coalescedEvents.map((pointerEvent) =>
            pointFromClient(pointerEvent.clientX, pointerEvent.clientY, rect),
        );

        appendPoints(points, rect);
    };

    const finishStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
        if (activePointerId.current !== event.pointerId) {
            return;
        }

        if (!disabled) {
            const rect = event.currentTarget.getBoundingClientRect();

            appendPoints(
                [pointFromClient(event.clientX, event.clientY, rect)],
                rect,
                true,
            );
        }

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        activePointerId.current = null;
    };

    const cancelStroke = (event: ReactPointerEvent<SVGSVGElement>) => {
        if (activePointerId.current === event.pointerId) {
            activePointerId.current = null;
        }
    };

    const appendPoints = (
        candidates: SignaturePoint[],
        rect: DOMRect,
        includeFinalPoint = false,
    ) => {
        const strokes = strokesRef.current;
        const lastStroke = strokes.at(-1);

        if (!lastStroke || lastStroke.length >= MAX_POINTS_PER_STROKE) {
            return;
        }

        let totalPointsCount = countPoints(strokes);
        const nextStroke = [...lastStroke];

        for (const candidate of candidates) {
            if (
                totalPointsCount >= MAX_TOTAL_POINTS ||
                nextStroke.length >= MAX_POINTS_PER_STROKE
            ) {
                break;
            }

            const previousPoint = nextStroke.at(-1);
            const isLastCandidate = candidate === candidates.at(-1);

            if (
                previousPoint &&
                !isFarEnough(previousPoint, candidate, rect) &&
                !(includeFinalPoint && isLastCandidate)
            ) {
                continue;
            }

            if (
                previousPoint &&
                previousPoint.x === candidate.x &&
                previousPoint.y === candidate.y
            ) {
                continue;
            }

            nextStroke.push(candidate);
            totalPointsCount += 1;
        }

        if (nextStroke.length === lastStroke.length) {
            return;
        }

        commit([...strokes.slice(0, -1), nextStroke]);
    };

    const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
        if (
            !disabled &&
            hasSignature &&
            (event.key === 'Delete' || event.key === 'Backspace')
        ) {
            event.preventDefault();
            clear();
        }
    };

    return (
        <div className={cn('grid gap-3', className)} data-slot="signature-pad">
            <div className="flex items-start justify-between gap-4">
                <div className="grid gap-1">
                    <label
                        htmlFor={padId}
                        className="text-sm leading-none font-medium text-foreground"
                    >
                        {label}
                        {required && (
                            <span
                                className="text-destructive"
                                aria-hidden="true"
                            >
                                {' '}
                                *
                            </span>
                        )}
                    </label>
                    <p
                        id={instructionsId}
                        className="text-sm text-muted-foreground"
                    >
                        {instructions}
                    </p>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clear}
                    disabled={disabled || !hasSignature}
                    aria-label="Clear signature"
                >
                    <Eraser aria-hidden="true" />
                    Clear
                </Button>
            </div>

            <input
                type="hidden"
                name={name}
                value={JSON.stringify(normalizedValue)}
                disabled={disabled}
            />

            <div
                className={cn(
                    'overflow-hidden rounded-xl border bg-white shadow-xs transition-[border-color,box-shadow] dark:bg-zinc-950',
                    error
                        ? 'border-destructive ring-3 ring-destructive/15'
                        : 'border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30',
                    disabled && 'cursor-not-allowed opacity-60',
                )}
            >
                <svg
                    id={padId}
                    viewBox={`0 0 ${COORDINATE_MAX} ${COORDINATE_MAX}`}
                    preserveAspectRatio="none"
                    className={cn(
                        'aspect-[3/1] min-h-40 w-full text-slate-950 outline-none select-none dark:text-white',
                        disabled
                            ? 'pointer-events-none'
                            : 'cursor-crosshair touch-none',
                    )}
                    role="img"
                    tabIndex={disabled ? -1 : 0}
                    aria-label={`${label}. Drawing area.`}
                    aria-describedby={describedBy}
                    aria-invalid={Boolean(error)}
                    aria-disabled={disabled}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={finishStroke}
                    onPointerCancel={cancelStroke}
                    onLostPointerCapture={cancelStroke}
                    onKeyDown={handleKeyDown}
                >
                    <line
                        x1="500"
                        y1="7800"
                        x2="9500"
                        y2="7800"
                        className="stroke-slate-200 dark:stroke-zinc-800"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray="5 7"
                    />
                    <SignatureStrokes strokes={normalizedValue.strokes} />
                </svg>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
                <p
                    id={statusId}
                    className={cn(
                        'font-medium',
                        hasSignature
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-muted-foreground',
                        captureLimitReached &&
                            'text-amber-700 dark:text-amber-400',
                        hasSignature &&
                            !hasCompleteSignature &&
                            'text-amber-700 dark:text-amber-400',
                    )}
                    aria-live="polite"
                >
                    {captureLimitReached
                        ? 'Signature capture limit reached'
                        : hasCompleteSignature
                          ? 'Signature captured'
                          : hasSignature
                            ? 'Keep signing to complete your signature'
                            : required
                              ? 'Signature required'
                              : 'Signature area is blank'}
                </p>
                {hasSignature && (
                    <span className="text-muted-foreground">
                        {normalizedValue.strokes.length}{' '}
                        {normalizedValue.strokes.length === 1
                            ? 'stroke'
                            : 'strokes'}
                    </span>
                )}
            </div>

            <InputError id={errorId} message={error} />
        </div>
    );
}

export function SignaturePreview({
    value,
    label = 'Electronic signature',
    className,
}: SignaturePreviewProps) {
    const normalizedValue = normalizeValue(value);

    return (
        <svg
            viewBox={`0 0 ${COORDINATE_MAX} ${COORDINATE_MAX}`}
            preserveAspectRatio="none"
            className={cn(
                'aspect-[3/1] w-full text-slate-950 dark:text-white print:text-black',
                className,
            )}
            role="img"
            aria-label={label}
            data-slot="signature-preview"
        >
            <title>{label}</title>
            <SignatureStrokes strokes={normalizedValue.strokes} />
        </svg>
    );
}

export function isSignatureComplete(value: SignatureValue): boolean {
    const normalizedValue = normalizeValue(value);
    const distinctPoints = new Set<string>();
    let pathLength = 0;
    let minimumX = COORDINATE_MAX;
    let minimumY = COORDINATE_MAX;
    let maximumX = 0;
    let maximumY = 0;

    for (const stroke of normalizedValue.strokes) {
        let previousPoint: SignaturePoint | undefined;

        for (const point of stroke) {
            distinctPoints.add(`${point.x}:${point.y}`);
            minimumX = Math.min(minimumX, point.x);
            minimumY = Math.min(minimumY, point.y);
            maximumX = Math.max(maximumX, point.x);
            maximumY = Math.max(maximumY, point.y);

            if (previousPoint) {
                pathLength += Math.hypot(
                    point.x - previousPoint.x,
                    point.y - previousPoint.y,
                );
            }

            previousPoint = point;
        }
    }

    return (
        distinctPoints.size >= MIN_DISTINCT_POINTS &&
        pathLength >= MIN_PATH_LENGTH &&
        Math.max(maximumX - minimumX, maximumY - minimumY) >=
            MIN_BOUNDING_BOX_SPAN
    );
}

function SignatureStrokes({ strokes }: { strokes: SignatureStroke[] }) {
    return strokes.map((stroke, index) => (
        <path
            key={`${index}-${stroke.length}`}
            d={strokeToPath(stroke)}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
        />
    ));
}

function strokeToPath(stroke: SignatureStroke): string {
    const firstPoint = stroke[0];

    if (!firstPoint) {
        return '';
    }

    if (stroke.length === 1) {
        return `M ${firstPoint.x - 1} ${firstPoint.y} L ${firstPoint.x + 1} ${firstPoint.y}`;
    }

    if (stroke.length === 2) {
        return `M ${firstPoint.x} ${firstPoint.y} L ${stroke[1].x} ${stroke[1].y}`;
    }

    const commands = [`M ${firstPoint.x} ${firstPoint.y}`];

    for (let index = 1; index < stroke.length - 1; index += 1) {
        const point = stroke[index];
        const nextPoint = stroke[index + 1];
        const midpointX = Math.round((point.x + nextPoint.x) / 2);
        const midpointY = Math.round((point.y + nextPoint.y) / 2);

        commands.push(`Q ${point.x} ${point.y} ${midpointX} ${midpointY}`);
    }

    const lastPoint = stroke.at(-1);

    if (lastPoint) {
        commands.push(`L ${lastPoint.x} ${lastPoint.y}`);
    }

    return commands.join(' ');
}

function pointFromClient(
    clientX: number,
    clientY: number,
    rect: DOMRect,
): SignaturePoint {
    const normalizedX = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
    const normalizedY =
        rect.height > 0 ? (clientY - rect.top) / rect.height : 0;

    return {
        x: Math.round(clamp(normalizedX, 0, 1) * COORDINATE_MAX),
        y: Math.round(clamp(normalizedY, 0, 1) * COORDINATE_MAX),
    };
}

function isFarEnough(
    previousPoint: SignaturePoint,
    nextPoint: SignaturePoint,
    rect: DOMRect,
): boolean {
    const deltaX =
        ((nextPoint.x - previousPoint.x) / COORDINATE_MAX) * rect.width;
    const deltaY =
        ((nextPoint.y - previousPoint.y) / COORDINATE_MAX) * rect.height;

    return Math.hypot(deltaX, deltaY) >= MIN_POINT_DISTANCE_PX;
}

function normalizeValue(value: SignatureValue | null): SignatureValue {
    if (
        !value ||
        value.version !== SIGNATURE_VERSION ||
        !Array.isArray(value.strokes)
    ) {
        return { version: SIGNATURE_VERSION, strokes: [] };
    }

    const strokes: SignatureStroke[] = [];
    let totalPoints = 0;

    for (const candidateStroke of value.strokes) {
        if (
            strokes.length >= MAX_STROKES ||
            totalPoints >= MAX_TOTAL_POINTS ||
            !Array.isArray(candidateStroke)
        ) {
            break;
        }

        const stroke: SignatureStroke = [];

        for (const candidatePoint of candidateStroke) {
            if (
                stroke.length >= MAX_POINTS_PER_STROKE ||
                totalPoints >= MAX_TOTAL_POINTS
            ) {
                break;
            }

            if (
                !candidatePoint ||
                !Number.isFinite(candidatePoint.x) ||
                !Number.isFinite(candidatePoint.y)
            ) {
                continue;
            }

            stroke.push({
                x: Math.round(clamp(candidatePoint.x, 0, COORDINATE_MAX)),
                y: Math.round(clamp(candidatePoint.y, 0, COORDINATE_MAX)),
            });
            totalPoints += 1;
        }

        if (stroke.length > 0) {
            strokes.push(stroke);
        }
    }

    return { version: SIGNATURE_VERSION, strokes };
}

function countPoints(strokes: SignatureStroke[]): number {
    return strokes.reduce((total, stroke) => total + stroke.length, 0);
}

function clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(Math.max(value, minimum), maximum);
}
