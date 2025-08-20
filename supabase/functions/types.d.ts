// Type declarations for Deno runtime in Supabase Edge Functions

declare global {
  namespace Deno {
    interface Env {
      get(key: string): string | undefined;
    }
    
    const env: Env;
  }
}

// Module declarations for remote imports
declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(url: string, key: string): any;
}

declare module 'https://cdn.skypack.dev/@huggingface/transformers@2.6.0' {
  export function pipeline(task: string, model: string, options?: any): Promise<any>;
  export const env: {
    allowRemoteModels: boolean;
    allowLocalModels: boolean;
  };
}

declare module 'https://deno.land/x/xhr@0.1.0/mod.ts';

export {};
