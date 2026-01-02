import { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  Award,
  Gamepad2,
  X,
  Eye,
  Check,
  Clock,
} from "lucide-react";
import { yearsApi, gamesApi, winnersApi, expensesApi } from "../lib/api.js";

function Winners({ currentYear }) {
  const [viewingGameId, setViewingGameId] = useState(null);
  const [viewingPrizeId, setViewingPrizeId] = useState(null);
  const [games, setGames] = useState([]);
  const [winners, setWinners] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, [currentYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Get the year record first
      const yearRecord = await yearsApi.getByYear(currentYear);
      if (!yearRecord) {
        setGames([]);
        setWinners({});
        setExpenses([]);
        setLoading(false);
        return;
      }

      // Load all data in parallel
      const [gamesData, winnersData, expensesData] = await Promise.all([
        gamesApi.getByYear(yearRecord.id),
        winnersApi.getByYear(yearRecord.id),
        expensesApi.getByYear(yearRecord.id)
      ]);

      // Transform games data to match expected structure
      const transformedGames = gamesData.map(game => ({
        id: game.id,
        name: game.name,
        organizer: game.organizer,
        referenceLink: game.reference_link,
        prizeIds: {
          first: game.first_prize_id,
          second: game.second_prize_id,
          third: game.third_prize_id
        },
        participants: game.participants || [],
        created: game.created_at,
        updated: game.updated_at
      }));

      // Transform expenses data
      const transformedExpenses = expensesData.map(expense => ({
        id: expense.id,
        item: expense.item,
        amount: parseFloat(expense.amount),
        category: expense.category,
        date: expense.date,
        image: expense.image,
        created: expense.created_at
      }));

      // Group winners by game_id
      const winnersGrouped = winnersData.reduce((acc, winner) => {
        if (!acc[winner.game_id]) {
          acc[winner.game_id] = [];
        }
        acc[winner.game_id].push({
          id: winner.id,
          name: winner.name,
          position: winner.position,
          prize: winner.prize,
          prizeGiven: winner.prize_given || false,
          prizeGivenDate: winner.prize_given_date,
          gameId: winner.game_id
        });
        return acc;
      }, {});

      setGames(transformedGames);
      setWinners(winnersGrouped);
      setExpenses(transformedExpenses);
    } catch (err) {
      console.error("Error loading winners data:", err);
      setError("Failed to load winners data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
      let gameId = null;

      for (const [gId, gameWinners] of Object.entries(winners)) {
        const winner = gameWinners.find(w => w.id === winnerId);
        if (winner) {
          winnerToUpdate = winner;
          gameId = gId;
          break;
        }
      }

      if (!winnerToUpdate) {
        console.error("Winner not found");
        return;
      }

      const newPrizeGiven = !winnerToUpdate.prizeGiven;

      // Update in database
      await winnersApi.togglePrizeGiven(winnerId, newPrizeGiven);

      // Update local state
      setWinners(prev => ({
        ...prev,
        [gameId]: prev[gameId].map(winner =>
          winner.id === winnerId
            ? {
                ...winner,
                prizeGiven: newPrizeGiven,
                prizeGivenDate: newPrizeGiven ? new Date().toISOString() : null
              }
            : winner
        )
      }));
    } catch (err) {
      console.error("Error updating prize status:", err);
      setError("Failed to update prize status. Please try again.");
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

  const getPositionColor = (position) => {
    switch (position) {
      case "1st":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "2nd":
        return "bg-gray-50 text-gray-800 border-gray-200";
      case "3rd":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "Participation":
        return "bg-blue-50 text-blue-800 border-blue-200";
      default:
        return "bg-purple-50 text-purple-800 border-purple-200";
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

        {games.length > 0 ? (
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
                      {sortedWinners.slice(0, 3).map((winner, index) => {
                        const prize = getPrizeForPosition(
                          game,
                          winner.position
                        );
                        const isPrizeGiven = winner.prizeGiven || false;
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
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePrizeGiven(winner.id);
                                  }}
                                  className={`p-2 sm:p-1.5 rounded-lg sm:rounded-full transition-all ${
                                    isPrizeGiven
                                      ? "bg-green-100 text-green-600 hover:bg-green-200"
                                      : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                  }`}
                                  title={
                                    isPrizeGiven
                                      ? "Prize given ✓"
                                      : "Prize not given yet"
                                  }
                                >
                                  {isPrizeGiven ? (
                                    <Check className="h-4 w-4 sm:h-3 sm:w-3" />
                                  ) : (
                                    <Clock className="h-4 w-4 sm:h-3 sm:w-3" />
                                  )}
                                </button>
                                <span
                                  className={`text-xs font-medium ${
                                    isPrizeGiven
                                      ? "text-green-600"
                                      : "text-blue-600"
                                  }`}
                                >
                                  {isPrizeGiven ? "Given" : "Pending"}
                                </span>
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
      {viewingGameId &&
        (() => {
          const viewingGame = games.find((g) => g.id === viewingGameId);
          const gameWinners = winners[viewingGameId] || [];
          if (!viewingGame) return null;

          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-6 z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl min-h-[400px] max-h-[85vh] flex flex-col border border-gray-200">
                {/* Header */}
                <div className="px-6 py-4 border-b bg-gradient-to-r from-yellow-50 to-blue50 flex-shrink-0 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          Winners - {viewingGame.name}
                        </h3>
                        <p className="text-sm text-yellow-600 font-medium">
                          {gameWinners.length} winner
                          {gameWinners.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewingGameId(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto min-h-0 p-6">
                  {gameWinners.length > 0 ? (
                    <div className="space-y-3">
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
                          const isPrizeGiven = winner.prizeGiven || false;
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
                                  onClick={() => setViewingPrizeId(winner.id)}
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
                                <div className="flex flex-col items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePrizeGiven(winner.id);
                                    }}
                                    className={`p-2 rounded-lg transition-all ${
                                      isPrizeGiven
                                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                                        : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                    }`}
                                    title={
                                      isPrizeGiven
                                        ? "Mark as not given"
                                        : "Mark as given"
                                    }
                                  >
                                    {isPrizeGiven ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Clock className="h-4 w-4" />
                                    )}
                                  </button>
                                  <span
                                    className={`text-xs font-medium ${
                                      isPrizeGiven
                                        ? "text-green-600"
                                        : "text-blue-600"
                                    }`}
                                  >
                                    {isPrizeGiven ? "Given" : "Pending"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
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
              </div>
            </div>
          );
        })()}

      {/* Prize Details Modal */}
      {viewingPrizeId &&
        (() => {
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-6 z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-200">
                {/* Header */}
                <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Award className="h-5 w-5 text-green-600" />
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
                    <button
                      onClick={() => setViewingPrizeId(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {prize ? (
                    <div className="text-center">
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
                    <div className="text-center py-8">
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
              </div>
            </div>
          );
        })()}

      {Object.keys(winners).length > 0 && (
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
