import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // incrementalCache: r2IncrementalCache, // Supabase 백엔드 검증이 끝나면 R2 캐시 붙이기
});
