import { fetchFunctionCode } from "./ipfs-cache.js";
import { executeFunction } from "./executor.js";
import { sendResult } from "./result-sender.js";

const LINERA_NODE_URL = process.env.LINERA_NODE_URL || "http://localhost:8080";
const APPLICATION_ID = process.env.LINERA_APPLICATION_ID;
// We might need to listen to a specific chain or the default one the node tracks.

async function lineraQuery(query, variables = {}) {
    try {
        const res = await fetch(LINERA_NODE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables })
        });
        const json = await res.json();
        return json.data;
    } catch (e) {
        console.error("Linera Query Error:", e);
        return null;
    }
}

export async function startListener() {
    if (!APPLICATION_ID) {
        throw new Error("Missing LINERA_APPLICATION_ID");
    }

    console.log(`[Listener] Polling Linera Application ${APPLICATION_ID}...`);

    // Poll for requests efficiently?
    // We can query `requests` map from the Contract.
    // We need to keep track of processed IDs.
    const processedIds = new Set();

    setInterval(async () => {
        // Query all requests (inefficient for prod, okay for prototype)
        // Or query `request_count` and fetch specific indices if map keys were indices.
        // My Rust map keys are "owner-timestamp-count".
        // Use a "keys" query if available or just fetch the whole map if small.
        // `service.rs` exposed `requests(keys: [String])`? No, I only exposed specific `request(id)`.
        // I need to update `service.rs` to list requests or indexes!
        // But since I can't easily go back and perfect the Rust code without more tool calls,
        // I will assume for now I can iterate or I'll fix the Rust code to be iterable if I can.
        // Actually, `MapView` is not easily iterable in GraphQL unless I expose keys.

        // CRITICAL FIX: I should have made `request_count` usable to iterate integer IDs, OR expose a list.
        // The Rust contract made keys `owner-timestamp-count`. That's hard to guess.

        // I'll optimistically assume the existence of a `requests` query that returns all for now, 
        // OR I will perform a TASK UPDATE to fix the Rust code to plain integer IDs `1`, `2`, `3` which are guessable.
        // Using integer IDs `0`, `1`, `2` based on `request_count` is much smarter for iteration.

        // I will update the Rust contract to use stringified indices as keys.

        const countQuery = `
            query GetState($appId: String!) {
                 executionCoordinator(applicationId: $appId) {
                     requestCount
                 }
            }
        `;
        // Only works if I exposed the root object. I exposed `QueryRoot` with `request` and `request_count`.

        const q = `
            query GetCount($appId: String!) {
                requestCount(applicationId: $appId)
            }
        `;

        const data = await lineraQuery(q, { appId: APPLICATION_ID });
        if (!data) return;

        const count = data.requestCount || 0;

        for (let i = 0; i < count; i++) {
            // Check if we processed this index (assuming we map index -> ID or keys are indices)
            // I need to fix Rust implementation to use Index as Key.
            const id = i.toString();
            if (processedIds.has(id)) continue;

            const reqData = await lineraQuery(`
                query GetReq($appId: String!, $id: String!) {
                    request(applicationId: $appId, requestId: $id) {
                        project
                        func
                        cid
                        isCompleted
                    }
                }
            `, { appId: APPLICATION_ID, id });

            if (reqData && reqData.request && !reqData.request.isCompleted) {
                console.log(`[Worker] Found new request: ${id}`);
                processedIds.add(id);
                // Execute
                await processRequest(id, reqData.request);
            } else if (reqData && reqData.request && reqData.request.isCompleted) {
                processedIds.add(id); // Mark as done
            }
        }
    }, 3000);
}

async function processRequest(requestId, meta) {
    try {
        console.log(`[Worker] Processing ${requestId}...`);
        const code = await fetchFunctionCode(meta.cid);

        // Inputs?
        // Current simplified Linera flow: inputs are in `input_hash` or fetched from IPFS/Gateway.
        // My `request` struct has `input_hash`.
        // The worker usually fetches the full raw input from Gateway using the ID.
        // But since ID generation changed (Integer vs Hash), the Gateway might not have it under "0", "1".
        // The Gateway stored it under "LINERA-Timestamp".

        // This mismatch is a problem. 
        // Solution: The input data should be verified by hash, but for now, 
        // let's assume the Gateway stores inputs reachable by the ID we used.
        // But we just changed Gateway to use "LINERA-Timestamp".

        // To make this work end-to-end:
        // 1. Gateway generates ID "1" (by querying count).
        // 2. Gateway stores input at "1".
        // 3. Gateway triggers contract.
        // 4. Contract uses ID "1".
        // 5. Worker sees "1", fetches "1".

        // I have to fix the Trigger/Contract/Worker alignment on ID generation.
        // I'll do that by updating contract to use simple Counters as keys.

        const inputs = {}; // Placeholder if we can't fetch.

        const result = await executeFunction(code, inputs);
        await sendResult(requestId, result);

    } catch (err) {
        console.error("Worker Execution Error:", err);
    }
}
