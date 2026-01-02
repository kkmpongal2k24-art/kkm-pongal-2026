import {
  BarChart3,
  IndianRupee,
  ShoppingBag,
  Gamepad2,
  Trophy,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname.split("/").pop() || "dashboard";

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      shortLabel: "Home",
      path: "/dashboard",
    },
    {
      id: "contributors",
      label: "Contributors",
      icon: IndianRupee,
      shortLabel: "Fund",
      path: "/contributors",
    },
    {
      id: "expenses",
      label: "Expenses",
      icon: ShoppingBag,
      shortLabel: "Spend",
      path: "/expenses",
    },
    {
      id: "games",
      label: "Games",
      icon: Gamepad2,
      shortLabel: "Games",
      path: "/games",
    },
    {
      id: "winners",
      label: "Winners",
      icon: Trophy,
      shortLabel: "Win",
      path: "/winners",
    },
  ];

  return (
    <nav className="bg-white shadow-md border-b sticky top-0 z-10">
      <div className="container mx-auto  px-2 sm:px-6 lg:px-8">
        <div className="flex justify-center lg:justify-start space-x-1 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex-shrink-0 pl-6 pr-4 md:px-6 lg:px-8 py-3 md:py-4 text-sm md:text-base font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
                currentPath === item.id
                  ? "text-blue-600 border-blue-600 bg-blue-50"
                  : "text-gray-600 border-transparent hover:text-blue-600 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <item.icon className="h-5 w-5 md:h-6 md:w-6" />
                <span className="hidden md:inline font-semibold">
                  {item.label}
                </span>
                <span className="md:hidden font-medium">{item.shortLabel}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
