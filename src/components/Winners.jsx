import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Medal,
  Award,
  Gamepad2,
  X,
  Eye,
  Check,
  Clock,
  ChevronDown,
} from "lucide-react";
import { winnersApi } from "../lib/api.js";
import { useAuth } from "../contexts/AuthContext";
import Skeleton from "./Skeleton";
import Modal from "./Modal";

function Winners({ data, refreshData, currentYear, isLoading = false }) {
  const { isAdmin } = useAuth();
  const [viewingGameId, setViewingGameId] = useState(null);
  const [viewingPrizeId, setViewingPrizeId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  // Use data from props instead of loading separately
  const { games = [], winners = {}, expenses = [] } = data || {};

  const loadData = useCallback(async () => {
    try {
      // This function will trigger a refresh of data from the parent
      if (refreshData) {
        await refreshData();
      }
    } catch (err) {
      console.error("Error loading winners data:", err);
    }
  }, [refreshData]);

  // Only load data if not provided via props
  useEffect(() => {
    if (!data || Object.keys(data).length === 0) {
      loadData();
    }
  }, [currentYear, data, loadData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.dropdown-container')) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Get prize for a specific position in a game
  const getPrizeForPosition = (game, position) => {
    if (!game?.prizeIds) return null;

    const prizeId =
      position === "1st"
        ? game.prizeIds.first
        : position === "2nd"
        ? game.prizeIds.second
        : position === "3rd"
        ? game.prizeIds.third
        : null;

    return expenses.find((expense) => expense.id === prizeId);
  };

  // Toggle prize given status
  const togglePrizeGiven = async (winnerId) => {
    try {
      // Find the winner in current state
      let winnerToUpdate = null;

      for (const gameWinners of Object.values(winners)) {
        const winner = gameWinners.find(w => w.id === winnerId);
        if (winner) {
          winnerToUpdate = winner;
          break;
        }
      }

      if (!winnerToUpdate) {
        console.error("Winner not found");
        return;
      }

      const newPrizeGiven = !winnerToUpdate.prize_given;

      // Update in database
      await winnersApi.togglePrizeGiven(winnerId, newPrizeGiven);

      // Refresh data from parent to get updated state
      if (refreshData) {
        await refreshData();
      }
    } catch (err) {
      console.error("Error updating prize status:", err);
    }
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case "1st":
        return <Medal className="h-4 w-4 text-yellow-600" />;
      case "2nd":
        return <Medal className="h-4 w-4 text-gray-600" />;
      case "3rd":
        return <Medal className="h-4 w-4 text-blue-600" />;
      case "Participation":
        return <Award className="h-4 w-4 text-blue-600" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };


  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Winners List
            </div>
          </h2>
          <p className="text-gray-600 mt-1">Pongal {currentYear}</p>
          <p className="text-gray-600 mt-2">
            View winners and prizes for each game
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-3">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Games & Winners
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="p-4 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 3 }, (_, j) => (
                    <div key={j} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-24 mb-1" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <Skeleton className="h-3 w-20 mb-1" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : games.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {games.map((game) => {
              const gameWinners = winners[game.id] || [];
              const sortedWinners = gameWinners.sort((a, b) => {
                const positionOrder = {
                  "1st": 1,
                  "2nd": 2,
                  "3rd": 3,
                  Participation: 4,
                  Other: 5,
                };
                return (
                  (positionOrder[a.position] || 5) -
                  (positionOrder[b.position] || 5)
                );
              });

              return (
                <div
                  key={game.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-yellow-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-lg truncate">
                        {game.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Organized by {game.organizer}
                      </p>
                    </div>
                    <button
                      onClick={() => setViewingGameId(game.id)}
                      className="ml-2 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all flex-shrink-0"
                      title="View all winners"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  {gameWinners.length > 0 ? (
                    <div className="space-y-2">
                      {sortedWinners.slice(0, 3).map((winner) => {
                        const prize = getPrizeForPosition(
                          game,
                          winner.position
                        );
                        const isPrizeGiven = winner.prize_given || false;
                        return (
                          <div
                            key={winner.id}
                            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all group"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                {getPositionIcon(winner.position)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div
                                  onClick={() => setViewingPrizeId(winner.id)}
                                  className="cursor-pointer"
                                >
                                  <p className="font-medium text-gray-900 truncate">
                                    {winner.name}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {winner.position} Place
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                              <div className="text-right sm:text-right flex-1">
                                {prize ? (
                                  <div className="text-xs">
                                    <p className="font-medium text-gray-900 truncate max-w-32 sm:max-w-20">
                                      {prize.item}
                                    </p>
                                    <p className="text-green-600">
                                      ₹{prize.amount.toLocaleString()}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500">
                                    {winner.prize || "Prize"}
                                  </p>
                                )}
                              </div>
                              <div className="relative dropdown-container">
                                {isAdmin ? (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDropdownOpen(dropdownOpen === winner.id ? null : winner.id);
                                      }}
                                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border transition-all hover:shadow-sm ${
                                        isPrizeGiven
                                          ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                                          : "bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
                                      }`}
                                    >
                                      {isPrizeGiven ? "Prize Given" : "Pending"}
                                      <ChevronDown className="h-3 w-3" />
                                    </button>

                                    {dropdownOpen === winner.id && (
                                      <div className="absolute right-0 top-full mt-1 w-24 bg-white border border-gray-200 rounded-md shadow-lg z-10 dropdown-container">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDropdownOpen(null);
                                            if (!isPrizeGiven) {
                                              togglePrizeGiven(winner.id);
                                            }
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 text-green-700"
                                        >
                                          <Check className="h-3 w-3" />
                                          Prize Given
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDropdownOpen(null);
                                            if (isPrizeGiven) {
                                              togglePrizeGiven(winner.id);
                                            }
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 text-amber-700"
                                        >
                                          <Clock className="h-3 w-3" />
                                          Pending
                                        </button>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border ${
                                      isPrizeGiven
                                        ? "bg-green-100 border-green-300 text-green-800"
                                        : "bg-amber-100 border-amber-300 text-amber-800"
                                    }`}
                                  >
                                    {isPrizeGiven ? "Prize Given" : "Pending"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {gameWinners.length > 3 && (
                        <div className="text-center py-2">
                          <button
                            onClick={() => setViewingGameId(game.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            +{gameWinners.length - 3} more winners
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <Trophy className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm">No winners yet</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Gamepad2 className="text-gray-400 h-16 w-16 mb-4 mx-auto" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No games available
            </h3>
            <p className="text-gray-500">Create games first to view winners.</p>
          </div>
        )}
      </div>

      {/* Game Winners Modal */}
      <Modal
        isOpen={!!viewingGameId}
        onClose={() => setViewingGameId(null)}
        title="Game Winners"
      >
        {viewingGameId && (() => {
          const viewingGame = games.find((g) => g.id === viewingGameId);
          const gameWinners = winners[viewingGameId] || [];
          if (!viewingGame) return null;

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {viewingGame.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {gameWinners.length} winner{gameWinners.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {gameWinners.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {gameWinners
                    .sort((a, b) => {
                      const positionOrder = {
                        "1st": 1,
                        "2nd": 2,
                        "3rd": 3,
                        Participation: 4,
                        Other: 5,
                      };
                      return (
                        (positionOrder[a.position] || 5) -
                        (positionOrder[b.position] || 5)
                      );
                    })
                    .map((winner) => {
                      const prize = getPrizeForPosition(
                        viewingGame,
                        winner.position
                      );
                      const isPrizeGiven = winner.prize_given || false;
                      return (
                        <div
                          key={winner.id}
                          className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-yellow-200 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex-shrink-0 p-2 bg-yellow-100 rounded-full">
                              {getPositionIcon(winner.position)}
                            </div>
                            <div
                              onClick={() => {
                                setViewingGameId(null);
                                setViewingPrizeId(winner.id);
                              }}
                              className="cursor-pointer"
                            >
                              <p className="font-semibold text-gray-900">
                                {winner.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {winner.position} Place
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              {prize ? (
                                <div className="flex items-center gap-2">
                                  {prize.image && (
                                    <img
                                      src={prize.image}
                                      alt=""
                                      className="w-8 h-8 object-cover rounded border"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {prize.item}
                                    </p>
                                    <p className="text-sm text-green-600">
                                      ₹{prize.amount.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-gray-500">
                                  {winner.prize || "Prize not specified"}
                                </p>
                              )}
                            </div>
                            {isAdmin ? (
                              <select
                                value={isPrizeGiven ? "given" : "pending"}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const newStatus = e.target.value === "given";
                                  if (newStatus !== isPrizeGiven) {
                                    togglePrizeGiven(winner.id);
                                  }
                                }}
                                className={`text-xs font-medium px-2 py-1 rounded border transition-colors ${
                                  isPrizeGiven
                                    ? "bg-green-100 border-green-300 text-green-800"
                                    : "bg-amber-100 border-amber-300 text-amber-800"
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="given">Prize Given</option>
                              </select>
                            ) : (
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded border ${
                                  isPrizeGiven
                                    ? "bg-green-100 border-green-300 text-green-800"
                                    : "bg-amber-100 border-amber-300 text-amber-800"
                                }`}
                              >
                                {isPrizeGiven ? "Prize Given" : "Pending"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="text-gray-400 h-16 w-16 mb-4 mx-auto" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No winners yet
                  </h3>
                  <p className="text-gray-500">
                    Winners will appear here once they are selected in the
                    Games tab.
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* Prize Details Modal */}
      <Modal
        isOpen={!!viewingPrizeId}
        onClose={() => setViewingPrizeId(null)}
        title="Prize Details"
      >
        {viewingPrizeId && (() => {
          const winner = Object.values(winners)
            .flat()
            .find((w) => w.id === viewingPrizeId);
          if (!winner) return null;

          const game = games.find(
            (g) =>
              g.id === winner.gameId ||
              winners[g.id]?.some((w) => w.id === winner.id)
          );
          const prize = game
            ? getPrizeForPosition(game, winner.position)
            : null;

          return (
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {winner.name}
                  </h3>
                  <p className="text-sm text-green-600 font-medium">
                    {winner.position} Place Winner
                  </p>
                </div>
              </div>

              {prize ? (
                <div>
                  {prize.image && (
                    <img
                      src={prize.image}
                      alt={prize.item}
                      className="w-32 h-32 object-cover rounded-lg border mx-auto mb-4"
                    />
                  )}
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {prize.item}
                  </h4>
                  <p className="text-2xl font-bold text-green-600 mb-4">
                    ₹{prize.amount.toLocaleString()}
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Prize for</p>
                    <p className="font-semibold text-gray-900">
                      {winner.position} Place
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-4">
                  <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Prize Details
                  </h4>
                  <p className="text-gray-600">
                    {winner.prize || "No prize details available"}
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {isLoading ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Skeleton className="h-6 w-6 rounded mr-3" />
            <div className="flex-1">
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
      ) : Object.keys(winners).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Trophy className="text-yellow-500 mr-3 h-6 w-6" />
            <div>
              <h4 className="text-yellow-800 font-semibold">
                Total Winners Summary
              </h4>
              <p className="text-yellow-700 text-sm">
                {Object.values(winners).reduce(
                  (sum, gameWinners) => sum + gameWinners.length,
                  0
                )}{" "}
                total winners across all games
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Winners;
