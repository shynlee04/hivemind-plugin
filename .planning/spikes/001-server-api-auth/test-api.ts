import { createOpencodeClient } from "@opencode-ai/sdk";

async function main() {
  const client = createOpencodeClient({ baseUrl: "http://127.0.0.1:4096" });
  
  try {
    const res = await client.session.list();
    console.log("Sessions:", JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.error("Failed to list sessions:", e.message);
  }
}

main();
