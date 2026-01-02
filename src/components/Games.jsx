import { useState } from "react";
import { gamesApi, yearsApi, winnersApi } from "../lib/api";
import SearchableDropdown from "./SearchableDropdown";
import {
  Gamepad2,
  Plus,
  Medal,
  Book,
  Users,
  Trophy,
  Calendar,
  Lightbulb,
  Eye,
  UserPlus,
  X,
  Pencil,
  Trash2,
} from "lucide-react";

function Games({ data, refreshData, currentYear }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingGameId, setViewingGameId] = useState(null);
  const [managingParticipants, setManagingParticipants] = useState(null);
  const [selectingWinners, setSelectingWinners] = useState(null);
  const [deletingGameId, setDeletingGameId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    organizer: "",
    referenceLink: "",
    firstPrizeId: "",
    secondPrizeId: "",
    thirdPrizeId: "",
  });
  const [participantName, setParticipantName] = useState("");
  const [winnerForm, setWinnerForm] = useState({
    participant: "",
    position: "1st",
  });

  const { games = [], winners = {}, expenses = [] } = data;

  // Create prize options from expenses (only Prize category items)
  const prizeOptions = expenses
    .filter((expense) => expense.category === "Prize" || !expense.category) // Include legacy data without category
    .map((expense) => ({
      value: expense.id,
      label: expense.item,
      amount: expense.amount.toLocaleString(),
      image: expense.image,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.organizer.trim()) {
      alert("Please enter game name and organizer");
      return;
    }

    try {
      // Get year record
      const yearRecord = await yearsApi.getByYear(currentYear);
      if (!yearRecord) {
        alert('Year not found. Please try again.');
        return;
      }

      if (editingId !== null) {
        // Update existing game
        await gamesApi.update(editingId, {
          name: formData.name.trim(),
          organizer: formData.organizer.trim(),
          reference_link: formData.referenceLink.trim(),
          first_prize_id: formData.firstPrizeId || null,
          second_prize_id: formData.secondPrizeId || null,
          third_prize_id: formData.thirdPrizeId || null,
          participants: [] // Keep existing participants, will be updated separately
        });
      } else {
        // Create new game
        await gamesApi.create({
          year_id: yearRecord.id,
          name: formData.name.trim(),
          organizer: formData.organizer.trim(),
          reference_link: formData.referenceLink.trim(),
          first_prize_id: formData.firstPrizeId || null,
          second_prize_id: formData.secondPrizeId || null,
          third_prize_id: formData.thirdPrizeId || null,
          participants: []
        });
      }

      // Refresh data and reset form
      await refreshData();
      resetForm();
    } catch (error) {
      console.error('Failed to save game:', error);
      alert('Failed to save game. Please try again.');
    }
  };

  const handleEdit = (game) => {
    setFormData({
      name: game.name,
      organizer: game.organizer,
      referenceLink: game.referenceLink || "",
      firstPrizeId: (game.prizeIds && game.prizeIds.first) || "",
      secondPrizeId: (game.prizeIds && game.prizeIds.second) || "",
      thirdPrizeId: (game.prizeIds && game.prizeIds.third) || "",
    });
    setEditingId(game.id);
    setShowForm(true);
  };

  const handleDelete = (gameId) => {
    setDeletingGameId(gameId);
  };

  const confirmDelete = async (gameId) => {
    try {
      // Delete associated winners first
      const gameWinners = winners[gameId] || [];
      for (const winner of gameWinners) {
        await winnersApi.delete(winner.id);
      }

      // Delete the game
      await gamesApi.delete(gameId);

      // Refresh data
      await refreshData();
      setDeletingGameId(null);
    } catch (error) {
      console.error('Failed to delete game:', error);
      alert('Failed to delete game. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      organizer: "",
      referenceLink: "",
      firstPrizeId: "",
      secondPrizeId: "",
      thirdPrizeId: "",
    });
    setParticipantName("");
    setShowForm(false);
    setEditingId(null);
  };

  // Functions for managing participants separately
  const addParticipantToGame = async (gameId) => {
    if (participantName.trim()) {
      try {
        const game = games.find(g => g.id === gameId);
        if (game) {
          const currentParticipants = game.participants || [];
          if (!currentParticipants.includes(participantName.trim())) {
            const updatedParticipants = [...currentParticipants, participantName.trim()];
            await gamesApi.update(gameId, {
              participants: updatedParticipants
            });
            await refreshData();
          }
        }
        setParticipantName("");
      } catch (error) {
        console.error('Failed to add participant:', error);
        alert('Failed to add participant. Please try again.');
      }
    }
  };

  const removeParticipantFromGame = async (gameId, participantIndex) => {
    try {
      const game = games.find(g => g.id === gameId);
      if (game) {
        const currentParticipants = game.participants || [];
        const updatedParticipants = currentParticipants.filter((_, i) => i !== participantIndex);
        await gamesApi.update(gameId, {
          participants: updatedParticipants
        });
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to remove participant:', error);
      alert('Failed to remove participant. Please try again.');
    }
  };

  // Functions for managing winners
  const addWinnerToGame = async (gameId) => {
    if (winnerForm.participant && winnerForm.position) {
      try {
        const yearRecord = await yearsApi.getByYear(currentYear);
        if (!yearRecord) {
          alert('Year not found. Please try again.');
          return;
        }

        await winnersApi.create({
          year_id: yearRecord.id,
          game_id: gameId,
          name: winnerForm.participant,
          position: winnerForm.position,
          prize_given: false
        });

        await refreshData();
        setWinnerForm({ participant: "", position: "1st" });
      } catch (error) {
        console.error('Failed to add winner:', error);
        alert('Failed to add winner. Please try again.');
      }
    }
  };

  const removeWinnerFromGame = async (gameId, winnerId) => {
    try {
      await winnersApi.delete(winnerId);
      await refreshData();
    } catch (error) {
      console.error('Failed to remove winner:', error);
      alert('Failed to remove winner. Please try again.');
    }
  };

  // Helper function for Game Details Modal
  const renderGameDetailsModal = () => {
    if (!viewingGameId) return null;

    const viewingGame = games.find((g) => g.id === viewingGameId);
    if (!viewingGame) return null;

    const gameWinners = winners[viewingGame.id] || [];
    const getSelectedPrize = (prizeId) => {
      return expenses.find((expense) => expense.id === prizeId);
    };

    const firstPrize = getSelectedPrize(
      viewingGame.prizeIds && viewingGame.prizeIds.first
    );
    const secondPrize = getSelectedPrize(
      viewingGame.prizeIds && viewingGame.prizeIds.second
    );
    const thirdPrize = getSelectedPrize(
      viewingGame.prizeIds && viewingGame.prizeIds.third
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] sm:max-h-[80vh] flex flex-col mt-4 sm:mt-0">
          {/* Fixed Modal Header */}
          <div className="px-4 py-3 border-b bg-gray-50 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Gamepad2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {viewingGame.name}
                  </h2>
                  <p className="text-sm text-gray-600 truncate">
                    Organized by {viewingGame.organizer}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingGameId(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-2 flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Action Buttons - Mobile Stack */}
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <button
                onClick={() => setManagingParticipants(viewingGame.id)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <UserPlus className="h-4 w-4" />
                Manage Participants
              </button>
              <button
                onClick={() => handleEdit(viewingGame)}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Pencil className="h-4 w-4" />
                Edit Game
              </button>
            </div>
          </div>

          {/* Scrollable Modal Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Reference Link */}
              {viewingGame.referenceLink && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Reference
                  </h3>
                  <a
                    href={viewingGame.referenceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2"
                  >
                    <Book className="h-4 w-4" />
                    View Game Rules & Details
                  </a>
                </div>
              )}

              {/* Prizes */}
              {(firstPrize || secondPrize || thirdPrize) && (
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-3">
                    Prizes
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {firstPrize && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Medal className="h-5 w-5 text-yellow-600" />
                          <span className="font-semibold text-yellow-800">
                            1st Prize
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {firstPrize.image && (
                            <img
                              src={firstPrize.image}
                              alt=""
                              className="w-12 h-12 object-cover rounded border"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {firstPrize.item}
                            </p>
                            <p className="text-green-600 font-semibold">
                              ₹{firstPrize.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {secondPrize && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Medal className="h-5 w-5 text-gray-600" />
                          <span className="font-semibold text-gray-800">
                            2nd Prize
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {secondPrize.image && (
                            <img
                              src={secondPrize.image}
                              alt=""
                              className="w-12 h-12 object-cover rounded border"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {secondPrize.item}
                            </p>
                            <p className="text-green-600 font-semibold">
                              ₹{secondPrize.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {thirdPrize && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Medal className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold text-blue-800">
                            3rd Prize
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {thirdPrize.image && (
                            <img
                              src={thirdPrize.image}
                              alt=""
                              className="w-12 h-12 object-cover rounded border"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {thirdPrize.item}
                            </p>
                            <p className="text-green-600 font-semibold">
                              ₹{thirdPrize.amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Participants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-800">
                    Participants (
                    {(viewingGame.participants &&
                      viewingGame.participants.length) ||
                      0}
                    )
                  </h3>
                  <button
                    onClick={() => setManagingParticipants(viewingGame.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                  >
                    <UserPlus className="h-3 w-3" />
                    Manage
                  </button>
                </div>
                {viewingGame.participants &&
                viewingGame.participants.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewingGame.participants.map((participant, index) => (
                      <div
                        key={index}
                        className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-blue-600 flex-shrink-0" />
                          <span className="text-blue-800 font-medium truncate">
                            {participant}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2 text-sm">
                      No participants added yet
                    </p>
                    <button
                      onClick={() => setManagingParticipants(viewingGame.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 mx-auto"
                    >
                      <UserPlus className="h-3 w-3" />
                      Add Participants
                    </button>
                  </div>
                )}
              </div>

              {/* Winners */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-800">
                    Winners ({gameWinners.length})
                  </h3>
                  {viewingGame.participants &&
                    viewingGame.participants.length > 0 && (
                      <button
                        onClick={() => {
                          setViewingGameId(null);
                          setSelectingWinners(viewingGame.id);
                        }}
                        className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1"
                      >
                        <Trophy className="h-3 w-3" />
                        Select
                      </button>
                    )}
                </div>
                {gameWinners.length > 0 ? (
                  <div className="space-y-2">
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
                      .map((winner) => (
                        <div
                          key={winner.id}
                          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Trophy className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {winner.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {winner.position} Place
                              </p>
                            </div>
                          </div>
                          {(() => {
                            const gamePrize = getSelectedPrize(
                              winner.position === "1st"
                                ? (viewingGame.prizeIds && viewingGame.prizeIds.first)
                                : winner.position === "2nd"
                                ? (viewingGame.prizeIds && viewingGame.prizeIds.second)
                                : winner.position === "3rd"
                                ? (viewingGame.prizeIds && viewingGame.prizeIds.third)
                                : null
                            );
                            if (gamePrize) {
                              return (
                                <div className="flex items-center gap-2">
                                  {gamePrize.image && (
                                    <img
                                      src={gamePrize.image}
                                      alt=""
                                      className="w-8 h-8 object-cover rounded border"
                                    />
                                  )}
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                      {gamePrize.item}
                                    </p>
                                    <p className="text-xs text-green-600">
                                      ₹{gamePrize.amount.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return winner.prize ? (
                              <span className="text-sm text-gray-600">
                                {winner.prize}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">
                      No winners selected yet
                    </p>
                    {viewingGame.participants &&
                    viewingGame.participants.length > 0 ? (
                      <button
                        onClick={() => {
                          setViewingGameId(null);
                          setSelectingWinners(viewingGame.id);
                        }}
                        className="text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
                      >
                        <Trophy className="h-4 w-4" />
                        Select Winners
                      </button>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Add participants first to select winners
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Game Stats */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                <div className="text-center bg-blue-50 p-3 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">
                    {(viewingGame.participants &&
                      viewingGame.participants.length) ||
                      0}
                  </div>
                  <div className="text-xs text-gray-600">Participants</div>
                </div>
                <div className="text-center bg-green-50 p-3 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {gameWinners.length}
                  </div>
                  <div className="text-xs text-gray-600">Winners</div>
                </div>
                <div className="text-center bg-yellow-50 p-3 rounded-lg">
                  <div className="text-xl font-bold text-yellow-600">
                    {
                      [firstPrize, secondPrize, thirdPrize].filter(Boolean)
                        .length
                    }
                  </div>
                  <div className="text-xs text-gray-600">Prizes</div>
                </div>
                <div className="text-center bg-purple-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    ₹
                    {[firstPrize, secondPrize, thirdPrize]
                      .filter(Boolean)
                      .reduce((sum, prize) => sum + prize.amount, 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Total Prize Value</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper function for Participant Management Modal
  const renderParticipantModal = () => {
    if (!managingParticipants) return null;

    const managingGame = games.find((g) => g.id === managingParticipants);
    if (!managingGame) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-6 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl min-h-[500px] max-h-[85vh] flex flex-col border border-gray-200">
          {/* Fixed Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-gray-900 truncate">
                    Manage Participants
                  </h3>
                  <p className="text-sm text-blue-600 font-medium truncate">
                    {managingGame.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManagingParticipants(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 space-y-6">
              {/* Add Participant Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="h-5 w-5 text-green-600" />
                  <h4 className="text-lg font-semibold text-gray-800">
                    Add New Participant
                  </h4>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Enter participant name..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm"
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      participantName.trim() &&
                      (e.preventDefault(),
                      addParticipantToGame(managingGame.id))
                    }
                  />
                  <button
                    onClick={() => addParticipantToGame(managingGame.id)}
                    disabled={!participantName.trim()}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium shadow-sm flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>

              {/* Participants List Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    <h4 className="text-lg font-semibold text-gray-800">
                      Participants List
                    </h4>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {(managingGame.participants &&
                      managingGame.participants.length) ||
                      0}{" "}
                    Total
                  </span>
                </div>

                {managingGame.participants &&
                managingGame.participants.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {managingGame.participants.map((participant, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {index + 1}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 truncate">
                            {participant}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            removeParticipantFromGame(managingGame.id, index)
                          }
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-60 group-hover:opacity-100"
                          title="Remove participant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-600 mb-2">
                      No participants yet
                    </h5>
                    <p className="text-gray-500 text-sm">
                      Add the first participant to get started
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              {managingGame.participants &&
                managingGame.participants.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">
                      Quick Info
                    </h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">
                          Total Participants:{" "}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {managingGame.participants.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">Ready for Winners</span>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper function for Delete Confirmation Modal
  const renderDeleteModal = () => {
    if (!deletingGameId) return null;

    const deletingGame = games.find((g) => g.id === deletingGameId);
    if (!deletingGame) return null;

    const gameWinners = winners[deletingGame.id] || [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 pb-0 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Game
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this game?
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Gamepad2 className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900">{deletingGame.name}</p>
                  <p className="text-sm text-red-700">
                    Organized by {deletingGame.organizer}
                  </p>
                  {gameWinners.length > 0 && (
                    <p className="text-sm text-red-700 mt-1">
                      This will also delete {gameWinners.length} winner{gameWinners.length !== 1 ? 's' : ''} for this game.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingGameId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deletingGameId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Game
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper function for Winner Selection Modal
  const renderWinnerSelectionModal = () => {
    if (!selectingWinners) return null;

    const selectingGame = games.find((g) => g.id === selectingWinners);
    if (!selectingGame) return null;

    const gameWinners = winners[selectingGame.id] || [];
    const availableParticipants = selectingGame.participants || [];
    const positionOptions = [
      { value: "1st", label: "1st Place" },
      { value: "2nd", label: "2nd Place" },
      { value: "3rd", label: "3rd Place" },
      { value: "Participation", label: "Participation" },
      { value: "Other", label: "Other" },
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-6 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl min-h-[600px] max-h-[85vh] flex flex-col border border-gray-200 mx-auto">
          {/* Fixed Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-yellow-50 to-blue-50 flex-shrink-0 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0 justify-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="min-w-0 text-center">
                  <h3 className="text-lg font-bold text-gray-900 truncate">
                    Select Winners
                  </h3>
                  <p className="text-sm text-yellow-600 font-medium truncate">
                    {selectingGame.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectingWinners(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 space-y-6">
              {/* Add Winner Section */}
              {availableParticipants.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Trophy className="h-5 w-5 text-green-600" />
                    <h4 className="text-lg font-semibold text-gray-800">
                      Add New Winner
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <select
                      value={winnerForm.participant}
                      onChange={(e) =>
                        setWinnerForm({
                          ...winnerForm,
                          participant: e.target.value,
                        })
                      }
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    >
                      <option value="">Select Participant</option>
                      {availableParticipants.map((participant, index) => (
                        <option key={index} value={participant}>
                          {participant}
                        </option>
                      ))}
                    </select>
                    <select
                      value={winnerForm.position}
                      onChange={(e) =>
                        setWinnerForm({
                          ...winnerForm,
                          position: e.target.value,
                        })
                      }
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    >
                      {positionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => addWinnerToGame(selectingGame.id)}
                      disabled={!winnerForm.participant}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2 justify-center"
                    >
                      <Trophy className="h-4 w-4" />
                      Add Winner
                    </button>
                  </div>
                </div>
              )}

              {/* Current Winners */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 mx-auto">
                    <Trophy className="h-5 w-5 text-gray-600" />
                    <h4 className="text-lg font-semibold text-gray-800">
                      Current Winners
                    </h4>
                    <span className="ml-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                      {gameWinners.length} Selected
                    </span>
                  </div>
                </div>

                {gameWinners.length > 0 ? (
                  <div className="space-y-3">
                    {gameWinners
                      .sort((a, b) => {
                        const order = {
                          "1st": 1,
                          "2nd": 2,
                          "3rd": 3,
                          Participation: 4,
                          Other: 5,
                        };
                        return (
                          (order[a.position] || 5) - (order[b.position] || 5)
                        );
                      })
                      .map((winner) => (
                        <div
                          key={winner.id}
                          className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-yellow-200 hover:shadow-sm transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex-shrink-0 p-2 bg-yellow-100 rounded-full">
                              {winner.position === "1st" ? (
                                <Medal className="h-5 w-5 text-yellow-600" />
                              ) : winner.position === "2nd" ? (
                                <Medal className="h-5 w-5 text-gray-600" />
                              ) : winner.position === "3rd" ? (
                                <Medal className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Trophy className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {winner.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {winner.position} Place
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              removeWinnerFromGame(selectingGame.id, winner.id)
                            }
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Remove winner"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h5 className="text-lg font-medium text-gray-600 mb-2">
                      No winners selected
                    </h5>
                    <p className="text-gray-500 text-sm">
                      {availableParticipants.length > 0
                        ? "Select winners from the participants above"
                        : "Add participants to this game first to select winners"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6" />
              Games Management
            </div>
          </h2>
          <p className="text-gray-600 mt-1">Pongal {currentYear}</p>
          <p className="text-gray-600 mt-2">
            Total Games:{" "}
            <span className="font-semibold text-purple-600 text-lg">
              {games.length}
            </span>
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Game
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId !== null ? "Edit Game" : "Add New Game"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Game Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Musical Chairs, Quiz Contest"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="organizer"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Organizer Name *
                </label>
                <input
                  type="text"
                  id="organizer"
                  value={formData.organizer}
                  onChange={(e) =>
                    setFormData({ ...formData, organizer: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Game organizer name"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="referenceLink"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Reference Link
              </label>
              <input
                type="url"
                id="referenceLink"
                value={formData.referenceLink}
                onChange={(e) =>
                  setFormData({ ...formData, referenceLink: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/game-rules"
              />
            </div>

            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-3">
                Prize Selection
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SearchableDropdown
                  options={prizeOptions}
                  value={formData.firstPrizeId}
                  onChange={(value) =>
                    setFormData({ ...formData, firstPrizeId: value })
                  }
                  placeholder="Select 1st prize..."
                  label="1st Prize"
                />

                <SearchableDropdown
                  options={prizeOptions}
                  value={formData.secondPrizeId}
                  onChange={(value) =>
                    setFormData({ ...formData, secondPrizeId: value })
                  }
                  placeholder="Select 2nd prize..."
                  label="2nd Prize"
                />

                <SearchableDropdown
                  options={prizeOptions}
                  value={formData.thirdPrizeId}
                  onChange={(value) =>
                    setFormData({ ...formData, thirdPrizeId: value })
                  }
                  placeholder="Select 3rd prize..."
                  label="3rd Prize"
                />
              </div>
              {prizeOptions.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  <div className="flex items-center gap-1">
                    <Lightbulb className="h-4 w-4" />
                    Add some prizes (with "Prize" category) in the Expenses
                    section first to select them here.
                  </div>
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <UserPlus className="h-4 w-4" />
                <div>
                  <p className="font-medium">Participants Management</p>
                  <p className="text-blue-600">
                    Add participants after creating the game using the "Manage
                    Participants" option.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {editingId !== null ? "Update Game" : "Add Game"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">Games List</h3>
        </div>

        {games.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {games.map((game, index) => {
              const gameWinners = winners[game.id] || [];

              // Get prize details
              const getSelectedPrize = (prizeId) => {
                return expenses.find((expense) => expense.id === prizeId);
              };

              const firstPrize = getSelectedPrize(
                game.prizeIds && game.prizeIds.first
              );
              const secondPrize = getSelectedPrize(
                game.prizeIds && game.prizeIds.second
              );
              const thirdPrize = getSelectedPrize(
                game.prizeIds && game.prizeIds.third
              );

              return (
                <div key={game.id} className="p-4 sm:p-6 hover:bg-gray-50">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-start mb-3">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-purple-600 font-bold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">
                            {game.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Organizer: {game.organizer}
                          </p>
                          {game.referenceLink && (
                            <a
                              href={game.referenceLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center mt-1"
                            >
                              <div className="flex items-center gap-1">
                                <Book className="h-3 w-3" />
                                <span className="truncate">Reference Link</span>
                              </div>
                            </a>
                          )}
                        </div>
                      </div>

                      {(firstPrize || secondPrize || thirdPrize) && (
                        <div className="mb-3">
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">
                            Prizes:
                          </h5>
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            {firstPrize && (
                              <div className="bg-yellow-50 text-yellow-800 px-3 py-2 rounded-lg border border-yellow-200 flex items-center space-x-2">
                                <Medal className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                                {firstPrize.image && (
                                  <img
                                    src={firstPrize.image}
                                    alt=""
                                    className="w-5 h-5 object-cover rounded border flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate text-xs">
                                    1st: {firstPrize.item}
                                  </div>
                                  <div className="text-xs">
                                    ₹{firstPrize.amount.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            )}
                            {secondPrize && (
                              <div className="bg-gray-50 text-gray-800 px-3 py-2 rounded-lg border border-gray-200 flex items-center space-x-2">
                                <Medal className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                {secondPrize.image && (
                                  <img
                                    src={secondPrize.image}
                                    alt=""
                                    className="w-5 h-5 object-cover rounded border flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate text-xs">
                                    2nd: {secondPrize.item}
                                  </div>
                                  <div className="text-xs">
                                    ₹{secondPrize.amount.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            )}
                            {thirdPrize && (
                              <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg border border-blue-200 flex items-center space-x-2">
                                <Medal className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                {thirdPrize.image && (
                                  <img
                                    src={thirdPrize.image}
                                    alt=""
                                    className="w-5 h-5 object-cover rounded border flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate text-xs">
                                    3rd: {thirdPrize.item}
                                  </div>
                                  <div className="text-xs">
                                    ₹{thirdPrize.amount.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {game.participants && game.participants.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">
                            Participants ({game.participants.length}):
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {game.participants
                              .slice(0, 3)
                              .map((participant, index) => (
                                <span
                                  key={index}
                                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs truncate max-w-20"
                                >
                                  {participant}
                                </span>
                              ))}
                            {game.participants.length > 3 && (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                +{game.participants.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center text-xs text-gray-500 gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          {gameWinners.length} winner
                          {gameWinners.length !== 1 ? "s" : ""}
                        </span>
                        {game.participants && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {game.participants.length} participant
                            {game.participants.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(game.created).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:flex-col lg:space-y-2 lg:ml-4">
                      <button
                        onClick={() => setViewingGameId(game.id)}
                        className="text-green-600 hover:text-green-900 text-xs lg:text-sm font-medium transition-colors flex items-center gap-1 bg-green-50 px-2 py-1 rounded"
                      >
                        <Eye className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                      <button
                        onClick={() => setManagingParticipants(game.id)}
                        className="text-purple-600 hover:text-purple-900 text-xs lg:text-sm font-medium transition-colors flex items-center gap-1 bg-purple-50 px-2 py-1 rounded"
                      >
                        <UserPlus className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span className="hidden sm:inline">Participants</span>
                      </button>
                      <button
                        onClick={() => handleEdit(game)}
                        className="text-blue-600 hover:text-blue-900 text-xs lg:text-sm font-medium transition-colors flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"
                      >
                        <Pencil className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(game.id)}
                        className="text-red-600 hover:text-red-900 text-xs lg:text-sm font-medium transition-colors flex items-center gap-1 bg-red-50 px-2 py-1 rounded"
                      >
                        <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Gamepad2 className="text-gray-400 h-16 w-16 mb-4 mx-auto" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No games yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start by adding your first game to manage.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add First Game
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Game Details Modal */}
      {renderGameDetailsModal()}

      {/* Participant Management Modal */}
      {renderParticipantModal()}

      {/* Delete Confirmation Modal */}
      {renderDeleteModal()}

      {/* Winner Selection Modal */}
      {renderWinnerSelectionModal()}

      {games.length > 0 &&
        !viewingGameId &&
        !managingParticipants &&
        !selectingWinners && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Gamepad2 className="text-purple-500 mr-3 h-6 w-6" />
                <div>
                  <h4 className="text-purple-800 font-semibold">
                    Games Summary
                  </h4>
                  <p className="text-purple-700 text-sm">
                    {games.length} game{games.length !== 1 ? "s" : ""} created
                    for Pongal {currentYear}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-purple-800 font-semibold text-lg">
                  {games.length}
                </p>
                <p className="text-purple-600 text-sm">Total Games</p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default Games;
