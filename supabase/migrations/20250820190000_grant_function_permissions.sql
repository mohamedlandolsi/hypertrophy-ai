-- Grant permissions for the match_document_sections function
GRANT EXECUTE ON FUNCTION public.match_document_sections TO anon, authenticated, service_role;

-- Also ensure the function is accessible via RPC
REVOKE ALL ON FUNCTION public.match_document_sections FROM public;
GRANT EXECUTE ON FUNCTION public.match_document_sections TO anon, authenticated, service_role;
