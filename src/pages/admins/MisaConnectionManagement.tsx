import { useState, useEffect, useRef, useCallback } from "react";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Database,
  Users,
  Package,
  ShoppingCart,
  Truck,
  Copy,
  Check,
  Settings,
  Save,
  History,
  Download,
  Plus,
  Trash2,
  X,
  ChevronRight,
} from "lucide-react";
import {
  misaTokenApi,
  type MisaTokenStatus,
  type MisaTokenRecord,
  type MisaLogEntry,
} from "../../api/misa-token";
import {
  misaDataSourceApi,
  type MisaDataSource,
  type MisaApiConfig,
} from "../../api/misa-data-source";
import { useToast } from "../../contexts/ToastContext";

type TabType = "connection" | "data-sync";

export default function MisaConnectionManagement() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("connection");
  const [status, setStatus] = useState<MisaTokenStatus | null>(null);
  const [history, setHistory] = useState<MisaTokenRecord[]>([]);
  const [totalHistory, setTotalHistory] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logs, setLogs] = useState<MisaLogEntry[]>([]);
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Data Sync Tab states
  const [dataSources, setDataSources] = useState<MisaDataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] =
    useState<MisaDataSource | null>(null);
  const [apiConfig, setApiConfig] = useState<MisaApiConfig | null>(null);
  const [isLoadingDataSources, setIsLoadingDataSources] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configForm, setConfigForm] = useState({
    name: "",
    baseUrl: "",
    tenantId: "",
    tenantCode: "",
    databaseId: "",
    branchId: "",
    userId: "",
    deviceId: "",
  });

  // Fetch data states
  const [isFetching, setIsFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<{
    success: boolean;
    message: string;
    data?: any[];
    total?: number;
  } | null>(null);

  // Data source edit form
  const [isEditingDataSource, setIsEditingDataSource] = useState(false);
  const [isSavingDataSource, setIsSavingDataSource] = useState(false);
  const [dataSourceForm, setDataSourceForm] = useState({
    view: "",
    dataType: "",
    apiEndpoint: "",
    defaultFilter: "",
    defaultSort: "",
    pageSize: 100,
    stockItemState: null as number | null,
    summaryColumns: "",
    extraParams: "",
    requestBodyTemplate: "",
  });

  // Sync history states
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [syncHistoryTotal, setSyncHistoryTotal] = useState(0);
  const [syncHistoryPage, setSyncHistoryPage] = useState(1);
  const [isLoadingSyncHistory, setIsLoadingSyncHistory] = useState(false);
  const [selectedSyncRecord, setSelectedSyncRecord] = useState<any | null>(
    null
  );

  // Live sync logs
  const [liveSyncLogs, setLiveSyncLogs] = useState<any[]>([]);
  const [currentSyncId, setCurrentSyncId] = useState<number | null>(null);
  const liveSyncPollingRef = useRef<NodeJS.Timeout | null>(null);

  // Create data source form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    code: "",
    view: "",
    dataType: "",
    description: "",
  });

  // Delete state
  const [isDeletingDataSource, setIsDeletingDataSource] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await misaTokenApi.getStatus();
      setStatus(data);
      setIsRefreshing(data.isRefreshing);
    } catch (error) {
      console.error("Failed to fetch status:", error);
    }
  }, []);

  const fetchHistory = useCallback(async (page = 1) => {
    try {
      const data = await misaTokenApi.getHistory(page, 10);
      setHistory(data.data);
      setTotalHistory(data.total);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchStatus(), fetchHistory()]);
    setIsLoading(false);
  }, [fetchStatus, fetchHistory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Setup SSE for real-time logs
  useEffect(() => {
    if (isRefreshing) {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const url = `${baseUrl}/misa-token/logs/stream`;

      const eventSource = new EventSource(url, {
        withCredentials: false,
      });

      eventSource.onmessage = (event) => {
        try {
          const log = JSON.parse(event.data) as MisaLogEntry;
          setLogs((prev) => [...prev, log]);

          // Check if this is a final log (success or error with specific messages)
          if (log.type === "success" && log.message.includes("thành công")) {
            // Refresh completed successfully
            setTimeout(() => {
              setIsRefreshing(false);
              fetchStatus();
              fetchHistory();
              eventSource.close();
            }, 1000);
          } else if (log.type === "error") {
            // Refresh failed
            setTimeout(() => {
              setIsRefreshing(false);
              fetchStatus();
              fetchHistory();
              eventSource.close();
            }, 1000);
          }
        } catch (e) {
          console.error("Failed to parse log:", e);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        // Refresh status after SSE disconnects
        setIsRefreshing(false);
        fetchStatus();
        fetchHistory();
      };

      eventSourceRef.current = eventSource;

      return () => {
        eventSource.close();
      };
    }
  }, [isRefreshing, fetchStatus, fetchHistory]);

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Poll status while refreshing - sync with server state
  useEffect(() => {
    if (isRefreshing) {
      const interval = setInterval(async () => {
        try {
          const data = await misaTokenApi.getStatus();
          setStatus(data);
          // If server says not refreshing anymore, update local state
          if (!data.isRefreshing) {
            setIsRefreshing(false);
            fetchHistory();
          }
        } catch (error) {
          console.error("Failed to poll status:", error);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isRefreshing, fetchHistory]);

  // Load data sources when switching to data-sync tab
  useEffect(() => {
    if (activeTab === "data-sync" && dataSources.length === 0) {
      loadDataSources();
    }
  }, [activeTab]);

  const loadDataSources = async () => {
    setIsLoadingDataSources(true);
    try {
      const [sources, config] = await Promise.all([
        misaDataSourceApi.getAll(),
        misaDataSourceApi.getApiConfig(),
      ]);
      setDataSources(sources);
      setApiConfig(config);
      if (config) {
        setConfigForm({
          name: config.name || "",
          baseUrl:
            config.baseUrl ||
            "https://actapp.misa.vn/g2/api/db/v1/list/get_data",
          tenantId: config.tenantId || "",
          tenantCode: config.tenantCode || "",
          databaseId: config.databaseId || "",
          branchId: config.branchId || "",
          userId: config.userId || "",
          deviceId: config.deviceId || "",
        });
      }
    } catch (error) {
      console.error("Failed to load data sources:", error);
    } finally {
      setIsLoadingDataSources(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const saved = await misaDataSourceApi.saveApiConfig(configForm);
      setApiConfig(saved);
      setShowConfigForm(false);
      toast.success("Lưu cấu hình thành công!");
    } catch (error: any) {
      toast.error(error.message || "Không thể lưu cấu hình");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Populate form when selecting a data source
  useEffect(() => {
    if (selectedDataSource) {
      setDataSourceForm({
        view: selectedDataSource.view || "",
        dataType: selectedDataSource.dataType || "",
        apiEndpoint: selectedDataSource.apiEndpoint || "",
        defaultFilter: selectedDataSource.defaultFilter || "",
        defaultSort: selectedDataSource.defaultSort || "",
        pageSize: selectedDataSource.pageSize || 100,
        stockItemState: selectedDataSource.stockItemState,
        summaryColumns: selectedDataSource.summaryColumns || "",
        extraParams: selectedDataSource.extraParams
          ? JSON.stringify(selectedDataSource.extraParams, null, 2)
          : "",
        requestBodyTemplate: selectedDataSource.requestBodyTemplate
          ? JSON.stringify(selectedDataSource.requestBodyTemplate, null, 2)
          : "",
      });
      setIsEditingDataSource(false);
      setFetchResult(null);
      setSelectedSyncRecord(null);
      // Load sync history for this data source
      fetchSyncHistory(selectedDataSource.id, 1);
    }
  }, [selectedDataSource]);

  const handleSaveDataSource = async () => {
    if (!selectedDataSource) return;

    setIsSavingDataSource(true);
    try {
      // Parse extraParams JSON if provided
      let extraParamsJson: Record<string, any> | null = null;
      if (dataSourceForm.extraParams.trim()) {
        try {
          extraParamsJson = JSON.parse(dataSourceForm.extraParams);
        } catch (e) {
          toast.error("Extra Params không phải JSON hợp lệ");
          setIsSavingDataSource(false);
          return;
        }
      }

      // Parse requestBodyTemplate JSON if provided
      let requestBodyTemplateJson: Record<string, any> | null = null;
      if (dataSourceForm.requestBodyTemplate.trim()) {
        try {
          requestBodyTemplateJson = JSON.parse(dataSourceForm.requestBodyTemplate);
        } catch (e) {
          toast.error("Request Body Template không phải JSON hợp lệ");
          setIsSavingDataSource(false);
          return;
        }
      }

      const updateData = {
        view: dataSourceForm.view,
        dataType: dataSourceForm.dataType,
        apiEndpoint: dataSourceForm.apiEndpoint || null,
        defaultFilter: dataSourceForm.defaultFilter || null,
        defaultSort: dataSourceForm.defaultSort || null,
        pageSize: dataSourceForm.pageSize,
        stockItemState: dataSourceForm.stockItemState,
        summaryColumns: dataSourceForm.summaryColumns || null,
        extraParams: extraParamsJson,
        requestBodyTemplate: requestBodyTemplateJson,
      };

      const updated = await misaDataSourceApi.update(
        selectedDataSource.id,
        updateData
      );
      // Update in local state
      setDataSources((prev) =>
        prev.map((ds) => (ds.id === updated.id ? updated : ds))
      );
      setSelectedDataSource(updated);
      setIsEditingDataSource(false);
      toast.success("Lưu cấu hình thành công!");
    } catch (error: any) {
      toast.error(error.message || "Không thể lưu cấu hình");
    } finally {
      setIsSavingDataSource(false);
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const fetchSyncHistory = async (dataSourceId: number, page = 1) => {
    setIsLoadingSyncHistory(true);
    try {
      const result = await misaDataSourceApi.getSyncHistory(
        dataSourceId,
        page,
        10
      );
      setSyncHistory(result.data);
      setSyncHistoryTotal(result.total);
      setSyncHistoryPage(page);
    } catch (error) {
      console.error("Failed to fetch sync history:", error);
    } finally {
      setIsLoadingSyncHistory(false);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (liveSyncPollingRef.current) {
        clearInterval(liveSyncPollingRef.current);
      }
    };
  }, []);

  // Poll for live sync logs while fetching
  const pollSyncLogs = useCallback(async (dataSourceId: number) => {
    try {
      const result = await misaDataSourceApi.getSyncHistory(dataSourceId, 1, 1);
      if (result.data.length > 0) {
        const latestSync = result.data[0];
        if (latestSync.status === "running") {
          setLiveSyncLogs(latestSync.logs || []);
          setCurrentSyncId(latestSync.id);
        }
      }
    } catch (error) {
      console.error("Failed to poll sync logs:", error);
    }
  }, []);

  const handleCreateDataSource = async () => {
    if (
      !createForm.name ||
      !createForm.code ||
      !createForm.view ||
      !createForm.dataType
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setIsCreating(true);
    try {
      const newDataSource = await misaDataSourceApi.create({
        name: createForm.name,
        code: createForm.code,
        view: createForm.view,
        dataType: createForm.dataType,
        description: createForm.description || null,
      });
      setDataSources((prev) => [...prev, newDataSource]);
      setShowCreateForm(false);
      setCreateForm({
        name: "",
        code: "",
        view: "",
        dataType: "",
        description: "",
      });
      toast.success("Tạo loại dữ liệu thành công!");
    } catch (error: any) {
      toast.error(error.message || "Không thể tạo loại dữ liệu");
    } finally {
      setIsCreating(false);
    }
  };

  const handleFetchData = async () => {
    if (!selectedDataSource) return;

    setIsFetching(true);
    setFetchResult(null);
    setLiveSyncLogs([]);
    setCurrentSyncId(null);

    // Đã tắt polling live logs để giảm tải
    // const dataSourceId = selectedDataSource.id;
    // liveSyncPollingRef.current = setInterval(() => {
    //   pollSyncLogs(dataSourceId);
    // }, 1000);

    try {
      // Use startSync to save history
      const result = await misaDataSourceApi.startSync(selectedDataSource.id);
      setFetchResult(result);
      // Refresh sync history after syncing
      await fetchSyncHistory(selectedDataSource.id, 1);
    } catch (error: any) {
      setFetchResult({
        success: false,
        message: error.message || "Có lỗi xảy ra khi kéo dữ liệu",
      });
    } finally {
      // Stop polling
      if (liveSyncPollingRef.current) {
        clearInterval(liveSyncPollingRef.current);
        liveSyncPollingRef.current = null;
      }
      setIsFetching(false);
      setLiveSyncLogs([]);
      setCurrentSyncId(null);
    }
  };

  const buildCurlCommand = (dataSource: MisaDataSource) => {
    // Ưu tiên apiEndpoint của data source, sau đó mới đến baseUrl của apiConfig
    const baseUrl =
      dataSource.apiEndpoint ||
      apiConfig?.baseUrl ||
      "https://actapp.misa.vn/g2/api/db/v1/list/get_data";

    const misaContext = apiConfig
      ? {
          TenantId: apiConfig.tenantId,
          TenantCode: apiConfig.tenantCode,
          DatabaseId: apiConfig.databaseId,
          BranchId: apiConfig.branchId,
          WorkingBook: apiConfig.workingBook,
          Language: apiConfig.language,
          IncludeDependentBranch: apiConfig.includeDependentBranch,
          SessionId: "{SESSION_ID}",
          DBType: apiConfig.dbType,
          AuthType: apiConfig.authType,
          AmisSessionId: "{AMIS_SESSION_ID}",
          HasAgent: apiConfig.hasAgent,
          UserType: apiConfig.userType,
          art: apiConfig.art,
          UserId: apiConfig.userId,
          isc: apiConfig.isc,
        }
      : {
          TenantId: "{TENANT_ID}",
          TenantCode: "{TENANT_CODE}",
          DatabaseId: "{DATABASE_ID}",
          BranchId: "{BRANCH_ID}",
        };

    // Nếu có requestBodyTemplate thì ưu tiên dùng nó
    let requestBody: Record<string, any>;

    if (dataSource.requestBodyTemplate) {
      requestBody = { ...dataSource.requestBodyTemplate };
      // Override các params động
      requestBody.pageIndex = 1;
      requestBody.current_branch = apiConfig?.branchId || "{BRANCH_ID}";
      if (dataSource.pageSize) {
        requestBody.pageSize = dataSource.pageSize;
      }
    } else {
      // Fallback: build từ các trường riêng lẻ
      requestBody = {
        pageIndex: 1,
        pageSize: dataSource.pageSize,
        useSp: dataSource.useSp,
        view: dataSource.view,
        dataType: dataSource.dataType,
        isGetTotal: dataSource.isGetTotal,
        is_filter_branch: dataSource.isFilterBranch,
        current_branch: apiConfig?.branchId || "{BRANCH_ID}",
        is_multi_branch: dataSource.isMultiBranch,
        is_dependent: dataSource.isDependent,
        loadMode: dataSource.loadMode,
      };

      // Only add sort if not empty
      if (dataSource.defaultSort && dataSource.defaultSort !== "[]") {
        requestBody.sort = dataSource.defaultSort;
      }

      // Only add filter if not empty
      if (dataSource.defaultFilter && dataSource.defaultFilter !== "[]") {
        requestBody.filter = dataSource.defaultFilter;
      }

      // Add optional params if set
      if (
        dataSource.stockItemState !== null &&
        dataSource.stockItemState !== undefined
      ) {
        requestBody.stockItemState = dataSource.stockItemState;
      }
      if (dataSource.summaryColumns) {
        requestBody.summaryColumns = dataSource.summaryColumns;
      }
      // Merge extra params
      if (dataSource.extraParams) {
        Object.assign(requestBody, dataSource.extraParams);
      }
    }

    return `curl "${baseUrl}" \\
      -H "Accept: application/json, text/plain, */*" \\
      -H "Authorization: Bearer {ACCESS_TOKEN}" \\
      -H "Content-Type: application/json" \\
      -H "X-Device: ${apiConfig?.deviceId || "{DEVICE_ID}"}" \\
      -H "X-MISA-Context: ${JSON.stringify(misaContext)}" \\
      --data-raw '${JSON.stringify(requestBody, null, 2)}'`;
      };

  const handleRefresh = async () => {
    try {
      setLogs([]);
      const result = await misaTokenApi.refreshToken();
      if (result.success) {
        setIsRefreshing(true);
        await fetchStatus();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể làm mới token");
    }
  };

  const getStatusIcon = (recordStatus: string) => {
    switch (recordStatus) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (recordStatus: string) => {
    switch (recordStatus) {
      case "success":
        return "Thành công";
      case "failed":
        return "Thất bại";
      case "running":
        return "Đang chạy";
      default:
        return "Đang chờ";
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
      case "warning":
        return (
          <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
        );
      default:
        return <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("vi-VN");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Quản lý kết nối MISA
        </h1>
        <p className="text-muted-foreground mt-1">
          Quản lý kết nối và token MISA Kế toán
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("connection")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "connection"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Kết nối
          </button>
          <button
            onClick={() => setActiveTab("data-sync")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "data-sync"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Kéo dữ liệu
          </button>
        </nav>
      </div>

      {activeTab === "connection" && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Trạng thái kết nối</h2>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang làm mới...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Làm mới Token
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
                {status?.hasToken ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Token</p>
                  <p className="font-medium">
                    {status?.hasToken ? "Có sẵn" : "Chưa có"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
                {status?.isValid ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <p className="font-medium">
                    {status?.isValid ? "Hợp lệ" : "Hết hạn"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
                <Clock className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Thời gian còn lại
                  </p>
                  <p className="font-medium">
                    {status?.expiresIn != null && status.expiresIn > 0
                      ? status.expiresIn >= 60
                        ? `${Math.floor(status.expiresIn / 60)}h ${
                            status.expiresIn % 60
                          }m`
                        : `${status.expiresIn} phút`
                      : "Đã hết hạn"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
                {isRefreshing ? (
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                ) : (
                  <RefreshCw className="h-8 w-8 text-gray-400" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Hoạt động</p>
                  <p className="font-medium">
                    {isRefreshing ? "Đang làm mới" : "Sẵn sàng"}
                  </p>
                </div>
              </div>
            </div>

            {status?.lastRefreshed && (
              <p className="mt-4 text-sm text-muted-foreground">
                Làm mới lần cuối:{" "}
                {new Date(status.lastRefreshed).toLocaleString("vi-VN")}
                {" • "}Token được tự động làm mới lúc 3:00 sáng mỗi ngày.
              </p>
            )}
          </div>

          {/* Real-time Logs */}
          {isRefreshing && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">
                Logs thời gian thực
              </h2>
              <div className="bg-black/90 rounded-lg p-4 max-h-80 overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                  <p className="text-gray-400">Đang chờ logs...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2 py-1">
                      {getLogIcon(log.type)}
                      <span className="text-gray-400 text-xs">
                        {formatTime(log.timestamp)}
                      </span>
                      <span
                        className={`${
                          log.type === "error"
                            ? "text-red-400"
                            : log.type === "warning"
                            ? "text-yellow-400"
                            : log.type === "success"
                            ? "text-green-400"
                            : "text-gray-300"
                        }`}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}

          {/* History */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">
              Lịch sử làm mới token
            </h2>

            {history.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Chưa có lịch sử
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() =>
                        setExpandedRecordId(
                          expandedRecordId === record.id ? null : record.id
                        )
                      }
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(record.status)}
                        <div>
                          <p className="font-medium">
                            {getStatusText(record.status)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(record.startedAt)}
                            {record.source === "scheduled" && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                Tự động
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {record.completedAt && (
                          <span className="text-sm text-muted-foreground">
                            {Math.round(
                              (new Date(record.completedAt).getTime() -
                                new Date(record.startedAt).getTime()) /
                                1000
                            )}
                            s
                          </span>
                        )}
                        {expandedRecordId === record.id ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {expandedRecordId === record.id && (
                      <div className="border-t border-border p-4 bg-accent/30">
                        {record.errorMessage && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {record.errorMessage}
                          </div>
                        )}

                        <h4 className="font-medium mb-2 text-sm">
                          Chi tiết logs:
                        </h4>
                        <div className="bg-black/90 rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-xs">
                          {record.logs && record.logs.length > 0 ? (
                            record.logs.map((log, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-2 py-0.5"
                              >
                                {getLogIcon(log.type)}
                                <span className="text-gray-400">
                                  {formatTime(log.timestamp)}
                                </span>
                                <span
                                  className={`${
                                    log.type === "error"
                                      ? "text-red-400"
                                      : log.type === "warning"
                                      ? "text-yellow-400"
                                      : log.type === "success"
                                      ? "text-green-400"
                                      : "text-gray-300"
                                  }`}
                                >
                                  {log.message}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-400">Không có logs</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalHistory > 10 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => fetchHistory(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="text-sm text-muted-foreground">
                  Trang {currentPage} / {Math.ceil(totalHistory / 10)}
                </span>
                <button
                  onClick={() => fetchHistory(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalHistory / 10)}
                  className="px-3 py-1 border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "data-sync" && (
        <div className="space-y-6">
          {isLoadingDataSources ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* API Config Card */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Cấu hình API MISA</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Thông tin kết nối chung cho tất cả loại dữ liệu
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConfigForm(!showConfigForm)}
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    {showConfigForm ? "Đóng" : ""}
                  </button>
                </div>

                {apiConfig ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-3 bg-accent/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        Tenant Code
                      </p>
                      <p className="font-mono text-sm">
                        {apiConfig.tenantCode}
                      </p>
                    </div>
                    <div className="p-3 bg-accent/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        Database ID
                      </p>
                      <p
                        className="font-mono text-sm truncate"
                        title={apiConfig.databaseId}
                      >
                        {apiConfig.databaseId.substring(0, 8)}...
                      </p>
                    </div>
                    <div className="p-3 bg-accent/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Branch ID</p>
                      <p
                        className="font-mono text-sm truncate"
                        title={apiConfig.branchId || ""}
                      >
                        {apiConfig.branchId
                          ? `${apiConfig.branchId.substring(0, 8)}...`
                          : "-"}
                      </p>
                    </div>
                    <div className="p-3 bg-accent/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Device ID</p>
                      <p
                        className="font-mono text-sm truncate"
                        title={apiConfig.deviceId || ""}
                      >
                        {apiConfig.deviceId
                          ? `${apiConfig.deviceId.substring(0, 8)}...`
                          : "-"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Chưa có cấu hình API. Vui lòng thêm cấu hình.</p>
                  </div>
                )}

                {/* Config Form */}
                {showConfigForm && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="font-medium mb-4">Thông tin cấu hình</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Tên cấu hình
                        </label>
                        <input
                          type="text"
                          value={configForm.name}
                          onChange={(e) =>
                            setConfigForm({
                              ...configForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                          placeholder="VD: Máy May Giang Thanh"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Base URL
                        </label>
                        <input
                          type="text"
                          value={configForm.baseUrl}
                          onChange={(e) =>
                            setConfigForm({
                              ...configForm,
                              baseUrl: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Tenant ID *
                        </label>
                        <input
                          type="text"
                          value={configForm.tenantId}
                          onChange={(e) =>
                            setConfigForm({
                              ...configForm,
                              tenantId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                          placeholder="6ebc3231-2321-45a0-9f8d-..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Tenant Code *
                        </label>
                        <input
                          type="text"
                          value={configForm.tenantCode}
                          onChange={(e) =>
                            setConfigForm({
                              ...configForm,
                              tenantCode: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                          placeholder="A14Y2GY3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Database ID *
                        </label>
                        <input
                          type="text"
                          value={configForm.databaseId}
                          onChange={(e) =>
                            setConfigForm({
                              ...configForm,
                              databaseId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                          placeholder="577bee30-2251-4951-a02c-..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Branch ID
                        </label>
                        <input
                          type="text"
                          value={configForm.branchId}
                          onChange={(e) =>
                            setConfigForm({
                              ...configForm,
                              branchId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                          placeholder="b1a5e27b-52e6-4fe3-ab56-..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          User ID
                        </label>
                        <input
                          type="text"
                          value={configForm.userId}
                          onChange={(e) =>
                            setConfigForm({
                              ...configForm,
                              userId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                          placeholder="49e28237-d88a-4f5b-..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Device ID
                        </label>
                        <input
                          type="text"
                          value={configForm.deviceId}
                          onChange={(e) =>
                            setConfigForm({
                              ...configForm,
                              deviceId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                          placeholder="f8a424f18b6f1eba5be94c1f97e6c189"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleSaveConfig}
                        disabled={
                          isSavingConfig ||
                          !configForm.tenantId ||
                          !configForm.tenantCode ||
                          !configForm.databaseId
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingConfig ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Lưu cấu hình
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Content - Sidebar + Detail Layout */}
              <div className="flex gap-6">
                {/* Sidebar - Data Sources List */}
                <div className="w-50 flex-shrink-0">
                  <div className="bg-card border border-border rounded-lg overflow-hidden sticky top-6">
                    {/* Header */}
                    <div className="p-4 border-b border-border bg-accent/30">
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Loại dữ liệu</h2>
                        <button
                          onClick={() => setShowCreateForm(!showCreateForm)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            showCreateForm
                              ? "bg-red-100 text-red-600 hover:bg-red-200"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }`}
                          title={showCreateForm ? "Đóng" : "Thêm mới"}
                        >
                          {showCreateForm ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Create Form - Inline */}
                    {showCreateForm && (
                      <div className="p-4 border-b border-border bg-accent/20">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium mb-1 text-muted-foreground">
                              Tên hiển thị *
                            </label>
                            <input
                              type="text"
                              value={createForm.name}
                              onChange={(e) =>
                                setCreateForm({
                                  ...createForm,
                                  name: e.target.value,
                                })
                              }
                              className="w-full px-3 py-1.5 border border-border rounded-lg bg-background text-sm"
                              placeholder="VD: Khách hàng"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1 text-muted-foreground">
                              Mã code *
                            </label>
                            <input
                              type="text"
                              value={createForm.code}
                              onChange={(e) =>
                                setCreateForm({
                                  ...createForm,
                                  code: e.target.value
                                    .toLowerCase()
                                    .replace(/\s/g, "_"),
                                })
                              }
                              className="w-full px-3 py-1.5 border border-border rounded-lg bg-background font-mono text-sm"
                              placeholder="VD: customer"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1 text-muted-foreground">
                              View MISA *
                            </label>
                            <input
                              type="text"
                              value={createForm.view}
                              onChange={(e) =>
                                setCreateForm({
                                  ...createForm,
                                  view: e.target.value,
                                })
                              }
                              className="w-full px-3 py-1.5 border border-border rounded-lg bg-background font-mono text-sm"
                              placeholder="view_account_object_customer"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1 text-muted-foreground">
                              Data Type *
                            </label>
                            <input
                              type="text"
                              value={createForm.dataType}
                              onChange={(e) =>
                                setCreateForm({
                                  ...createForm,
                                  dataType: e.target.value,
                                })
                              }
                              className="w-full px-3 py-1.5 border border-border rounded-lg bg-background font-mono text-sm"
                              placeholder="di_customer"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1 text-muted-foreground">
                              Mô tả
                            </label>
                            <input
                              type="text"
                              value={createForm.description}
                              onChange={(e) =>
                                setCreateForm({
                                  ...createForm,
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-3 py-1.5 border border-border rounded-lg bg-background text-sm"
                              placeholder="Mô tả ngắn"
                            />
                          </div>
                          <button
                            onClick={handleCreateDataSource}
                            disabled={isCreating}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
                          >
                            {isCreating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                            Tạo loại dữ liệu
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Data Sources List */}
                    <div className="max-h-[500px] overflow-y-auto">
                      {dataSources.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8 text-sm">
                          Chưa có loại dữ liệu nào
                        </p>
                      ) : (
                        dataSources.map((source) => (
                          <div
                            key={source.id}
                            onClick={() => setSelectedDataSource(source)}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-l-2 ${
                              selectedDataSource?.id === source.id
                                ? "border-l-primary bg-primary/5"
                                : "border-l-transparent hover:bg-accent/50"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-medium text-sm truncate ${
                                  selectedDataSource?.id === source.id
                                    ? "text-primary"
                                    : ""
                                }`}
                              >
                                {source.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {source.dataType}
                              </p>
                            </div>
                            <ChevronRight
                              className={`h-4 w-4 text-muted-foreground transition-transform ${
                                selectedDataSource?.id === source.id
                                  ? "text-primary"
                                  : ""
                              }`}
                            />
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-border bg-accent/20">
                      <p className="text-xs text-muted-foreground text-center">
                        {dataSources.length} loại dữ liệu
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detail Panel */}
                <div className="flex-1 min-w-0">
                  {!selectedDataSource ? (
                    <div className="bg-card border border-border rounded-lg p-12 text-center">
                      <Database className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">
                        Chọn loại dữ liệu
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Chọn một loại dữ liệu từ danh sách bên trái để xem chi
                        tiết và cấu hình
                      </p>
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <h2 className="text-lg font-semibold">
                              Cấu hình {selectedDataSource.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              Cấu hình API riêng cho loại dữ liệu này
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isEditingDataSource ? (
                            <button
                              onClick={() => setIsEditingDataSource(true)}
                              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => setIsEditingDataSource(false)}
                                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={handleSaveDataSource}
                                disabled={isSavingDataSource}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                              >
                                {isSavingDataSource ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                                Lưu
                              </button>
                            </>
                          )}
                          <button
                            onClick={handleFetchData}
                            disabled={isFetching || isEditingDataSource}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isFetching ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Config Form - chỉ hiện khi bấm nút Chỉnh sửa (cấu hình) */}
                      {isEditingDataSource && (
                        <div className="space-y-4 mb-6">
                          <div className="grid grid-cols-1 md-grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                View *
                              </label>
                              <input
                                type="text"
                                value={dataSourceForm.view}
                                onChange={(e) =>
                                  setDataSourceForm({
                                    ...dataSourceForm,
                                    view: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                                placeholder="view_account_object_customer"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Data Type *
                              </label>
                              <input
                                type="text"
                                value={dataSourceForm.dataType}
                                onChange={(e) =>
                                  setDataSourceForm({
                                    ...dataSourceForm,
                                    dataType: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                                placeholder="di_customer"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Page Size
                              </label>
                              <input
                                type="number"
                                value={dataSourceForm.pageSize}
                                onChange={(e) =>
                                  setDataSourceForm({
                                    ...dataSourceForm,
                                    pageSize: parseInt(e.target.value) || 100,
                                  })
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              API Endpoint
                            </label>
                            <input
                              type="text"
                              value={dataSourceForm.apiEndpoint}
                              onChange={(e) =>
                                setDataSourceForm({
                                  ...dataSourceForm,
                                  apiEndpoint: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                              placeholder="https://your-misa-url/g2/api/db/v1/list/get_data"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Default Filter (JSON)
                            </label>
                            <textarea
                              value={dataSourceForm.defaultFilter}
                              onChange={(e) =>
                                setDataSourceForm({
                                  ...dataSourceForm,
                                  defaultFilter: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm h-24"
                              placeholder='[["is_customer","=",true],"and",["is_employee","=",false]]'
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Default Sort (JSON)
                            </label>
                            <textarea
                              value={dataSourceForm.defaultSort}
                              onChange={(e) =>
                                setDataSourceForm({
                                  ...dataSourceForm,
                                  defaultSort: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm h-20"
                              placeholder='[{"property":"account_object_code","desc":false}]'
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Stock Item State
                              </label>
                              <input
                                type="number"
                                value={dataSourceForm.stockItemState ?? ""}
                                onChange={(e) =>
                                  setDataSourceForm({
                                    ...dataSourceForm,
                                    stockItemState:
                                      e.target.value === ""
                                        ? null
                                        : parseInt(e.target.value),
                                  })
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                                placeholder="-1 (tất cả)"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Dùng cho Sản phẩm: -1 = tất cả
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Summary Columns
                              </label>
                              <input
                                type="text"
                                value={dataSourceForm.summaryColumns}
                                onChange={(e) =>
                                  setDataSourceForm({
                                    ...dataSourceForm,
                                    summaryColumns: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                                placeholder=",closing_amount"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Dùng cho Sản phẩm
                              </p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Extra Params (JSON)
                            </label>
                            <textarea
                              value={dataSourceForm.extraParams}
                              onChange={(e) =>
                                setDataSourceForm({
                                  ...dataSourceForm,
                                  extraParams: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm h-32"
                              placeholder='{"isPostToManagementBook": 0, "isIncludeDependentBranch": false, "isFilter": false}'
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Các params bổ sung sẽ được merge vào request body
                            </p>
                          </div>

                          {/* Request Body Template - Full JSON body */}
                          <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">
                              Request Body Template (JSON)
                              <span className="text-xs text-blue-500 ml-2">
                                ⭐ Ưu tiên nếu có
                              </span>
                            </label>
                            <textarea
                              value={dataSourceForm.requestBodyTemplate}
                              onChange={(e) =>
                                setDataSourceForm({
                                  ...dataSourceForm,
                                  requestBodyTemplate: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm h-48"
                              placeholder={`{
  "sort": "[{\\"property\\":3972,\\"desc\\":true}]",
  "filter": [...],
  "pageIndex": 1,
  "pageSize": 20,
  "useSp": false,
  "view": 22,
  "summaryColumns": [5127, 5126],
  "loadMode": 2
}`}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Nếu có, sẽ dùng làm request body thay vì build từ các trường riêng lẻ.
                              Các trường <code>pageIndex</code>, <code>current_branch</code>, <code>pageSize</code> sẽ được override tự động.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* CURL Command */}
                      <div>
                        <div className="flex items-center justify-between mb-2 mt-6">
                          <p className="text-sm font-medium">CURL Command</p>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                buildCurlCommand(selectedDataSource),
                                "curl"
                              )
                            }
                            className="flex items-center gap-1 px-3 py-1 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
                          >
                            {copiedField === "curl" ? (
                              <>
                                <Check className="h-4 w-4 text-green-500" />
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-4 bg-black/90 text-green-400 rounded-lg text-xs font-mono overflow-x-auto max-h-96">
                          {buildCurlCommand(selectedDataSource)}
                        </pre>
                      </div>

                      {/* Live Sync Logs - hiển thị khi đang fetch */}
                      {isFetching && (
                        <div className="mt-6 pt-6 border-t border-border">
                          <div className="flex items-center gap-2 mb-4">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <h3 className="font-medium">Đang kéo dữ liệu...</h3>
                          </div>
                          <div className="bg-black/90 rounded-lg p-4 max-h-60 overflow-y-auto font-mono text-sm">
                            {liveSyncLogs.length === 0 ? (
                              <p className="text-gray-400">Đang khởi tạo...</p>
                            ) : (
                              liveSyncLogs.map((log, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 py-1"
                                >
                                  {log.type === "error" ? (
                                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                  ) : log.type === "warning" ? (
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                  ) : log.type === "success" ? (
                                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                  )}
                                  <span className="text-gray-400 text-xs">
                                    {new Date(log.timestamp).toLocaleTimeString(
                                      "vi-VN"
                                    )}
                                  </span>
                                  <span
                                    className={`${
                                      log.type === "error"
                                        ? "text-red-400"
                                        : log.type === "warning"
                                        ? "text-yellow-400"
                                        : log.type === "success"
                                        ? "text-green-400"
                                        : "text-gray-300"
                                    }`}
                                  >
                                    {log.message}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Fetch Results */}
                      {fetchResult && (
                        <div className="mt-6 pt-6 border-t border-border">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">Kết quả kéo dữ liệu</h3>
                            {fetchResult.success &&
                              fetchResult.total !== undefined && (
                                <span className="text-sm text-muted-foreground">
                                  Tổng: {fetchResult.total} bản ghi
                                </span>
                              )}
                          </div>

                          {!fetchResult.success ? (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                              <div className="flex items-center gap-2">
                                <XCircle className="h-5 w-5" />
                                <span>{fetchResult.message}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-5 w-5" />
                                  <span>{fetchResult.message}</span>
                                </div>
                              </div>

                              {Array.isArray(fetchResult.data) &&
                                fetchResult.data.length > 0 &&
                                (() => {
                                  // Collect all unique keys from all records
                                  const allKeys = Array.from(
                                    new Set(
                                      fetchResult.data.flatMap((item) =>
                                        Object.keys(item)
                                      )
                                    )
                                  );
                                  return (
                                    <>
                                      <div className="overflow-x-auto max-h-[500px] border border-border rounded-lg">
                                        <table className="text-sm min-w-full">
                                          <thead className="bg-accent sticky top-0">
                                            <tr>
                                              <th className="px-3 py-2 text-left font-medium border-b border-border whitespace-nowrap bg-accent">
                                                #
                                              </th>
                                              {allKeys.map((key) => (
                                                <th
                                                  key={key}
                                                  className="px-3 py-2 text-left font-medium border-b border-border whitespace-nowrap bg-accent"
                                                >
                                                  {key}
                                                </th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {fetchResult.data.map(
                                              (item, index) => (
                                                <tr
                                                  key={index}
                                                  className="hover:bg-accent/50"
                                                >
                                                  <td className="px-3 py-2 border-b border-border whitespace-nowrap">
                                                    {index + 1}
                                                  </td>
                                                  {allKeys.map((key) => (
                                                    <td
                                                      key={key}
                                                      className="px-3 py-2 border-b border-border whitespace-nowrap max-w-[300px] truncate"
                                                      title={String(
                                                        item[key] ?? ""
                                                      )}
                                                    >
                                                      {item[key] !== null &&
                                                      item[key] !== undefined
                                                        ? String(item[key])
                                                        : "-"}
                                                    </td>
                                                  ))}
                                                </tr>
                                              )
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-2">
                                        Hiển thị {fetchResult.data.length} bản
                                        ghi, {allKeys.length} cột
                                      </p>
                                    </>
                                  );
                                })()}

                              {Array.isArray(fetchResult.data) &&
                                fetchResult.data.length === 0 && (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    Không có dữ liệu
                                  </p>
                                )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sync History Section */}
                      <div className="mt-6 pt-6 border-t border-border">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Lịch sử kéo dữ liệu
                          </h3>
                          <span className="text-sm text-muted-foreground">
                            Tổng: {syncHistoryTotal} lần
                          </span>
                        </div>

                        {isLoadingSyncHistory ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : syncHistory.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Chưa có lịch sử kéo dữ liệu
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {syncHistory.map((record) => (
                              <div
                                key={record.id}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                  selectedSyncRecord?.id === record.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() =>
                                  setSelectedSyncRecord(
                                    selectedSyncRecord?.id === record.id
                                      ? null
                                      : record
                                  )
                                }
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {record.status === "success" ? (
                                      <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : record.status === "failed" ? (
                                      <XCircle className="h-5 w-5 text-red-500" />
                                    ) : record.status === "running" ? (
                                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                                    ) : (
                                      <Clock className="h-5 w-5 text-yellow-500" />
                                    )}
                                    <div>
                                      <p className="font-medium text-sm">
                                        {record.status === "success"
                                          ? "Thành công"
                                          : record.status === "failed"
                                          ? "Thất bại"
                                          : record.status === "running"
                                          ? "Đang chạy"
                                          : "Chờ xử lý"}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(
                                          record.createdAt
                                        ).toLocaleString("vi-VN")}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">
                                      {record.syncedRecords || 0} bản ghi:{" "}
                                      {record.createdRecords || 0} mới,{" "}
                                      {record.updatedRecords || 0} cập nhật,{" "}
                                      {record.unchangedRecords || 0} không đổi
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {record.source === "manual"
                                        ? "Thủ công"
                                        : "Tự động"}
                                    </p>
                                  </div>
                                </div>

                                {/* Expanded details */}
                                {selectedSyncRecord?.id === record.id && (
                                  <div className="mt-4 pt-4 border-t border-border space-y-4">
                                    {record.errorMessage && (
                                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        <strong>Lỗi:</strong>{" "}
                                        {record.errorMessage}
                                      </div>
                                    )}

                                    {/* Logs */}
                                    {record.logs && record.logs.length > 0 && (
                                      <div>
                                        <p className="text-sm font-medium mb-2">
                                          Logs:
                                        </p>
                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                          {record.logs.map(
                                            (log: any, idx: number) => (
                                              <div
                                                key={idx}
                                                className={`text-xs p-2 rounded ${
                                                  log.type === "error"
                                                    ? "bg-red-50 text-red-700"
                                                    : log.type === "success"
                                                    ? "bg-green-50 text-green-700"
                                                    : log.type === "warning"
                                                    ? "bg-yellow-50 text-yellow-700"
                                                    : "bg-accent text-foreground"
                                                }`}
                                              >
                                                <span className="text-muted-foreground">
                                                  {new Date(
                                                    log.timestamp
                                                  ).toLocaleTimeString("vi-VN")}
                                                </span>
                                                {" - "}
                                                {log.message}
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Request */}
                                    {record.lastRequest && (
                                      <details
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                                          Xem Request
                                        </summary>
                                        <pre className="mt-2 p-3 bg-black/90 text-green-400 rounded-lg text-xs font-mono overflow-x-auto max-h-60">
                                          {JSON.stringify(
                                            record.lastRequest,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </details>
                                    )}

                                    {/* Response Data */}
                                    {record.lastResponseSample && (
                                      <details
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                                          Xem Response (
                                          {record.lastResponseSample.count ||
                                            record.lastResponseSample
                                              .sampleCount ||
                                            0}{" "}
                                          bản ghi)
                                        </summary>
                                        <pre className="mt-2 p-3 bg-black/90 text-green-400 rounded-lg text-xs font-mono overflow-x-auto max-h-[400px]">
                                          {JSON.stringify(
                                            record.lastResponseSample,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </details>
                                    )}

                                    {/* Chi tiết thay đổi */}
                                    {record.changedDetails &&
                                      (record.changedDetails.created?.length >
                                        0 ||
                                        record.changedDetails.updated?.length >
                                          0) && (
                                        <div className="space-y-4">
                                          {/* Bản ghi mới */}
                                          {record.changedDetails.created
                                            ?.length > 0 && (
                                            <details
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            >
                                              <summary className="cursor-pointer text-sm font-medium text-green-600 hover:text-green-700">
                                                Bản ghi mới (
                                                {
                                                  record.changedDetails.created
                                                    .length
                                                }
                                                )
                                              </summary>
                                              <div className="mt-2 space-y-1 max-h-[300px] overflow-y-auto">
                                                {record.changedDetails.created.map(
                                                  (item: any, idx: number) => (
                                                    <div
                                                      key={idx}
                                                      className="text-xs p-2 bg-green-50 rounded flex gap-2"
                                                    >
                                                      <span className="font-mono font-medium">
                                                        {item.code}
                                                      </span>
                                                      <span className="text-muted-foreground">
                                                        -
                                                      </span>
                                                      <span>{item.name}</span>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </details>
                                          )}

                                          {/* Bản ghi cập nhật */}
                                          {record.changedDetails.updated
                                            ?.length > 0 && (
                                            <details
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            >
                                              <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
                                                Bản ghi cập nhật (
                                                {
                                                  record.changedDetails.updated
                                                    .length
                                                }
                                                )
                                              </summary>
                                              <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto">
                                                {record.changedDetails.updated.map(
                                                  (item: any, idx: number) => (
                                                    <div
                                                      key={idx}
                                                      className="text-xs p-2 bg-blue-50 rounded"
                                                    >
                                                      <div className="flex gap-2 mb-1">
                                                        <span className="font-mono font-medium">
                                                          {item.code}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                          -
                                                        </span>
                                                        <span>{item.name}</span>
                                                      </div>
                                                      <div className="pl-2 border-l-2 border-blue-200 space-y-1">
                                                        {Object.entries(
                                                          item.changes
                                                        ).map(
                                                          ([field, change]: [
                                                            string,
                                                            any
                                                          ]) => (
                                                            <div
                                                              key={field}
                                                              className="flex items-start gap-2"
                                                            >
                                                              <span className="font-medium text-blue-700 min-w-[120px]">
                                                                {field}:
                                                              </span>
                                                              <span className="text-red-500 line-through">
                                                                {typeof change.old ===
                                                                "object"
                                                                  ? JSON.stringify(
                                                                      change.old
                                                                    )
                                                                  : String(
                                                                      change.old ??
                                                                        "(trống)"
                                                                    )}
                                                              </span>
                                                              <span className="text-muted-foreground">
                                                                →
                                                              </span>
                                                              <span className="text-green-600">
                                                                {typeof change.new ===
                                                                "object"
                                                                  ? JSON.stringify(
                                                                      change.new
                                                                    )
                                                                  : String(
                                                                      change.new ??
                                                                        "(trống)"
                                                                    )}
                                                              </span>
                                                            </div>
                                                          )
                                                        )}
                                                      </div>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </details>
                                          )}
                                        </div>
                                      )}
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Pagination */}
                            {syncHistoryTotal > 10 && (
                              <div className="flex items-center justify-center gap-2 pt-4">
                                <button
                                  onClick={() =>
                                    fetchSyncHistory(
                                      selectedDataSource!.id,
                                      syncHistoryPage - 1
                                    )
                                  }
                                  disabled={syncHistoryPage === 1}
                                  className="px-3 py-1 text-sm border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Trước
                                </button>
                                <span className="text-sm text-muted-foreground">
                                  Trang {syncHistoryPage} /{" "}
                                  {Math.ceil(syncHistoryTotal / 10)}
                                </span>
                                <button
                                  onClick={() =>
                                    fetchSyncHistory(
                                      selectedDataSource!.id,
                                      syncHistoryPage + 1
                                    )
                                  }
                                  disabled={
                                    syncHistoryPage >=
                                    Math.ceil(syncHistoryTotal / 10)
                                  }
                                  className="px-3 py-1 text-sm border border-border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Sau
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
