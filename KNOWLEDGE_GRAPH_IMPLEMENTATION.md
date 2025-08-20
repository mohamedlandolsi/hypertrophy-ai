# Knowledge Graph Implementation with Neo4j

## Overview

Successfully implemented a knowledge graph system using Neo4j to enhance the RAG capabilities of the hypertrophy AI application. The system automatically extracts entities and relationships from uploaded documents and builds a comprehensive knowledge graph for advanced querying.

## Architecture

### Components
1. **Neo4j Database** - Graph database for storing entities and relationships
2. **Knowledge Graph Module** (`src/lib/knowledge-graph.ts`) - Core graph operations
3. **Gemini AI Integration** - Entity and relationship extraction
4. **Upload Integration** - Automatic graph building on document upload
5. **Admin API** - Graph management and testing endpoints

### Data Flow
```
Document Upload → Text Extraction → Gemini Analysis → Entity Extraction → Neo4j Storage
```

## Setup Requirements

### 1. Neo4j Installation

**Option A: Local Installation**
1. Download Neo4j Desktop from https://neo4j.com/download/
2. Create a new database
3. Set password for default user

**Option B: Neo4j Cloud (AuraDB)**
1. Sign up for Neo4j Aura at https://neo4j.com/aura/
2. Create a free instance
3. Note the connection URI and credentials

### 2. Environment Variables

Add these to your `.env.local`:

```env
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password_here

# For Neo4j Cloud/Aura:
# NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
# NEO4J_USER=neo4j
# NEO4J_PASSWORD=your_aura_password
```

### 3. Dependencies

Already installed:
- `neo4j-driver` - Neo4j Node.js driver

## Core Features

### 1. Entity Extraction

The system extracts fitness-specific entities:

- **Exercise** - Specific movements (squats, deadlifts, etc.)
- **Muscle** - Muscle groups and individual muscles  
- **Technique** - Training methods and principles
- **Equipment** - Training tools and machines
- **Concept** - Scientific principles and theories
- **Nutrient** - Supplements and macronutrients
- **Goal** - Training objectives

### 2. Relationship Types

- **TARGETS** - Exercise targets muscle
- **REQUIRES** - Exercise requires equipment
- **IMPROVES** - Technique improves performance
- **SUPPORTS** - Nutrient supports goal
- **INVOLVES** - Exercise involves technique
- **AFFECTS** - Concept affects outcome
- **COMPETES_WITH** - Conflicting approaches
- **COMPLEMENTS** - Synergistic elements

### 3. Knowledge Graph Functions

#### Core Operations
```typescript
// Build graph from text
await buildKnowledgeGraph(text: string, knowledgeItemId: string)

// Test connection
await testConnection(): Promise<boolean>

// Get statistics
await getGraphStats(): Promise<{nodes: number, relationships: number, knowledgeItems: number}>
```

#### Query Operations
```typescript
// Find related entities
await queryRelatedEntities(entityName: string, limit?: number)

// Find path between entities
await findEntityPath(source: string, target: string)

// Clear entire graph (admin only)
await clearKnowledgeGraph()
```

### 4. Automatic Integration

The system automatically builds knowledge graphs when documents are uploaded:

1. Document is processed and chunks are created
2. Full text content is passed to `buildKnowledgeGraph()`
3. Gemini extracts entities and relationships
4. Neo4j stores the graph data
5. Process runs asynchronously (doesn't block upload response)

## API Endpoints

### Admin Knowledge Graph API

**GET** `/api/admin/knowledge-graph`
- Test connection and get statistics
- Returns graph stats and connection status

**POST** `/api/admin/knowledge-graph`
- Query graph or perform operations
- Actions: `queryRelated`, `findPath`, `clearGraph`

Example requests:

```javascript
// Get statistics
fetch('/api/admin/knowledge-graph')

// Query related entities
fetch('/api/admin/knowledge-graph', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'queryRelated',
    entityName: 'Progressive Overload',
    limit: 10
  })
})

// Find path between entities
fetch('/api/admin/knowledge-graph', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'findPath',
    source: 'Squats',
    target: 'Quadriceps'
  })
})
```

## Testing

### 1. Manual Testing Script

Run the test script to verify setup:

```bash
node test-knowledge-graph.js
```

The script will:
- Test Neo4j connection
- Process sample fitness text
- Extract entities and relationships
- Display graph statistics
- Query sample relationships

### 2. Integration Testing

1. Upload a fitness document through the web interface
2. Check the admin API for graph statistics
3. Use Neo4j Browser to explore the graph visually

### 3. Neo4j Browser

Access Neo4j Browser at:
- Local: http://localhost:7474
- Cloud: Use the provided Aura console

Sample queries:
```cypher
// View all nodes
MATCH (n) RETURN n LIMIT 25

// Find exercise relationships
MATCH (e:Exercise)-[r]->(m:Muscle) RETURN e, r, m

// Find concepts related to hypertrophy
MATCH (c:Concept {name: "Progressive Overload"})-[r]-(related) 
RETURN c, r, related
```

## Advanced Usage

### 1. Graph-Enhanced RAG

Future implementation could use the knowledge graph to:
- Find related concepts for query expansion
- Identify conflicting information
- Suggest follow-up questions
- Provide structured knowledge paths

### 2. Relationship Analysis

Query complex relationships:
```cypher
// Find all exercises that target the same muscles as squats
MATCH (squats:Exercise {name: "Squats"})-[:TARGETS]->(m:Muscle)
MATCH (other:Exercise)-[:TARGETS]->(m)
WHERE other <> squats
RETURN other, m
```

### 3. Knowledge Discovery

Identify knowledge gaps:
```cypher
// Find muscles with no associated exercises
MATCH (m:Muscle)
WHERE NOT (m)<-[:TARGETS]-(:Exercise)
RETURN m
```

## File Structure

```
src/
├── lib/
│   └── knowledge-graph.ts          # Core knowledge graph functions
├── app/api/
│   ├── admin/
│   │   └── knowledge-graph/
│   │       └── route.ts             # Admin API endpoints
│   └── knowledge/upload/
│       └── route.ts                 # Updated with graph integration
test-knowledge-graph.js              # Test script
```

## Benefits

### 1. Enhanced Context Understanding
- Relationships between fitness concepts become explicit
- Better understanding of exercise progressions and contraindications

### 2. Improved RAG Performance
- Query expansion using related entities
- Better context retrieval through graph traversal
- Identification of knowledge conflicts

### 3. Knowledge Discovery
- Visualization of fitness concept relationships
- Identification of knowledge gaps
- Structured learning paths

### 4. Scalable Architecture
- Graph grows automatically with new documents
- Neo4j handles complex queries efficiently
- Separate from primary application data

## Next Steps

1. **Deploy Neo4j**: Set up production Neo4j instance
2. **Test Integration**: Upload fitness documents and verify graph building
3. **Enhance Queries**: Implement graph-based RAG enhancements
4. **Add Visualization**: Create admin interface for graph exploration
5. **Optimize Performance**: Add indexing and query optimization

The knowledge graph foundation is now in place and ready to enhance your RAG system with structured fitness knowledge relationships.
