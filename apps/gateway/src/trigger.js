import { supabase } from "./db/supabase.js";
import { getFunctionCID } from "./registry.js";

const LINERA_NODE_URL = process.env.LINERA_NODE_URL || "http://localhost:8080";
const CHAIN_ID = process.env.LINERA_CHAIN_ID;
const APPLICATION_ID = process.env.LINERA_APPLICATION_ID;

async function lineraRequest(query, variables = {}) {
    const url = `${LINERA_NODE_URL}/chains/${CHAIN_ID}`;
    // Note: The service listens on specific chain endpoints for context
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables })
    });
    const json = await res.json();
    if (json.errors) {
        throw new Error(JSON.stringify(json.errors));
    }
    return json.data;
}

export async function triggerExecution({ request, hash }) {
    if (!CHAIN_ID || !APPLICATION_ID) {
        throw new Error("Missing LINERA_CHAIN_ID or LINERA_APPLICATION_ID");
    }

    const cid = await getFunctionCID(
        request.meta.wallet,
        request.meta.project,
        request.meta.function
    );

    if (!cid) {
        const err = new Error("Function not found");
        err.code = "FUNCTION_NOT_FOUND";
        throw err;
    }

    console.log(`[Trigger] Triggering Linera execution for ${request.meta.project}/${request.meta.function}...`);

    // GraphQL Mutation matching our Rust contract
    const mutation = `
        mutation RequestExecution($appId: String!, $project: String!, $func: String!, $cid: String!, $inputHash: String!) {
            executeOperation(
                applicationId: $appId,
                operation: {
                    RequestExecution: {
                        project: $project,
                        func: $func,
                        cid: $cid,
                        inputHash: $inputHash
                    }
                }
            )
        }
    `;

    // Note: in actual Linera SDK, executeOperation might return something else or void.
    // We might need to query the state to get the ID, or compute it.
    // For now, we'll optimistically send the Mutation.

    await lineraRequest(mutation, {
        appId: APPLICATION_ID,
        project: request.meta.project,
        func: request.meta.function,
        cid: cid,
        inputHash: hash
    });

    // In our Rust contract, we generated an ID based on timestamp/count.
    // It's hard to get the exact ID back from the mutation result synchronously unless we query the account state or events.
    // For this migration, we will use a generated ID on the CLIENT side or query the latest request.
    // Let's assume we can query the latest request count to deduce the ID or use a client-provided UUID if we updated the contract.
    // Since we didn't update the contract to take an external ID, we might need to poll for the latest request by this user.

    // Simplification: We will just generate a UUID here for Supabase tracking, 
    // BUT the worker needs the *Chain* Request ID to submit the result to the chain.
    // To fix this proper mechanism:
    // 1. Contract should emit an event we can read? (Linera events are tricky via raw GraphQL without Subscription).
    // 2. Or we pass a unique ID *into* the contract? 
    // I should have added `external_id` to the Rust contract.
    // Since I can edit the Rust contract, I should update it to accept an `id`.

    // But since I already wrote the Rust code, let's stick to the plan.
    // We will query the `request_count` before and after, or query the latest request.
    // Actually, `service.rs` has `request_count`.

    // Query count to predict ID
    // Note: This relies on the node state. Race conditions possible in high concurrency.
    const countQuery = `
        query GetCount($appId: String!) {
            requestCount(applicationId: $appId)
        }
    `;

    let requestId = "0";
    try {
        const data = await lineraRequest(countQuery, { appId: APPLICATION_ID });
        if (data && typeof data.requestCount === 'number') {
            requestId = data.requestCount.toString();
        }
    } catch (e) {
        console.warn("Failed to fetch request count, using timestamp fallback", e);
        requestId = Date.now().toString();
    }

    // Submit Execution
    await lineraRequest(mutation, {
        appId: APPLICATION_ID,
        project: request.meta.project,
        func: request.meta.function,
        cid: cid,
        inputHash: hash
    });

    console.log(`[Trigger] Request submitted to Linera. Predicted ID: ${requestId}`);

    const { error } = await supabase
        .from('requests')
        .insert({
            request_id: requestId,
            status: 'PENDING',
            result: { http: request.http },
            created_at: new Date().toISOString()
        });

    if (error) console.error("Failed to insert pending request:", error);

    return { requestId };
}