import axios from "axios";

const LINERA_NODE_URL = process.env.LINERA_NODE_URL || "http://localhost:8080";
const APPLICATION_ID = process.env.LINERA_APPLICATION_ID;
const GATEWAY_URL = process.env.GATEWAY_URL || "https://linera-host-gateway.vercel.app";

const LINERA_CHAIN_ID = process.env.LINERA_CHAIN_ID;

async function lineraRequest(query, variables = {}) {
    // If CHAIN_ID is not set, we might default or error. The worker usually knows its chain.
    // For simplicity, we assume we post to the configured worker chain.
    const url = LINERA_CHAIN_ID ? `${LINERA_NODE_URL}/chains/${LINERA_CHAIN_ID}` : LINERA_NODE_URL;

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

export async function sendResult(requestId, result) {
    console.log(`[Result] Submitting result for ${requestId} to Linera...`);

    const resultString = typeof result === 'object' ? JSON.stringify(result) : String(result);
    // Determine hash if needed, but here we just pass the string or hash as defined in ABI.
    // Rust ABI `SubmitResult` takes `result_hash: String`.

    // We'll mimic the old hash logic just to be safe, or send the result string if short.
    // Let's send a fake hash for now or real SHA256.
    const resultHash = "0x" + Buffer.from(resultString).toString("hex").substring(0, 64); // Mock hash

    const mutation = `
        mutation SubmitResult($appId: String!, $reqId: String!, $resHash: String!) {
            executeOperation(
                applicationId: $appId,
                operation: {
                    SubmitResult: {
                        requestId: $reqId,
                        resultHash: $resHash
                    }
                }
            )
        }
    `;

    try {
        await lineraRequest(mutation, {
            appId: APPLICATION_ID,
            reqId: requestId,
            resHash: resultHash
        });
        console.log(`[Result] Result submitted to Linera.`);
    } catch (e) {
        console.error(`[Result] Failed to submit to Linera:`, e);
    }

    // Report to Gateway (Web2 side)
    try {
        await axios.post(`${GATEWAY_URL}/_internal/worker-result`, {
            requestId: requestId,
            result,
            txHash: "linera-tx-hash"
        });
    } catch (ignore) { }
}
