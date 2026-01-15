/**
 * Reconstructs LookML string from a parsed manifest object.
 * Prioritizes $strings metadata to preserve comments and formatting.
 * Falls back to property-based generation for new or modified parts.
 * @param obj The parsed LookML manifest object (or sub-object).
 * @param root The root object for resolving global paths (defaults to obj).
 */
export function parsedManifestToLookML(obj: any, root?: any): string {
  if (!obj) return '';

  const rootObj = root || obj;

  // Use $strings if available to preserve comments and formatting
  if (obj.$strings) {
    const resolvePath = (path: string): any => {
      const parts = path.split('.');
      let current = rootObj;
      for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        // Handle array indices
        current = current[part];
      }
      return current;
    };

    let result = '';
    const visitedVizIndices = new Set<number>();

    for (const item of obj.$strings) {
      if (typeof item === 'string') {
        if (item.startsWith('@')) {
          const path = item.substring(1);
          if (path.startsWith('visualization.')) {
            const parts = path.split('.');
            if (parts.length === 2) {
              const idx = parseInt(parts[1], 10);
              if (!isNaN(idx)) visitedVizIndices.add(idx);
            }
          }

          if (path === '$type') {
            result += obj.$type || '';
          } else if (path === '$name') {
            result += obj.$name || '';
          } else {
            const referencedObj = resolvePath(path);
            if (referencedObj) {
              result += parsedManifestToLookML(referencedObj, rootObj);
            }
          }
        } else {
          result += item;
        }
      } else if (Array.isArray(item)) {
        // Property template: [propName, ...templatePart]
        const propName = item[0];
        const templateParts = item.slice(1);
        const propValue = obj[propName];
        if (propValue !== undefined) {
          for (const part of templateParts) {
            if (part === '@') {
              result += propValue;
            } else {
              result += part;
            }
          }
        }
      }
    }

    // Append new visualizations that were not in $strings
    if (obj === rootObj && Array.isArray(obj.visualization)) {
      obj.visualization.forEach((vis: any, index: number) => {
        if (!visitedVizIndices.has(index)) {
          // Add a newline if result is not empty to separate entries
          if (result.length > 0 && !result.endsWith('\n\n') && !result.endsWith('\n')) {
            result += '\n';
          }
          result += parsedManifestToLookML({ ...vis, $type: 'visualization' }, rootObj);
          result += '\n';
        }
      });
    }

    return result;
  }

  // Fallback for objects without $strings (e.g. newly added visualizations)
  if (obj.$type === 'visualization') {
    let block = `visualization: {\n`;
    if (obj.id) block += `  id: "${obj.id}"\n`;
    if (obj.label) block += `  label: "${obj.label}"\n`;
    if (obj.file) block += `  file: "${obj.file}"\n`;
    if (obj.url) block += `  url: "${obj.url}"\n`;
    block += `}`;
    return block;
  }

  if (obj.$type === 'constant') {
    let block = `constant: ${obj.$name} {\n`;
    if (obj.value) block += `  value: "${obj.value}"\n`;
    block += `}`;
    return block;
  }

  // Root manifest fallback
  const parts: string[] = [];
  if (obj.project_name) parts.push(`project_name: "${obj.project_name}"`);
  if (obj.constant) {
    for (const [name, constant] of Object.entries(obj.constant as Record<string, any>)) {
      parts.push(parsedManifestToLookML({ ...constant, $name: name, $type: 'constant' }, rootObj));
    }
  }
  if (obj.visualization) {
    for (const vis of obj.visualization as any[]) {
      parts.push(parsedManifestToLookML({ ...vis, $type: 'visualization' }, rootObj));
    }
  }
  return parts.join('\n\n') + '\n';
}


