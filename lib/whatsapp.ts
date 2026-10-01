/**
 * Sends the e-voucher (image + voucher ID) to the customer's WhatsApp number
 * via the Veup WhatsApp template API.
 *
 * Auth flow (confirmed working):
 *  1. POST /auth/token with { process_key: VEUP_PROCESS_KEY } -> returns a JWT access_token.
 *  2. POST /v1/message with:
 *       - header "X-API-Key": the JWT access_token from step 1 (NOT a separate static key)
 *       - body.api_key: VEUP_PROCESS_KEY itself (same value used in step 1)
 *       - to.number: full international format WITH a leading "+" (e.g. "+919787560231")
 *
 * Required env vars:
 *  - VEUP_PROCESS_KEY        Used both to fetch the access token and in the message body's api_key field.
 *  - VEUP_CAMPAIGN_NAME
 *  - VEUP_WABA_TEMPLATE_NAME
 *  - VEUP_WABA_SERVICE_NAME
 *
 * VEUP_API_KEY is no longer used — Veup's /v1/message endpoint authenticates
 * via the access token (as X-API-Key) and the process key (in the body),
 * not a separate static API key.
 */

export interface SendResult {
  success: boolean;
  error?: string;
}

function maskSecret(value: string | undefined): string {
  if (!value) return "(missing)";
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}...${value.slice(-4)} (len ${value.length})`;
}

/** Ensures the number has a leading "+", as Veup's API expects. */
function toVeupNumberFormat(rawNumber: string): string {
  const digits = rawNumber.replace(/\D/g, "");
  return `+${digits}`;
}

async function getVeupAccessToken(processKey: string): Promise<string> {
  console.log("[Veup] Starting auth. VEUP_PROCESS_KEY:", maskSecret(processKey));

  const response = await fetch("https://c-api.veup.io/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ process_key: processKey }),
  });

  const data = await response.json().catch(() => ({}));

  console.log(
    "[Veup] Auth response status:",
    response.status,
    "body:",
    JSON.stringify(data)
  );

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `Veup auth failed (${response.status})`
    );
  }

  const accessToken =
    data?.access_token ||
    data?.token ||
    data?.data?.access_token ||
    data?.data?.token;

  if (!accessToken) {
    throw new Error("Veup auth response did not include an access token.");
  }

  return String(accessToken);
}

export async function sendVoucherOnWhatsApp(params: {
  toNumber: string;
  voucherId: string;
  voucherImageUrl?: string;
}): Promise<SendResult> {
  const { toNumber, voucherId, voucherImageUrl } = params;

  const processKey = process.env.VEUP_PROCESS_KEY;
  const campaignName = process.env.VEUP_CAMPAIGN_NAME || "voucher_campaign";
  const templateName = process.env.VEUP_WABA_TEMPLATE_NAME;
  const serviceName = process.env.VEUP_WABA_SERVICE_NAME;

  console.log("[Veup] sendVoucherOnWhatsApp called for:", toNumber, voucherId);

  if (!processKey || !templateName || !serviceName) {
    console.log("[Veup] Missing required config — aborting before any API call.");
    return {
      success: false,
      error:
        "Veup WhatsApp settings are not configured (VEUP_PROCESS_KEY / VEUP_WABA_TEMPLATE_NAME / VEUP_WABA_SERVICE_NAME).",
    };
  }

  try {
    const accessToken = await getVeupAccessToken(processKey);

    const payload: Record<string, unknown> = {
      api_key: processKey,
      campaign_name: campaignName,
      to: {
        number: toVeupNumberFormat(toNumber),
      },
      delivery: {
        type: "single",
        channels: ["waba"],
      },
      campaign_data: {
        waba: {
          template_name: templateName,
          service_name: serviceName,
          ...(voucherImageUrl ? { media_url: voucherImageUrl } : {}),
          params: [voucherId],
        },
      },
    };

    console.log("[Veup] Sending message payload:", JSON.stringify(payload));

    const response = await fetch("https://c-api.veup.io/v1/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": accessToken,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    console.log(
      "[Veup] Message response status:",
      response.status,
      "body:",
      JSON.stringify(data)
    );

    if (!response.ok || data?.status === "error" || data?.success === false) {
      return {
        success: false,
        error:
          data?.message ||
          data?.error ||
          data?.detail ||
          `Veup API error (${response.status})`,
      };
    }

    return { success: true };
  } catch (err) {
    console.log(
      "[Veup] Exception thrown:",
      err instanceof Error ? err.message : String(err)
    );
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown Veup WhatsApp send error",
    };
  }
}