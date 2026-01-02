import {
  Clipboard,
  CheckCircle,
  Clock,
  ShoppingBag,
  CreditCard,
  Gamepad2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Download,
} from "lucide-react";
import Skeleton from "./Skeleton";
import { exportToExcel } from "../utils/excelExport";

function Dashboard({ data, currentYear, isLoading = false }) {
  const { contributors = [], expenses = [], games = [], winners = {} } = data;

  const totalCollected = contributors.reduce(
    (sum, contributor) => sum + contributor.amount,
    0
  );
  const paidAmount = contributors
    .filter((c) => c.isPaid)
    .reduce((sum, contributor) => sum + contributor.amount, 0);
  const unpaidAmount = contributors
    .filter((c) => !c.isPaid)
    .reduce((sum, contributor) => sum + contributor.amount, 0);
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const remainingBalance = paidAmount - totalExpenses;

  // const totalWinners = Object.values(winners).reduce((sum, gameWinners) => sum + gameWinners.length, 0)

  const summaryCards = [
    {
      title: "Total Promised",
      value: `₹${totalCollected.toLocaleString()}`,
      icon: Clipboard,
      color: "bg-blue-50 text-blue-800 border-blue-200",
    },
    {
      title: "Actually Paid",
      value: `₹${paidAmount.toLocaleString()}`,
      icon: CheckCircle,
      color: "bg-green-50 text-green-800 border-green-200",
    },
    {
      title: "Still Pending",
      value: `₹${unpaidAmount.toLocaleString()}`,
      icon: Clock,
      color: "bg-blue50 text-blue800 border-blue200",
    },
    {
      title: "Total Expenses",
      value: `₹${totalExpenses.toLocaleString()}`,
      icon: ShoppingBag,
      color: "bg-red-50 text-red-800 border-red-200",
    },
    {
      title: "Available Balance",
      value: `₹${remainingBalance.toLocaleString()}`,
      icon: CreditCard,
      color:
        remainingBalance >= 0
          ? "bg-teal-50 text-teal-800 border-teal-200"
          : "bg-red-50 text-red-800 border-red-200",
    },
    {
      title: "Total Games",
      value: games.length,
      icon: Gamepad2,
      color: "bg-purple-50 text-purple-800 border-purple-200",
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Dashboard
          </h2>
          <p className="text-gray-600 mt-1">Pongal {currentYear} Overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToExcel(data, currentYear)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </button>
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4 lg:gap-6">
        {isLoading ? (
          Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))
        ) : (
          summaryCards.map((card, index) => (
            <div
              key={index}
              className={`p-5 lg:p-6 rounded-xl border ${card.color} shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold opacity-80 truncate mb-2">
                    {card.title}
                  </p>
                  <p className="text-xl lg:text-2xl xl:text-3xl font-bold truncate">
                    {card.value}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <card.icon className="h-8 w-8 lg:h-10 lg:w-10 opacity-70" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Recent Expenses ({expenses.length})
          </h3>
          <div className="max-h-80 overflow-y-auto">
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 ml-3">
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))
              ) : expenses.length > 0 ? (
                expenses.map((expense, index) => (
                  <div
                    key={expense.id || index}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg overflow-hidden bg-gray-100 border mr-3">
                        {expense.image ? (
                          <img
                            src={expense.image}
                            alt={expense.item}
                            className="h-10 w-10 object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 flex items-center justify-center text-gray-400 bg-gray-100 rounded">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 truncate">
                          {expense.item}
                        </p>
                        <p className="text-sm text-gray-500">
                          {expense.date
                            ? new Date(expense.date).toLocaleDateString()
                            : "No date"}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-red-600 ml-4">
                      ₹{expense.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No expenses recorded yet
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Gamepad2 className="mr-2 h-5 w-5" />
            Games Overview
          </h3>
          <div className="max-h-80 overflow-y-auto">
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))
              ) : games.length > 0 ? (
                games.map((game, index) => (
                  <div
                    key={game.id || index}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{game.name}</p>
                      <p className="text-sm text-gray-500">
                        Organizer: {game.organizer}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {winners[game.id] ? winners[game.id].length : 0} winners
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No games created yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isLoading && remainingBalance < 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-3 h-6 w-6" />
            <div>
              <h4 className="text-red-800 font-semibold">Budget Alert</h4>
              <p className="text-red-700 text-sm">
                Your expenses exceed the actually paid funds by ₹
                {Math.abs(remainingBalance).toLocaleString()}.
                {unpaidAmount > 0
                  ? ` You have ₹${unpaidAmount.toLocaleString()} in pending payments.`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && unpaidAmount > 0 && remainingBalance >= 0 && (
        <div className="bg-blue50 border border-blue200 rounded-lg p-4">
          <div className="flex items-center">
            <Lightbulb className="text-blue500 mr-3 h-6 w-6" />
            <div>
              <h4 className="text-blue800 font-semibold">
                Collection Reminder
              </h4>
              <p className="text-blue700 text-sm">
                You have ₹{unpaidAmount.toLocaleString()} in pending payments
                from contributors. Follow up to collect the remaining funds.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
