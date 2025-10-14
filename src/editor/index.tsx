import { component$, useSignal, useStore, $ } from "@builder.io/qwik";
import { LuDownload, LuCopy, LuFileSpreadsheet } from "@qwikest/icons/lucide";

export default component$(() => {
  // ✅ Signals & stores defined *inside* component$
  const inputText = useSignal("");
  const results = useStore<{ key: string; value: string }[]>([]);

  // ✅ Event handlers wrapped in `$()` to make them QRLs (serializable)
  const parseInput = $(() => {
    const lines = inputText.value.split("\n").filter((line) => line.trim());
    const parsed: { key: string; value: string }[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      let cleaned = trimmed.replace(/^["']|["'],?$/g, "");
      if (cleaned.includes(":")) {
        const colonIndex = cleaned.indexOf(":");
        let key = cleaned.substring(0, colonIndex).trim();
        let value = cleaned.substring(colonIndex + 1).trim();

        key = key.replace(/^["']|["']$/g, "");
        value = value.replace(/^["']|["']$/g, "");

        parsed.push({ key, value });
      }
    });

    results.splice(0, results.length, ...parsed);
  });

  const downloadCSV = $(() => {
    const csvContent = [
      ["key", "en-GB"],
      ...results.map((r) => [r.key, r.value]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "translations.csv";
    a.click();
  });

  const copyToClipboard = $(async () => {
    const text = results.map((r) => `${r.key}\t${r.value}`).join("\n");
    await navigator.clipboard.writeText(text);
    alert("Copied! Now paste directly into Excel (Ctrl+V)");
  });

  const downloadTSV = $(() => {
    const tsvContent = [
      "key\ten-GB",
      ...results.map((r) => `${r.key}\t${r.value}`),
    ].join("\n");

    const blob = new Blob([tsvContent], {
      type: "text/tab-separated-values",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "translations.tsv";
    a.click();
  });

  const copyValuesOnly = $(async () => {
    const text = results.map((r) => r.value).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      alert(
        "Translations copied! Paste into your new language column (e.g., IT-IT column)"
      );
    } catch (err) {
      alert("Failed to copy. Please try again.");
      console.error("Copy failed:", err);
    }
  });

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-lg shadow-xl p-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            JSON Translation String Splitter
          </h1>

          <div class="grid lg:grid-cols-2 gap-6 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Input JSON Strings
              </label>
              <textarea
                value={inputText.value}
                onInput$={(e) =>
                  (inputText.value = (e.target as HTMLTextAreaElement).value)
                }
                class="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Parsed Results ({results.length} items)
              </label>
              <div class="h-96 overflow-y-auto border border-gray-300 rounded-lg bg-gray-50">
                {results.length === 0 ? (
                  <div class="flex items-center justify-center h-full text-gray-400">
                    Results will appear here...
                  </div>
                ) : (
                  <table class="w-full text-sm">
                    <thead class="bg-gray-200 sticky top-0">
                      <tr>
                        <th class="px-4 py-2 text-left font-semibold">Key</th>
                        <th class="px-4 py-2 text-left font-semibold">en-GB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, idx) => (
                        <tr
                          key={idx}
                          class={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td class="px-4 py-2 border-t border-gray-200 font-mono text-xs">
                            {r.key}
                          </td>
                          <td class="px-4 py-2 border-t border-gray-200 text-xs">
                            {r.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-4">
            <button
              onClick$={parseInput}
              class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <LuFileSpreadsheet class="w-5 h-5" /> Parse Strings
            </button>

            {results.length > 0 && (
              <>
                <button
                  onClick$={copyToClipboard}
                  class="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <LuCopy class="w-5 h-5" /> Copy for Excel
                </button>

                <button
                  onClick$={copyValuesOnly}
                  class="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                >
                  <LuCopy class="w-5 h-5" /> Copy Translations Only
                </button>

                <button
                  onClick$={downloadCSV}
                  class="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <LuDownload class="w-5 h-5" /> Download CSV
                </button>

                <button
                  onClick$={downloadTSV}
                  class="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <LuDownload class="w-5 h-5" /> Download TSV
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
