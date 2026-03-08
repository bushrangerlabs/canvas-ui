/**
 * Topological Sort Algorithm for Flow Execution
 * 
 * Determines the correct execution order for flow nodes based on their dependencies.
 * Includes cycle detection to prevent infinite loops.
 */

import type { FlowEdge, FlowNode } from '../types/flow';

/**
 * Build adjacency list from edges
 */
function buildGraph(nodes: FlowNode[], edges: FlowEdge[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  
  // Initialize all nodes
  nodes.forEach(node => {
    graph.set(node.id, []);
  });
  
  // Add edges (source -> target dependencies)
  edges.forEach(edge => {
    const dependencies = graph.get(edge.source) || [];
    dependencies.push(edge.target);
    graph.set(edge.source, dependencies);
  });
  
  return graph;
}

/**
 * Calculate in-degree (number of incoming edges) for each node
 */
function calculateInDegree(nodes: FlowNode[], edges: FlowEdge[]): Map<string, number> {
  const inDegree = new Map<string, number>();
  
  // Initialize all nodes with 0 in-degree
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
  });
  
  // Count incoming edges for each node
  edges.forEach(edge => {
    const current = inDegree.get(edge.target) || 0;
    inDegree.set(edge.target, current + 1);
  });
  
  return inDegree;
}

/**
 * Detect cycles in the flow graph using DFS
 */
export function detectCycles(nodes: FlowNode[], edges: FlowEdge[]): boolean {
  const graph = buildGraph(nodes, edges);
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true; // Cycle found
        }
      } else if (recursionStack.has(neighbor)) {
        return true; // Back edge found = cycle
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  }
  
  // Check all nodes (graph may be disconnected)
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Perform topological sort using Kahn's algorithm
 * Returns nodes in execution order, or empty array if cycle detected
 */
export function topologicalSort(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  // Check for cycles first
  if (detectCycles(nodes, edges)) {
    console.error('Flow contains cycles - cannot execute');
    return [];
  }
  
  const graph = buildGraph(nodes, edges);
  const inDegree = calculateInDegree(nodes, edges);
  const queue: string[] = [];
  const result: FlowNode[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  // Start with nodes that have no dependencies (in-degree = 0)
  nodes.forEach(node => {
    if ((inDegree.get(node.id) || 0) === 0) {
      queue.push(node.id);
    }
  });
  
  // Process nodes in order
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentNode = nodeMap.get(currentId);
    
    if (currentNode) {
      result.push(currentNode);
    }
    
    // Reduce in-degree for neighbors
    const neighbors = graph.get(currentId) || [];
    neighbors.forEach(neighborId => {
      const newInDegree = (inDegree.get(neighborId) || 0) - 1;
      inDegree.set(neighborId, newInDegree);
      
      // If all dependencies satisfied, add to queue
      if (newInDegree === 0) {
        queue.push(neighborId);
      }
    });
  }
  
  // If result doesn't contain all nodes, there was a cycle
  if (result.length !== nodes.length) {
    console.error('Topological sort failed - possible cycle or disconnected graph');
    return [];
  }
  
  return result;
}

/**
 * Get all nodes that depend on a specific node (downstream nodes)
 */
export function getDownstreamNodes(nodeId: string, edges: FlowEdge[]): string[] {
  const downstream = new Set<string>();
  const visited = new Set<string>();
  
  function traverse(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    
    edges.forEach(edge => {
      if (edge.source === id) {
        downstream.add(edge.target);
        traverse(edge.target);
      }
    });
  }
  
  traverse(nodeId);
  return Array.from(downstream);
}

/**
 * Get all nodes that a specific node depends on (upstream nodes)
 */
export function getUpstreamNodes(nodeId: string, edges: FlowEdge[]): string[] {
  const upstream = new Set<string>();
  const visited = new Set<string>();
  
  function traverse(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    
    edges.forEach(edge => {
      if (edge.target === id) {
        upstream.add(edge.source);
        traverse(edge.source);
      }
    });
  }
  
  traverse(nodeId);
  return Array.from(upstream);
}
