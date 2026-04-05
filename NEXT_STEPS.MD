#1 update the test that are failing, after the new PageRenderer.tsx architecture change to registry

#2 consider: 
 1. Build-time code generation (best fit for multi-tenant SSG)                                                                    
                                                                                                                                   
  Instead of a static registry, a build script reads each client's Sanity data before next build, extracts the _type values        
  actually used by that client, and generates a PageRenderer.tsx that only imports those blocks. Zero dead code per tenant — not   
  just route-level splitting, but client-level elimination. 
                                                                                                                                   
  The tradeoff: adds build pipeline complexity. You need a pre-build step that queries Sanity and writes a file. But for 100+      
  tenants where client A never uses PricingPageBlock and client B never uses TestimonialsPageBlock, this is the only approach that
  gives you true per-client tree shaking. The registry pattern can't do this. 