export async function deliverToGoogleSheets(
  url: string,
  token: string,
  submission: { id: string },
  fetcher: typeof fetch = fetch,
) {
  const signal = AbortSignal.timeout(20000);
  let response = await fetcher(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, submission }),
    redirect: "manual",
    signal,
    cache: "no-store",
  });
  // Apps Script ContentService redirects to Google-hosted JSON. Only GET may follow it.
  if (response.status === 302 || response.status === 303) {
    const target = new URL(response.headers.get("location") || "");
    if (
      target.protocol !== "https:" ||
      target.hostname !== "script.googleusercontent.com" ||
      target.username ||
      target.password ||
      target.port
    )
      throw new Error("Unexpected redirect");
    response = await fetcher(target, {
      method: "GET",
      redirect: "error",
      signal,
      cache: "no-store",
    });
  }
  if (!response.ok) throw new Error("Receiver unavailable");
  const receipt = await response.json();
  if (receipt.ok !== true || receipt.id !== submission.id)
    throw new Error("Write not confirmed");
}
