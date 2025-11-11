// src/lib/knowledge-graph.ts

import neo4j, { Driver, Session } from 'neo4j-driver';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAIConfiguration } from './gemini';

// Types for our knowledge graph entities
interface GraphNode {
  id: string;
  label: string;
  properties: Record<string, string | number | boolean>;
}

interface GraphRelationship {
  source: string;
  target: string;
  type: string;
  properties?: Record<string, string | number | boolean>;
}

interface GraphExtraction {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

// Neo4j driver instance
let driver: Driver | null = null;

/**
 * Initialize Neo4j driver connection
 */
function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD;

    if (!password) {
      throw new Error('NEO4J_PASSWORD environment variable is required');
    }

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    
    if (process.env.NODE_ENV === 'development') { console.log(`📊 Neo4j driver initialized for ${uri}`); }
  }
  
  return driver;
}

/**
 * Close Neo4j driver connection
 */
export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    if (process.env.NODE_ENV === 'development') { console.log('📊 Neo4j driver closed'); }
  }
}

/**
 * Test Neo4j connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const session = getDriver().session();
    await session.run('RETURN 1');
    await session.close();
    if (process.env.NODE_ENV === 'development') { console.log('✅ Neo4j connection successful'); }
    return true;
  } catch (error) {
    console.error('❌ Neo4j connection failed:', error);
    return false;
  }
}

/**
 * Create extraction prompt for Gemini to analyze text and extract entities/relationships
 */
function createExtractionPrompt(text: string): string {
  return `You are an expert knowledge graph analyst specializing in fitness, exercise science, and nutrition. Analyze the provided text and extract entities and relationships to build a comprehensive knowledge graph.

INSTRUCTIONS:
1. Identify key entities (concepts, exercises, muscles, techniques, principles, etc.)
2. Determine relationships between these entities
3. Focus on fitness, exercise science, biomechanics, nutrition, and training concepts
4. Return ONLY valid JSON in the specified format

OUTPUT FORMAT (JSON only, no additional text):
{
  "nodes": [
    {
      "id": "unique_identifier",
      "label": "EntityType", 
      "properties": {
        "name": "Entity Name",
        "type": "specific_type",
        "description": "brief description"
      }
    }
  ],
  "relationships": [
    {
      "source": "source_entity_id",
      "target": "target_entity_id", 
      "type": "RELATIONSHIP_TYPE",
      "properties": {
        "strength": "high|medium|low",
        "context": "brief context"
      }
    }
  ]
}

ENTITY TYPES to focus on:
- Exercise (specific movements)
- Muscle (muscle groups and individual muscles)
- Technique (training methods, principles)
- Equipment (training tools)
- Concept (scientific principles, theories)
- Nutrient (supplements, macronutrients)
- Goal (training objectives)

RELATIONSHIP TYPES to use:
- TARGETS (exercise targets muscle)
- REQUIRES (exercise requires equipment)
- IMPROVES (technique improves performance)
- SUPPORTS (nutrient supports goal)
- INVOLVES (exercise involves technique)
- AFFECTS (concept affects outcome)
- COMPETES_WITH (conflicting approaches)
- COMPLEMENTS (synergistic elements)

TEXT TO ANALYZE:
${text}

Return only the JSON object:`;
}

/**
 * Extract entities and relationships using Gemini API
 */
