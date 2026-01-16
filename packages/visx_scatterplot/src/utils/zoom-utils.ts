
interface ZoomTransform {
    scaleX: number;
    scaleY: number;
    translateX: number;
    translateY: number;
}

export const rescale = (scale: any, axis: 'x' | 'y', transform: ZoomTransform) => {
    const scaleVal = axis === 'x' ? transform.scaleX : transform.scaleY;
    const translateVal = axis === 'x' ? transform.translateX : transform.translateY;

    // Handle Band scales (categorical) by modifying range
    if (scale.bandwidth) {
        const r = scale.range();
        const newRange = r.map((rv: number) => rv * scaleVal + translateVal);
        const s = scale.copy();
        s.range(newRange);
        return s;
    }

    // Handle Continuous scales (linear, time) by modifying domain
    if (scale.invert) {
        const r = scale.range();
        // Invert logic for domain rescaling:
        // We want to find the new domain [d0, d1] that maps to the original range [r0, r1]
        // given the transform.
        // The transform maps a "data pixel" x to a "screen pixel" x': x' = x * k + t
        // The scale maps domain value v to "data pixel" x: x = scale(v)
        // Combined: x' = scale(v) * k + t
        // We want the new scale s(v) = x'
        // So s(v) = scale(v) * k + t
        // But wait, visx/zoom typically applies the transform to the group.
        // If we want to keep the group static (semantic zoom) and update the scale,
        // we need the scale to map v directly to x'.
        // Original: scale(v) -> [r0, r1]
        // Transformed: x' = x * k + t.
        // So the new range would be [r0 * k + t, r1 * k + t].
        // BUT, for continuous scales, we usually want to keep the RANGE fixed (screen size)
        // and update the DOMAIN (visible data).

        // If we change the domain, we are saying: "What data values correspond to the screen edges now?"
        // Screen edge 0 (r0) corresponds to what value?
        // r0 = scale(v) * k + t  =>  scale(v) = (r0 - t) / k  =>  v = scale.invert((r0 - t) / k)

        const d = r.map((rv: number) => scale.invert((rv - translateVal) / scaleVal));
        const s = scale.copy();
        s.domain(d);
        return s;
    }

    return scale;
};
