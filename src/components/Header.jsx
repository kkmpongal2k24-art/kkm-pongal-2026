import { useState, useRef, useEffect } from "react";
import { PartyPopper, Plus, Check, X, ChevronDown } from "lucide-react";
import Modal from "./Modal";

function Header({ currentYear, setCurrentYear, data, saveData }) {
  const [showModal, setShowModal] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [newYear, setNewYear] = useState("");
  const dropdownRef = useRef(null);

  const availableYears = Object.keys(data).sort();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowYearDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddYear = (e) => {
    e.preventDefault();
    if (newYear && !data[newYear]) {
      const updatedData = {
        ...data,
        [newYear]: {
          contributors: [],
          expenses: [],
          games: [],
          winners: {},
        },
      };
      saveData(updatedData);
      setCurrentYear(newYear);
      setNewYear("");
      setShowModal(false);
    }
  };

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <PartyPopper className="h-8 w-8 sm:h-10 sm:w-10 text-blue-200" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate">
                Pongal Games Manager
              </h1>
            </div>
            <p className="text-blue-100 text-base sm:text-lg">
              Event Fund & Games Management
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium whitespace-nowrap">
                Year:
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                  className="bg-white text-gray-800 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm sm:text-base flex items-center gap-2 min-w-0 w-full sm:w-auto transition-colors hover:bg-gray-50"
                >
                  <span className="truncate">Pongal {currentYear}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showYearDropdown && (
                  <div className="absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-full">
                    <div className="py-1 max-h-48 overflow-y-auto">
                      {availableYears.map((year) => (
                        <button
                          key={year}
                          onClick={() => {
                            setCurrentYear(year);
                            setShowYearDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                            year === currentYear
                              ? 'bg-blue-100 text-blue-800 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          Pongal {year}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Year
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setNewYear("");
        }}
        title="Add New Year"
      >
        <form onSubmit={handleAddYear}>
          <div className="mb-4">
            <label htmlFor="year-input" className="block text-sm font-medium text-gray-700 mb-2">
              Enter Year
            </label>
            <input
              id="year-input"
              type="text"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              placeholder="2026"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setNewYear("");
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add Year
            </button>
          </div>
        </form>
      </Modal>
    </header>
  );
}

export default Header;
