import { useState, useEffect } from "react";
import { historyApi, yearsApi } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import Skeleton from "./Skeleton";
import {
  History as HistoryIcon,
  User,
  Calendar,
  Clock,
  Eye,
  Filter,
  RefreshCw,
  Activity,
  ChevronRight,
} from "lucide-react";

function History({ currentYear, isLoading: parentLoading = false }) {
  const { isAuthenticated } = useAuth();
  const [historyData, setHistoryData] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("all"); // 'all', 'contributor', 'expense', 'game', 'winner'
  const [filterAction, setFilterAction] = useState("all"); // 'all', 'create', 'update', 'delete'

  // Load history data
  useEffect(() => {
    const loadHistory = async () => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);

        // Get year record first
        const yearRecord = await yearsApi.getByYear(currentYear);
        if (!yearRecord) {
          setHistoryData([]);
          setFilteredHistory([]);
          return;
        }

        // Get history data
        const history = await historyApi.getByYear(yearRecord.id);
        setHistoryData(history);
        setFilteredHistory(history);
      } catch (err) {
        console.error("Failed to load history:", err);
        setError("Failed to load history data");
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [currentYear, isAuthenticated]);

  // Filter history based on selected filters
  useEffect(() => {
    let filtered = [...historyData];

    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.entity_type === filterType);
    }

    if (filterAction !== "all") {
      filtered = filtered.filter((item) => item.action === filterAction);
    }

    setFilteredHistory(filtered);
  }, [historyData, filterType, filterAction]);

  // Refresh history data
  const refreshHistory = async () => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const yearRecord = await yearsApi.getByYear(currentYear);
        if (yearRecord) {
          const history = await historyApi.getByYear(yearRecord.id);
          setHistoryData(history);
          setFilteredHistory(history);
        }
      } catch (err) {
        console.error("Failed to refresh history:", err);
      } finally {
        setIsLoading(false);
      }
    };
    await loadHistory();
  };

  // Get color for action type
  const getActionColor = (action) => {
    switch (action) {
      case "create":
        return "bg-green-50 border-green-200 text-green-800";
      case "update":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "delete":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString();
  };

  // Get user initials for avatar
  const getUserInitials = (email) => {
    if (!email) return "U";
    const parts = email.split("@")[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Group activities by time periods
  const groupActivitiesByTime = (activities) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: []
    };

    activities.forEach(activity => {
      const activityDate = new Date(activity.created_at);
      const activityDay = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());

      if (activityDay.getTime() === today.getTime()) {
        groups.today.push(activity);
      } else if (activityDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(activity);
      } else if (activityDay >= weekAgo) {
        groups.thisWeek.push(activity);
      } else {
        groups.earlier.push(activity);
      }
    });

    return groups;
  };

  // Get group label and icon
  const getGroupInfo = (groupKey) => {
    switch (groupKey) {
      case "today":
        return { label: "Today", icon: Activity };
      case "yesterday":
        return { label: "Yesterday", icon: Clock };
      case "thisWeek":
        return { label: "This Week", icon: Calendar };
      case "earlier":
        return { label: "Earlier", icon: HistoryIcon };
      default:
        return { label: "Unknown", icon: HistoryIcon };
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HistoryIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600">
            Please sign in to view the activity history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <HistoryIcon className="h-6 w-6" />
            Activity History
          </h2>
          <p className="text-gray-600">
            Track all activities and changes for {currentYear}
          </p>
        </div>

        <button
          onClick={refreshHistory}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-fit"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="contributor">Contributors</option>
              <option value="expense">Expenses</option>
              <option value="game">Games</option>
              <option value="winner">Winners</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Action
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="create">Added</option>
              <option value="update">Updated</option>
              <option value="delete">Deleted</option>
            </select>
          </div>
        </div>

        {(filterType !== "all" || filterAction !== "all") && (
          <div className="mt-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Showing {filteredHistory.length} of {historyData.length} activities
            </span>
            <button
              onClick={() => {
                setFilterType("all");
                setFilterAction("all");
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* History Timeline */}
      <div className="space-y-6">
        {error && (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <h3 className="font-bold">Error</h3>
              <p>{error}</p>
            </div>
            <button
              onClick={refreshHistory}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading || parentLoading ? (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="space-y-6">
              {[...Array(3)].map((_, groupIndex) => (
                <div key={groupIndex} className="space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white rounded-lg border p-4 shadow-sm">
                        <div className="flex items-start gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <HistoryIcon className="text-gray-400 h-16 w-16 mb-4 mx-auto" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Activity Yet
            </h3>
            <p className="text-gray-500">
              {filterType !== "all" || filterAction !== "all"
                ? "No activities match your current filters."
                : "Activity will appear here as users make changes."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupActivitiesByTime(filteredHistory)).map(([groupKey, activities]) => {
              if (activities.length === 0) return null;

              const { label, icon: GroupIcon } = getGroupInfo(groupKey);

              return (
                <div key={groupKey} className="space-y-3">
                  {/* Group Header */}
                  <div className="flex items-center gap-2">
                    <GroupIcon className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {activities.length}
                    </span>
                  </div>

                  {/* Group Activities */}
                  <div className="space-y-3">
                    {activities.map((activity, index) => (
                      <div
                        key={activity.id || index}
                        className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            {/* User Avatar */}
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {getUserInitials(activity.user_email)}
                              </div>
                            </div>

                            {/* Activity Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  {/* Action Badge and Description */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                                      <span className="capitalize">{activity.action}d</span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {activity.entity_type}
                                    </span>
                                  </div>

                                  {/* Description */}
                                  <p className="text-gray-900 leading-relaxed mb-3">
                                    {activity.description}
                                  </p>

                                  {/* Metadata */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs text-gray-500">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <User className="h-3.5 w-3.5 flex-shrink-0" />
                                      <span className="truncate">{activity.user_email}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                      <span className="whitespace-nowrap">{formatRelativeTime(activity.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                      <span className="whitespace-nowrap">{new Date(activity.created_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Action Arrow */}
                                <div className="flex-shrink-0 ml-4">
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
