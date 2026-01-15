import fs from 'fs';
import path from 'path';
import { parsedManifestToLookML } from '../../parsedManifestToLookML';

function cleanLookML(text: string): string {
  return text
    .split('\n')
    .map(line => line.split('#')[0].trimEnd())
    .filter(line => line.trim().length > 0)
    .join('\n')
    .trim();
}

describe('parsedManifestToLookML', () => {
  it('should deserialize parsed manifest and match the original manifest structure', () => {
    const parsedPath = path.join(__dirname, 'test.parsed.txt');
    const manifestPath = path.join(__dirname, 'test.manifest.txt');

    const parsed = JSON.parse(fs.readFileSync(parsedPath, 'utf8'));
    const manifest = fs.readFileSync(manifestPath, 'utf8');

    const result = parsedManifestToLookML(parsed);

    // Compare cleaned versions since $strings (which preserves comments) is no longer used
    expect(cleanLookML(result)).toBe(cleanLookML(manifest));
  });

  it('should preserve all comments and formatting', () => {

    const parsedPath = path.join(__dirname, 'test.parsed.txt');
    const manifestPath = path.join(__dirname, 'test.manifest.txt');

    const parsed = JSON.parse(fs.readFileSync(parsedPath, 'utf8'));
    const manifest = fs.readFileSync(manifestPath, 'utf8');

    const result = parsedManifestToLookML(parsed);

    // This expects exact match including comments
    expect(result).toBe(manifest);
  });


  it('should successfully add a visualization to a manifest that previously had none', () => {
    const parsed: any = {
      project_name: "dynamic_viz_project",
      constant: {
        CONNECTION: { value: "up_stream" }
      }
    };

    // Verify visualization is NOT there initially
    let result = parsedManifestToLookML(parsed);
    expect(result).not.toContain('visualization:');

    // Manually add a visualization property
    parsed.visualization = [
      {
        id: "new_sparkline_viz",
        label: "Sparkline",
        file: "visualizations/sparkline.js"
      }
    ];

    result = parsedManifestToLookML(parsed);

    // Verify it now appears in the LookML
    expect(result).toContain('visualization: {');
    expect(result).toContain('id: "new_sparkline_viz"');
    expect(result).toContain('label: "Sparkline"');
    expect(result).toContain('file: "visualizations/sparkline.js"');

    // Verify project name and constants still exist
    expect(result).toContain('project_name: "dynamic_viz_project"');
    expect(result).toContain('constant: CONNECTION {');
  });

  it('should successfully add a visualization in the middle of existing visualizations', () => {
    const parsed: any = {
      project_name: "order_test",
      visualization: [
        { id: "viz_1", label: "First" },
        { id: "viz_3", label: "Third" }
      ]
    };

    // Insert viz_2 in the middle
    parsed.visualization.splice(1, 0, { id: "viz_2", label: "Second" });

    const result = parsedManifestToLookML(parsed);

    // Verify all IDs are present
    expect(result).toContain('id: "viz_1"');
    expect(result).toContain('id: "viz_2"');
    expect(result).toContain('id: "viz_3"');

    // Verify order in text
    const index1 = result.indexOf('id: "viz_1"');
    const index2 = result.indexOf('id: "viz_2"');
    const index3 = result.indexOf('id: "viz_3"');

    expect(index1).toBeLessThan(index2);
    expect(index2).toBeLessThan(index3);
  });

  it('should successfully remove the visualization block when the last item is removed', () => {
    const parsed: any = {
      project_name: "removal_test",
      visualization: [
        { id: "viz_to_remove", label: "Single" }
      ]
    };

    // Remove the only visualization
    parsed.visualization.pop();

    const result = parsedManifestToLookML(parsed);

    // Verify visualization is NOT there
    expect(result).not.toContain('visualization:');
    // Verify project name still exists
    expect(result).toContain('project_name: "removal_test"');
  });

  it('should successfully remove a visualization from the middle and keep the others', () => {
    const parsed: any = {
      project_name: "middle_removal_test",
      visualization: [
        { id: "viz_1", label: "First" },
        { id: "viz_2", label: "Second" },
        { id: "viz_3", label: "Third" }
      ]
    };

    // Remove the middle visualization (viz_2)
    parsed.visualization.splice(1, 1);

    const result = parsedManifestToLookML(parsed);

    // Verify viz_1 and viz_3 are present
    expect(result).toContain('id: "viz_1"');
    expect(result).toContain('id: "viz_3"');

    // Verify viz_2 is NOT present
    expect(result).not.toContain('id: "viz_2"');

    // Verify order of remaining
    const index1 = result.indexOf('id: "viz_1"');
    const index3 = result.indexOf('id: "viz_3"');
    expect(index1).toBeLessThan(index3);
  });

  it('should remove buy_sell_hold and preserve commented ticker-scroll', () => {
    const parsedPath = path.join(__dirname, 'test.parsed.txt');
    const parsed = JSON.parse(fs.readFileSync(parsedPath, 'utf8'));

    // Find and remove buy_sell_hold
    const initialCount = parsed.visualization.length;
    const indexToRemove = parsed.visualization.findIndex((v: any) => v.id === 'buy_sell_hold');
    expect(indexToRemove).toBeGreaterThan(-1);

    parsed.visualization.splice(indexToRemove, 1);
    expect(parsed.visualization.length).toBe(initialCount - 1);

    const result = parsedManifestToLookML(parsed);

    // Verify buy_sell_hold is gone from the ACTIVE LookML (not the comments)
    // The active block looks like: visualization: { id: "buy_sell_hold" ... }
    // We expect it NOT to be there in its active form.
    // Note: The comments in the file ALSO contain this string, so we check for the specific structure
    const activeVizRegex = /visualization:\s*{\s+id:\s*"buy_sell_hold"/;
    expect(result).not.toMatch(activeVizRegex);
    expect(result).not.toContain('# buy_sell_hold to be removed');

    // Verify commented ticker-scroll is still there
    expect(result).toContain('# visualization: {');
    expect(result).toContain('#   id: "ticker-scroll"');
    expect(result).toContain('#   label: "Ticker Scroll"');
  });
});




