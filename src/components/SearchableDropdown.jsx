import { useState, useRef, useEffect } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";

function SearchableDropdown({
  options = [],
  value = "",
  onChange,
  placeholder = "Select option...",
  label = "",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue500 focus:border-transparent ${
            disabled
              ? "bg-gray-100 cursor-not-allowed"
              : "cursor-pointer hover:border-gray-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              {selectedOption ? (
                <div className="flex items-center space-x-2">
                  {selectedOption.image && (
                    <img
                      src={selectedOption.image}
                      alt=""
                      className="w-6 h-6 object-cover rounded border"
                    />
                  )}
                  <span className="truncate">{selectedOption.label}</span>
                  <span className="text-green-600 font-medium">
                    ₹{selectedOption.amount}
                  </span>
                </div>
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {selectedOption && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <span className="text-gray-400">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            </div>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search prizes..."
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue500"
                autoFocus
              />
            </div>

            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-gray-500 text-sm border-b"
                  >
                    Clear selection
                  </button>
                  {filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 ${
                        value === option.value ? "bg-blue50 text-blue600" : ""
                      }`}
                    >
                      {option.image && (
                        <img
                          src={option.image}
                          alt=""
                          className="w-8 h-8 object-cover rounded border"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {option.label}
                        </div>
                        <div className="text-xs text-green-600">
                          ₹{option.amount}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  {searchTerm ? "No prizes found" : "No prizes available"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchableDropdown;
