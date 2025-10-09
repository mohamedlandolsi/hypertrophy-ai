# Graph RAG Implementation

## Overview

Successfully implemented a Graph RAG (Graph-enhanced Retrieval-Augmented Generation) architecture that enhances the existing hybrid search system by incorporating knowledge graph relationships for more intelligent and contextually aware information retrieval.

## Key Features

### 1. **Multi-Modal Search Architecture**
- **Vector Search**: Semantic similarity using pgvector embeddings
- **Keyword Search**: PostgreSQL full-text search with AND/OR logic
- **Graph Search**: Neo4j knowledge graph relationship traversal (NEW!)
- **Enhanced Keyword Search**: Query refinement with relevance scoring

### 2. **Graph Search Functionality**
- **Entity Extraction**: Identifies fitness-related entities in user queries
- **Relationship Traversal**: Uses Neo4j to find related concepts and entities
- **Context Expansion**: Expands search context using graph relationships
- **Intelligent Scoring**: Weights graph results based on relationship strength

### 3. **Enhanced Hybrid Search**
- **Parallel Processing**: All search methods run concurrently for optimal performance
- **Smart Weighting**: Source-specific scoring with graph search prioritization
- **Result Deduplication**: Intelligent merging with multi-source boosting
- **Fallback Mechanisms**: Graceful degradation if individual search methods fail

## Implementation Details

### Core Functions

#### `graphSearch(query, maxChunks)`
- Extracts fitness entities from user query
- Queries Neo4j knowledge graph for related entities
- Expands search context using graph relationships
- Returns relevance-scored results

#### Enhanced `hybridSearch(query, maxChunks, threshold, categoryIds)`
- Integrates graph search with existing vector and keyword search
- Applies source-specific weighting (vector: 1.0, graph: 0.9, keyword: 0.8)
- Prioritizes results appearing in multiple sources
- Special boost for graph + vector combinations

### Entity Recognition

The system recognizes over 80+ fitness-related entities including:
- **Exercises**: squat, deadlift, bench press, etc.
- **Muscle Groups**: chest, back, shoulders, etc.
- **Training Concepts**: hypertrophy, progressive overload, etc.
- **Equipment**: barbell, dumbbell, cable, etc.
- **Nutrition**: protein, creatine, supplements, etc.

### Search Flow

```
User Query → Entity Extraction → Neo4j Graph Query → Related Entities
                ↓
Knowledge Chunks ← Enhanced Search ← Context Expansion
                ↓
Vector Search + Keyword Search + Graph Search (Parallel)
                ↓
Result Merging + Deduplication + Scoring
                ↓
Final Ranked Results
```

## Integration Points

### 1. **Knowledge Graph Integration**
- Uses existing `src/lib/knowledge-graph.ts` functions
- Leverages `queryRelatedEntities()` for relationship traversal
- Integrates with document upload pipeline for graph building

### 2. **Chat API Enhancement**
- No changes required to `src/app/api/chat/route.ts`
- Automatically benefits from enhanced `hybridSearch()`
- Maintains backward compatibility

### 3. **Vector Search Enhancement**
- Extended `src/lib/vector-search.ts` with graph capabilities
- Maintained existing function signatures
- Added comprehensive logging and debugging

## Performance Characteristics

### Search Distribution
- **Vector Search**: 60% of results (high precision)
- **Graph Search**: 40% of results (contextual expansion)
- **Keyword Search**: 40% of results (exact term matching)
- **Enhanced Keywords**: 30% of results (query refinement)

### Scoring Weights
- **Vector + Graph combination**: Highest priority
- **Multiple source results**: Boosted scoring
- **Graph-only results**: 0.9x weight
- **Keyword-only results**: 0.8x weight

### Fallback Strategy
1. Graph search fails → Continue with vector + keyword
2. All enhanced searches fail → Fall back to vector search only
3. Vector search fails → Return empty results with error logging

## Testing & Validation

### Test Script
Run `node scripts/test-graph-rag.js` to validate:
- Graph entity extraction
- Neo4j relationship queries
- Hybrid search integration
- Result quality and scoring

### Expected Improvements
- **Better context understanding**: Queries like "chest exercises" now return tricep and shoulder exercises due to graph relationships
- **Enhanced exercise recommendations**: Related movements and progressions
- **Improved nutrition advice**: Connected supplement and dietary information
- **Contextual training advice**: Related concepts and progressions

## Debugging & Monitoring

### Console Logging
- `🕸️` Graph search operations
- `🔗` Entity relationship discoveries
- `📊` Source distribution analytics
- `📈` Score distribution metrics

### Performance Monitoring
- Search method timing
- Result count by source
- Entity extraction success rates
- Graph query performance

## Future Enhancements

### Short Term
- **Entity confidence scoring**: Weight entities by confidence levels
- **Dynamic entity learning**: Extract new entities from successful searches
- **Graph visualization**: Admin interface for graph exploration

### Long Term
- **Personalized graph weights**: User-specific relationship scoring
- **Temporal relationships**: Time-based entity connections
- **Multi-language graph**: Extend to Arabic and French entities
- **Graph-based recommendations**: Proactive content suggestions

## Configuration

### Environment Variables
All existing Neo4j configuration applies:
- `NEO4J_URI`: Connection string
- `NEO4J_USER`: Username
- `NEO4J_PASSWORD`: Password

### Search Parameters
Configurable via AI Configuration:
- `ragMaxChunks`: Maximum results per search
- `ragSimilarityThreshold`: Vector similarity threshold
- Graph search uses 40% of `ragMaxChunks`

## Maintenance

### Graph Health
- Monitor graph connection status via admin API
- Regular graph statistics review
- Entity relationship quality assessment

### Performance Optimization
- Graph query optimization
- Entity extraction efficiency
- Result caching strategies

This Graph RAG implementation significantly enhances the system's ability to understand context and relationships in fitness and exercise science, providing users with more comprehensive and contextually relevant information.
