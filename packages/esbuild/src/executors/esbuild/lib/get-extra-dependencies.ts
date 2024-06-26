import { ProjectGraph } from '@nx/devkit';
import { DependentBuildableProjectNode } from '@nx/js/src/utils/buildable-libs-utils';

export function getExtraDependencies(
  projectName: string,
  graph: ProjectGraph
): DependentBuildableProjectNode[] {
  const deps = new Map<string, DependentBuildableProjectNode>();
  const visited = new Set<string>(); // Track visited projects

  recur(projectName);

  function recur(currProjectName) {
    if (visited.has(currProjectName)) return; // Check if project already visited
    visited.add(currProjectName); // Mark project as visited

    const allDeps = graph.dependencies[currProjectName];
    const externalDeps = allDeps.reduce((acc, node) => {
      const found = graph.externalNodes[node.target];
      if (found) acc.push(found);
      return acc;
    }, []);
    const internalDeps = allDeps.reduce((acc, node) => {
      const found = graph.nodes[node.target];
      if (found) acc.push(found);
      return acc;
    }, []);

    for (const externalDep of externalDeps) {
      deps.set(externalDep.name, {
        name: externalDep.name,
        outputs: [],
        node: externalDep,
      });
    }

    for (const internalDep of internalDeps) {
      recur(internalDep.name);
    }
  }

  return Array.from(deps.values());
}
