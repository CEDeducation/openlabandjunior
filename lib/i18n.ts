export type Locale = "en" | "zh-TW"
export const localeStorageKey = "openlab.interface.locale.v1"
// Exact-match interface terms only: never machine-translate user notes, records or scientific data.
export const zhTW: Record<string, string> = {
 "Home":"首頁", "Platform":"平台", "Bioresearch":"生物研究", "Bioprocess":"生物製程", "Automation":"自動化", "In Vivo":"活體研究",
 "Projects":"研究專案", "Notebook":"研究筆記本", "Protocols":"實驗流程", "Registry":"資料登錄庫", "Chemistry":"化學", "Chemistry & cheminformatics":"化學與化學資訊學",
 "Molecular biology":"分子生物學", "Workflows":"工作流程", "Evidence":"研究證據", "Activity":"活動紀錄", "Help":"使用說明", "Settings & sync":"設定與同步",
 "Applications":"應用程式", "Core":"核心工具", "System":"系統", "Research operating system":"研究工作平台", "Persistence":"資料保存", "Auto-save enabled":"已啟用自動儲存", "Research is saved as you work":"研究內容會隨時儲存",
 "Search experiments, compounds, sequences and evidence…":"搜尋實驗、化合物、序列與文獻證據…", "Global search":"全域搜尋", "Switch profile":"切換使用者", "Local":"本機", "Cloud":"雲端", "Cloud ready":"雲端就緒", "Saving…":"儲存中…", "Saved":"已儲存", "Sync issue":"同步異常",
 "Compound library":"化合物資料庫", "Structure Lab":"結構分析工作室", "Structure search":"結構搜尋", "SAR":"構效關係", "Screening":"篩選", "Reactions":"化學反應", "3D & poses":"3D 結構與構形", "ADMET & predictions":"ADMET 與預測", "Data tools":"資料工具",
 "Registered structures and identifiers":"已登錄的結構與識別碼", "SMILES / MOL / SDF + RDKit":"SMILES / MOL / SDF + RDKit", "Similarity and SMARTS":"相似性與 SMARTS", "Activity data and property plots":"活性資料與性質圖表", "Property and rule-of-five alerts":"性質與五規則警示", "Stoichiometry, yield and procedure":"化學計量、產率與步驟", "Measured vs predicted provenance":"實測與預測資料來源", "Bulk import, export and deduplication":"批次匯入、匯出與去重",
 "Compound name":"化合物名稱", "Input format":"輸入格式", "Structure input":"結構輸入", "Analyze structure":"分析結構", "Save to compound library":"儲存到化合物資料庫", "Import file":"匯入檔案", "Canonical structure":"標準化結構", "Computed from the parsed molecular graph.":"由解析後的分子圖計算", "2D structure":"2D 化學結構", "Analyze with RDKit to render.":"請使用 RDKit 分析後顯示", "No compound selected":"尚未選擇化合物", "Open Structure Lab":"開啟結構分析工作室", "Start your library":"建立化合物資料庫", "Open original result":"開啟原始結果",
 "Zoom in":"放大", "Zoom out":"縮小", "Fit":"適合視窗", "Expand":"展開", "Close":"關閉", "Project":"專案", "Experiment":"實驗", "Protocol":"實驗流程", "Sequence":"序列", "Compound":"化合物", "Reaction":"化學反應", "Task":"任務",
 "Import":"匯入", "Export":"匯出", "Download":"下載", "Save":"儲存", "Cancel":"取消", "Edit":"編輯", "Delete":"刪除", "New":"新增", "Search":"搜尋", "Results":"結果", "Settings":"設定", "Notes":"筆記", "Conclusion":"結論", "Objective":"研究目的",
}
export function translate(value: string, locale: Locale) { return locale === "zh-TW" ? (zhTW[value] ?? value) : value }
