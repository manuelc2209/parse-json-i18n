import { component$, useSignal, useStore, $ } from "@builder.io/qwik";
import {
  LuDownload,
  LuCopy,
  LuFileSpreadsheet,
  LuX,
  LuUpload,
} from "@qwikest/icons/lucide";

interface FileData {
  name: string;
  content: Record<string, any>;
}

interface TranslationRow {
  key: string;
  value: string;
  source: string;
}

export default component$(() => {
  const activeTab = useSignal<"parser" | "files">("parser");
  const inputText = useSignal("");
  const results = useStore<{ key: string; value: string }[]>([]);
  const uploadedFiles = useStore<FileData[]>([]);
  const combinedResults = useStore<TranslationRow[]>([]);
  const isDragging = useSignal(false);
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

  const downloadCSVParser = $(() => {
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
    window.URL.revokeObjectURL(url);
  });

  const copyToClipboardParser = $(async () => {
    const text = results.map((r) => `${r.key}\t${r.value}`).join("\n");
    await navigator.clipboard.writeText(text);
    alert("Copied! Now paste directly into Excel (Ctrl+V)");
  });

  const downloadTSVParser = $(() => {
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
    window.URL.revokeObjectURL(url);
  });

  const copyValuesOnlyParser = $(async () => {
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

  const flattenObject = (
    obj: Record<string, any>,
    prefix = ""
  ): Record<string, string> => {
    const flattened: Record<string, string> = {};

    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        Object.assign(flattened, flattenObject(value, newKey));
      } else {
        flattened[newKey] = String(value);
      }
    });

    return flattened;
  };

  const processFiles = $(() => {
    const allTranslations: TranslationRow[] = [];

    uploadedFiles.forEach((file) => {
      const flattened = flattenObject(file.content);
      Object.entries(flattened).forEach(([key, value]) => {
        allTranslations.push({
          key,
          value,
          source: file.name,
        });
      });
    });

    combinedResults.splice(0, combinedResults.length, ...allTranslations);
  });

  const handleDrop = $(async (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = false;

    const files = e.dataTransfer?.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.endsWith(".json")) {
        try {
          const text = await file.text();
          const content = JSON.parse(text);
          uploadedFiles.push({ name: file.name, content });
        } catch (err) {
          alert(`Failed to parse ${file.name}: ${err}`);
        }
      }
    }

    await processFiles();
  });

  const handleFileInput = $(async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.endsWith(".json")) {
        try {
          const text = await file.text();
          const content = JSON.parse(text);
          uploadedFiles.push({ name: file.name, content });
        } catch (err) {
          alert(`Failed to parse ${file.name}: ${err}`);
        }
      }
    }

    await processFiles();
    input.value = "";
  });

  const removeFile = $((index: number) => {
    uploadedFiles.splice(index, 1);
    processFiles();
  });

  const clearAll = $(() => {
    uploadedFiles.splice(0, uploadedFiles.length);
    combinedResults.splice(0, combinedResults.length);
  });

  const downloadCSVFiles = $(() => {
    const csvContent = [
      ["key", "en-GB", "source"],
      ...combinedResults.map((r) => [r.key, r.value, r.source]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "combined-translations.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  });

  const copyToClipboardFiles = $(async () => {
    const text = combinedResults
      .map((r) => `${r.key}\t${r.value}\t${r.source}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    alert("Copied! Now paste directly into Excel (Ctrl+V)");
  });

  const downloadTSVFiles = $(() => {
    const tsvContent = [
      "key\ten-GB\tsource",
      ...combinedResults.map((r) => `${r.key}\t${r.value}\t${r.source}`),
    ].join("\n");

    const blob = new Blob([tsvContent], {
      type: "text/tab-separated-values",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "combined-translations.tsv";
    a.click();
    window.URL.revokeObjectURL(url);
  });

  const copyValuesOnlyFiles = $(async () => {
    const text = combinedResults.map((r) => r.value).join("\n");
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
            i18n Translation Tool
          </h1>
          <p class="text-gray-600 mb-6">
            Parse JSON strings or combine multiple translation files
          </p>

          {/* Tabs */}
          <div class="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick$={() => (activeTab.value = "parser")}
              class={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab.value === "parser"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              String Parser
            </button>
            <button
              onClick$={() => (activeTab.value = "files")}
              class={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab.value === "files"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              Multi-File Upload
            </button>
          </div>

          {/* STRING PARSER TAB */}
          {activeTab.value === "parser" && (
            <>
              <div class="grid lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Input JSON Strings
                  </label>
                  <textarea
                    value={inputText.value}
                    onInput$={(e) =>
                      (inputText.value = (
                        e.target as HTMLTextAreaElement
                      ).value)
                    }
                    class="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder='Paste your JSON strings here, e.g.:
"key1": "value1",
"key2": "value2"'
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
                            <th class="px-4 py-2 text-left font-semibold">
                              Key
                            </th>
                            <th class="px-4 py-2 text-left font-semibold">
                              en-GB
                            </th>
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
                      onClick$={copyToClipboardParser}
                      class="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <LuCopy class="w-5 h-5" /> Copy for Excel
                    </button>

                    <button
                      onClick$={copyValuesOnlyParser}
                      class="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                    >
                      <LuCopy class="w-5 h-5" /> Copy Translations Only
                    </button>

                    <button
                      onClick$={downloadCSVParser}
                      class="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      <LuDownload class="w-5 h-5" /> Download CSV
                    </button>

                    <button
                      onClick$={downloadTSVParser}
                      class="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      <LuDownload class="w-5 h-5" /> Download TSV
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* MULTI-FILE UPLOAD TAB */}
          {activeTab.value === "files" && (
            <>
              {/* Drag & Drop Zone */}
              <div
                class={`border-2 border-dashed rounded-lg p-8 mb-6 transition-colors ${
                  isDragging.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-gray-50"
                }`}
                onDragOver$={(e) => {
                  e.preventDefault();
                  isDragging.value = true;
                }}
                onDragLeave$={() => (isDragging.value = false)}
                onDrop$={handleDrop}
              >
                <div class="flex flex-col items-center justify-center text-center">
                  <LuUpload class="w-12 h-12 text-gray-400 mb-4" />
                  <p class="text-lg font-medium text-gray-700 mb-2">
                    Drop JSON files here
                  </p>
                  <p class="text-sm text-gray-500 mb-4">
                    or click to browse (courier.json, driver.json, etc.)
                  </p>
                  <label class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                    Choose Files
                    <input
                      type="file"
                      multiple
                      accept=".json"
                      class="hidden"
                      onChange$={handleFileInput}
                    />
                  </label>
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div class="mb-6">
                  <div class="flex items-center justify-between mb-3">
                    <h2 class="text-lg font-semibold text-gray-800">
                      Uploaded Files ({uploadedFiles.length})
                    </h2>
                    <button
                      onClick$={clearAll}
                      class="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        class="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full"
                      >
                        <span class="text-sm font-medium">{file.name}</span>
                        <button
                          onClick$={() => removeFile(idx)}
                          class="hover:bg-blue-200 rounded-full p-1 transition-colors"
                        >
                          <LuX class="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results Table */}
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Combined Results ({combinedResults.length} translations)
                </label>
                <div class="h-96 overflow-y-auto border border-gray-300 rounded-lg bg-gray-50">
                  {combinedResults.length === 0 ? (
                    <div class="flex items-center justify-center h-full text-gray-400">
                      Upload JSON files to see combined translations...
                    </div>
                  ) : (
                    <table class="w-full text-sm">
                      <thead class="bg-gray-200 sticky top-0">
                        <tr>
                          <th class="px-4 py-2 text-left font-semibold">Key</th>
                          <th class="px-4 py-2 text-left font-semibold">
                            en-GB
                          </th>
                          <th class="px-4 py-2 text-left font-semibold">
                            Source
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {combinedResults.map((r, idx) => (
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
                            <td class="px-4 py-2 border-t border-gray-200 text-xs text-gray-500">
                              {r.source}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {combinedResults.length > 0 && (
                <div class="flex flex-wrap gap-4">
                  <button
                    onClick$={copyToClipboardFiles}
                    class="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <LuCopy class="w-5 h-5" /> Copy for Excel
                  </button>

                  <button
                    onClick$={copyValuesOnlyFiles}
                    class="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                  >
                    <LuCopy class="w-5 h-5" /> Copy Translations Only
                  </button>

                  <button
                    onClick$={downloadCSVFiles}
                    class="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    <LuDownload class="w-5 h-5" /> Download CSV
                  </button>

                  <button
                    onClick$={downloadTSVFiles}
                    class="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    <LuDownload class="w-5 h-5" /> Download TSV
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});
