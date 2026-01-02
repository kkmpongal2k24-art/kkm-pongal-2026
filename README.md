# 🎉 Pongal Games Manager

A React.js frontend-only application for managing Pongal event funds and games. This application helps organize contributors, track expenses, manage games, and record winners for Pongal celebrations.

## ✨ Features

### 📅 Year/Event Management
- Create and manage multiple years/events (e.g., Pongal 2025, Pongal 2026)
- Easy year switching with dedicated data for each event
- Automatic data initialization for new years

### 💰 Fund Collection
- **Add Contributors**: Record people and their contribution amounts
- **CRUD Operations**: Add, edit, and delete contributor records
- **Real-time Totals**: Automatic calculation of total collected funds
- **Individual Tracking**: View detailed contribution history with dates

### 🛍️ Expense Management
- **Purchase Tracking**: Record all expenses and prize purchases
- **Item Details**: Track item names, amounts, and purchase dates
- **Budget Monitoring**: Automatic balance calculation (collected - expenses)
- **Budget Alerts**: Visual warnings when expenses exceed collections

### 🎮 Games Management
- **Game Creation**: Add games with organizer details
- **Prize Configuration**: Set up 1st, 2nd, 3rd place prizes
- **Game Descriptions**: Add detailed rules and information
- **Organizer Tracking**: Record who's responsible for each game

### 🏆 Winners Management
- **Position-based Prizes**: Record 1st, 2nd, 3rd place winners
- **Flexible Categories**: Support for participation awards and custom positions
- **Game Association**: Link winners directly to their respective games
- **Prize Details**: Track exactly what each winner received

### 📊 Dashboard & Analytics
- **Summary Overview**: At-a-glance view of all key metrics
- **Real-time Updates**: Live calculation of totals and balances
- **Recent Activity**: Quick view of recent expenses and game activities
- **Visual Indicators**: Color-coded status indicators and progress bars

## 🛠 Tech Stack

- **Frontend**: React.js with functional components and hooks
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React useState and useEffect hooks
- **Data Persistence**: localStorage for client-side data storage
- **Build Tool**: Vite for fast development and building
- **Code Quality**: ESLint for code linting and quality assurance

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone or download the project**
   ```bash
   cd pongal-2026
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

## 📱 How to Use

### 1. **Year Management**
- Use the year selector in the header to switch between different events
- Click "+ Add Year" to create a new event year
- Each year maintains completely separate data

### 2. **Managing Contributors**
- Go to the "Contributors" tab
- Click "+ Add Contributor" to record new contributions
- Edit or delete existing contributions as needed
- Monitor the total collected amount in real-time

### 3. **Tracking Expenses**
- Navigate to the "Expenses" tab
- Add purchases with item names, amounts, and dates
- Watch the remaining balance update automatically
- Get alerts if expenses exceed collections

### 4. **Creating Games**
- Visit the "Games" tab
- Add new games with organizer details
- Configure prizes for 1st, 2nd, and 3rd places
- Add descriptions and rules for each game

### 5. **Recording Winners**
- Go to the "Winners" tab
- Select a game from the game cards
- Add winners with their positions and prizes
- Track multiple winners per game

### 6. **Dashboard Overview**
- The "Dashboard" provides a complete summary
- View total collections, expenses, and balances
- See recent activities and game overviews
- Monitor overall event progress

## 💾 Data Storage

- All data is stored locally in your browser's localStorage
- Data persists between sessions automatically
- Export functionality available for backup (JSON format)
- No backend server required - completely client-side

## 🎨 Design Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Intuitive Navigation**: Clear tabbed interface for easy access
- **Visual Feedback**: Color-coded indicators for different states
- **Accessibility**: Proper ARIA labels and keyboard navigation support
- **Modern UI**: Clean, professional design with emoji icons

## 📦 Project Structure

```
src/
├── components/
│   ├── Header.jsx           # Top navigation and year selector
│   ├── Navigation.jsx       # Main tab navigation
│   ├── Dashboard.jsx        # Summary and overview
│   ├── Contributors.jsx     # Fund collection management
│   ├── Expenses.jsx         # Expense tracking
│   ├── Games.jsx           # Games management
│   └── Winners.jsx         # Winners recording
├── utils/
│   └── helpers.js          # Utility functions
├── App.jsx                 # Main app component
├── App.css                 # Tailwind CSS imports
└── main.jsx               # React entry point
```

## 🔧 Customization

### Adding New Features
1. Create new components in the `src/components/` directory
2. Add navigation items in `Navigation.jsx`
3. Update the main router in `App.jsx`

### Styling Changes
- Modify Tailwind classes directly in components
- Add custom styles in `src/App.css` if needed
- Color scheme can be changed by updating Tailwind color classes

### Data Structure
- Data is stored as JSON in localStorage
- Each year has: `contributors[]`, `expenses[]`, `games[]`, `winners{}`
- Extend the structure by modifying the initialization in `App.jsx`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎊 Perfect for

- Community Pongal celebrations
- Office Pongal events
- Family gatherings
- Cultural festival organization
- Any event requiring fund and game management

---

**Happy Pongal! 🎉** Enjoy organizing your celebrations with this comprehensive management tool.