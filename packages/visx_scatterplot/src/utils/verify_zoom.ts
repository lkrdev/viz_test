
import { rescale } from './zoom-utils';
import { scaleLinear, scaleBand } from '@visx/scale';
import { strict as assert } from 'assert';

console.log('Running Zoom Utils Verification...');

// Test 1: Continuous Scale Zoom In
{
    console.log('Test 1: Continuous Scale Zoom In');
    const initialScale = scaleLinear({
        domain: [0, 100],
        range: [0, 100]
    });

    const transform = { scaleX: 2, scaleY: 1, translateX: 0, translateY: 0 };
    const rescaledScale = rescale(initialScale, 'x', transform);
    const newDomain = rescaledScale.domain();

    assert(Math.abs(newDomain[0] - 0) < 0.001, `Expected 0, got ${newDomain[0]}`);
    assert(Math.abs(newDomain[1] - 50) < 0.001, `Expected 50, got ${newDomain[1]}`);
    assert(rescaledScale(0) === 0, 'Mapping 0 -> 0 failed');
    assert(rescaledScale(50) === 100, 'Mapping 50 -> 100 failed');
    console.log('Passed.');
}

// Test 2: Continuous Scale Panning
{
    console.log('Test 2: Continuous Scale Panning');
    const initialScale = scaleLinear({
        domain: [0, 100],
        range: [0, 100]
    });

    const transform = { scaleX: 1, scaleY: 1, translateX: -50, translateY: 0 };
    const rescaledScale = rescale(initialScale, 'x', transform);
    const newDomain = rescaledScale.domain();

    assert(Math.abs(newDomain[0] - 50) < 0.001, `Expected 50, got ${newDomain[0]}`);
    assert(Math.abs(newDomain[1] - 150) < 0.001, `Expected 150, got ${newDomain[1]}`);
    console.log('Passed.');
}

// Test 3: Band Scale Range Update
{
    console.log('Test 3: Band Scale Range Update');
    const initialScale = scaleBand({
        domain: ['a', 'b'],
        range: [0, 100]
    });

    const transform = { scaleX: 2, scaleY: 1, translateX: 0, translateY: 0 };
    const rescaledScale = rescale(initialScale, 'x', transform);
    const newRange = rescaledScale.range();

    assert(newRange[0] === 0, `Expected 0, got ${newRange[0]}`);
    assert(newRange[1] === 200, `Expected 200, got ${newRange[1]}`);
    console.log('Passed.');
}

console.log('All tests passed!');
