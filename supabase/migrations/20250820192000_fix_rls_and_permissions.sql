-- Final comprehensive fix for function permissions and RLS
-- This addresses potential schema and RLS issues

-- First, ensure the function owner has proper permissions
ALTER FUNCTION public.match_document_sections(text, float, int) OWNER TO postgres;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant execute permissions on the specific function
GRANT EXECUTE ON FUNCTION public.match_document_sections(text, float, int) TO anon, authenticated, service_role;

-- Ensure no RLS is blocking the function
ALTER TABLE "KnowledgeChunk" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeItem" DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS but with proper policies for the function context
ALTER TABLE "KnowledgeChunk" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeItem" ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for the function context
DROP POLICY IF EXISTS "Allow function access to knowledge chunks" ON "KnowledgeChunk";
CREATE POLICY "Allow function access to knowledge chunks" ON "KnowledgeChunk"
    FOR SELECT TO anon, authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "Allow function access to knowledge items" ON "KnowledgeItem";
CREATE POLICY "Allow function access to knowledge items" ON "KnowledgeItem"
    FOR SELECT TO anon, authenticated, service_role
    USING (true);
