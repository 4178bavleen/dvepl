import crypto from "node:crypto";

export async function fetchAwardTenders() {
    const serverUrl = process.env.QUOTE_TENDER_SERVER_URL;
    const token = process.env.QUOTE_TENDER_TOKEN;
    const secretKey = process.env.QUOTE_TENDER_SECRET_KEY;

    if (!serverUrl) {
        throw new Error("QUOTE_TENDER_SERVER_URL is not configured");
    }

    if (!token) {
        throw new Error("QUOTE_TENDER_TOKEN is not configured");
    }

    if (!secretKey) {
        throw new Error("QUOTE_TENDER_SECRET_KEY is not configured");
    }

    // PHP: time()
    const timestamp = Math.floor(Date.now() / 1000);

    // PHP:
    // hash_hmac('sha256', $token . $timestamp, $secretKey)
    const signature = crypto
        .createHmac("sha256", secretKey)
        .update(token + timestamp)
        .digest("hex");

    const apiUrl = new URL(
        "login/api/awardTenders.php",
        serverUrl.endsWith("/")
            ? serverUrl
            : `${serverUrl}/`,
    );

    apiUrl.searchParams.set("token", token);
    apiUrl.searchParams.set("ts", timestamp.toString());
    apiUrl.searchParams.set("sig", signature);

    const response = await fetch(apiUrl.toString(), {
        method: "GET",
        headers: {
            Accept: "application/json",
        },
    });

    const responseText = await response.text();

    if (!response.ok) {
        throw new Error(
            `Award Tenders API failed: ${response.status} ${responseText}`
        );
    }

    try {
        return JSON.parse(responseText);
    } catch {
        throw new Error(
            `Award Tenders API returned invalid JSON: ${responseText}`
        );
    }
}