async function extractEntitiesAndRelationships(text: string): Promise<GraphExtraction> {
  try {
    if (process.env.NODE_ENV === 'development') { console.log('🧠 Extracting entities and relationships with Gemini...'); }
    
    const config = await getAIConfiguration();
    if (!config) {
      throw new Error('AI Configuration not found');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
      model: (config.proModelName as string) || 'gemini-2.0-flash-exp'
    });

    const prompt = createExtractionPrompt(text);
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    if (process.env.NODE_ENV === 'development') { console.log('📝 Raw Gemini response preview:', response.substring(0, 200) + '...'); }

    // Clean and parse JSON response
    let jsonText = response.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const extraction: GraphExtraction = JSON.parse(jsonText);
    
    if (process.env.NODE_ENV === 'development') { console.log(`✅ Extracted ${extraction.nodes.length} nodes and ${extraction.relationships.length} relationships`); }
    
    return extraction;
  } catch (error) {
    console.error('❌ Entity extraction failed:', error);
    throw new Error(`Failed to extract entities: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create nodes in Neo4j database
 */
async function createNodes(session: Session, nodes: GraphNode[], knowledgeItemId: string): Promise<void> {
  for (const node of nodes) {
    const query = `
      MERGE (n:${node.label} {id: $nodeId})
      SET n += $properties
      SET n.created_at = datetime()
      SET n.updated_at = datetime()
      
      // Link to knowledge item
      MERGE (k:KnowledgeItem {id: $knowledgeItemId})
      MERGE (n)-[:EXTRACTED_FROM]->(k)
    `;
    
    await session.run(query, {
      nodeId: node.id,
      properties: node.properties,
      knowledgeItemId: knowledgeItemId
    });
  }
  
  if (process.env.NODE_ENV === 'development') { console.log(`✅ Created ${nodes.length} nodes`); }
}

/**
 * Create relationships in Neo4j database
 */
async function createRelationships(session: Session, relationships: GraphRelationship[]): Promise<void> {
  for (const rel of relationships) {
    const query = `
      MATCH (source {id: $sourceId})
      MATCH (target {id: $targetId})
      MERGE (source)-[r:${rel.type}]->(target)
      SET r += $properties
      SET r.created_at = datetime()
    `;
    
    try {
      await session.run(query, {
        sourceId: rel.source,
        targetId: rel.target,
        properties: rel.properties || {}
      });
    } catch (error) {
      console.warn(`⚠️ Failed to create relationship ${rel.source} -> ${rel.target}:`, error);
    }
  }
  
  if (process.env.NODE_ENV === 'development') { console.log(`✅ Created ${relationships.length} relationships`); }
}

/**
 * Main function to build knowledge graph from text
 */
export async function buildKnowledgeGraph(text: string, knowledgeItemId: string): Promise<void> {
  const session = getDriver().session();
  
  try {
    if (process.env.NODE_ENV === 'development') { console.log(`🏗️ Building knowledge graph for knowledge item: ${knowledgeItemId}`); }
    
    // Step 1: Extract entities and relationships using Gemini
    const extraction = await extractEntitiesAndRelationships(text);
    
    if (extraction.nodes.length === 0) {
      if (process.env.NODE_ENV === 'development') { console.log('ℹ️ No entities extracted from text'); }
      return;
    }

    // Step 2: Create nodes in Neo4j
    await createNodes(session, extraction.nodes, knowledgeItemId);
    
    // Step 3: Create relationships in Neo4j
    if (extraction.relationships.length > 0) {
      await createRelationships(session, extraction.relationships);
    }
    
    if (process.env.NODE_ENV === 'development') { console.log(`🎉 Knowledge graph built successfully for ${knowledgeItemId}`); }
    
  } catch (error) {
    console.error('❌ Failed to build knowledge graph:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Query knowledge graph for related entities
 */
export async function queryRelatedEntities(entityName: string, limit: number = 10): Promise<Array<{
  name: string;
  labels: string[];
  relationship: string;
  description: string;
}>> {
  const session = getDriver().session();
  
  try {
    const query = `
      MATCH (e {name: $entityName})-[r]-(related)
      RETURN related.name as name, 
             labels(related) as labels, 
             type(r) as relationship,
             related.description as description
      LIMIT $limit
    `;
    
    const result = await session.run(query, { entityName, limit });
    
    return result.records.map(record => ({
      name: record.get('name'),
      labels: record.get('labels'),
      relationship: record.get('relationship'),
      description: record.get('description')
    }));
    
  } finally {
    await session.close();
  }
}

/**
 * Find shortest path between two entities
 */
export async function findEntityPath(source: string, target: string): Promise<Array<{
  entities: Array<{ name: string; labels: string[] }>;
  relationships: string[];
}>> {
  const session = getDriver().session();
  
  try {
    const query = `
      MATCH path = shortestPath((s {name: $source})-[*..5]-(t {name: $target}))
      RETURN [node in nodes(path) | {name: node.name, labels: labels(node)}] as entities,
             [rel in relationships(path) | type(rel)] as relationships
    `;
    
    const result = await session.run(query, { source, target });
    
    if (result.records.length === 0) {
      return [];
    }
    
    return result.records.map(record => ({
      entities: record.get('entities'),
      relationships: record.get('relationships')
    }));
    
  } finally {
    await session.close();
  }
}

/**
 * Get knowledge graph statistics
 */
export async function getGraphStats(): Promise<Record<string, number>> {
  const session = getDriver().session();
  
  try {
    const nodeCountQuery = 'MATCH (n) RETURN count(n) as nodeCount';
    const relCountQuery = 'MATCH ()-[r]->() RETURN count(r) as relCount';
    const knowledgeItemsQuery = 'MATCH (k:KnowledgeItem) RETURN count(k) as knowledgeItems';
    
    const [nodeResult, relResult, kiResult] = await Promise.all([
      session.run(nodeCountQuery),
      session.run(relCountQuery),
      session.run(knowledgeItemsQuery)
    ]);
    
    return {
      nodes: nodeResult.records[0]?.get('nodeCount').toNumber() || 0,
      relationships: relResult.records[0]?.get('relCount').toNumber() || 0,
      knowledgeItems: kiResult.records[0]?.get('knowledgeItems').toNumber() || 0
    };
    
  } finally {
    await session.close();
  }
}

/**
 * Clear all knowledge graph data (use with caution)
 */
export async function clearKnowledgeGraph(): Promise<void> {
  const session = getDriver().session();
  
  try {
    if (process.env.NODE_ENV === 'development') { console.log('🗑️ Clearing knowledge graph...'); }
    await session.run('MATCH (n) DETACH DELETE n');
    if (process.env.NODE_ENV === 'development') { console.log('✅ Knowledge graph cleared'); }
  } finally {
    await session.close();
  }
}
