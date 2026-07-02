(function () {
  "use strict";

  const EVENT_NAME = "__PCPP_QAPI_CAPTURE__";
  const STORAGE_KEY = "pcppQapiCaptures";

  function parsePage(requestBody, payload) {
    const params = new URLSearchParams(requestBody || "");
    const directPage = parseInt(params.get("page") || "", 10);
    if (Number.isFinite(directPage)) return directPage;

    const href = params.get("href") || "";
    const hash = href.includes("#") ? href.slice(href.indexOf("#") + 1) : "";
    const hashParams = new URLSearchParams(hash);
    const hashPage = parseInt(hashParams.get("page") || "", 10);
    if (Number.isFinite(hashPage)) return hashPage;

    if (payload && typeof payload.paging_row === "string") {
      const match = payload.paging_row.match(/pagination--current["'][^>]*>(\d+)/);
      if (match) return parseInt(match[1], 10);
    }

    return 1;
  }

  function pageUrlFromRequest(requestBody) {
    const params = new URLSearchParams(requestBody || "");
    return params.get("href") || location.href;
  }

  function productIds(payload) {
    const data = payload && payload.data && typeof payload.data === "object" ? payload.data : {};
    return Object.keys(data);
  }

  function storeCapture(message) {
    let payload;
    try {
      payload = JSON.parse(message.responseText);
    } catch (_) {
      return;
    }

    if (!payload || payload.success !== true || typeof payload.html !== "string") return;

    const page = parsePage(message.requestBody, payload);
    const capture = {
      page,
      capturedAt: message.capturedAt,
      pageUrl: pageUrlFromRequest(message.requestBody),
      qapiUrl: message.url,
      requestBody: message.requestBody,
      count: payload.count || null,
      lowest_price: payload.lowest_price || null,
      productIds: productIds(payload),
      payload
    };

    chrome.storage.local.get({ [STORAGE_KEY]: [] }, (result) => {
      const captures = result[STORAGE_KEY].filter((item) => item.page !== page);
      captures.push(capture);
      captures.sort((a, b) => a.page - b.page);
      chrome.storage.local.set({ [STORAGE_KEY]: captures });
    });
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const message = event.data;
    if (!message || message.source !== EVENT_NAME) return;
    storeCapture(message);
  });

})();
