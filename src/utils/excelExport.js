import * as XLSX from 'xlsx';

export function exportToExcel(data, currentYear) {
  const { contributors = [], games = [], winners = {} } = data;

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Fund Sheet (Contributors)
  const fundData = contributors.map(contributor => ({
    'Name': contributor.name,
    'Amount': contributor.amount,
    'Paid': contributor.isPaid ? 'Yes' : 'No',
    'Category': contributor.category || '',
    'Date': contributor.date ? new Date(contributor.date).toLocaleDateString() : ''
  }));
  const fundSheet = XLSX.utils.json_to_sheet(fundData);
  XLSX.utils.book_append_sheet(wb, fundSheet, 'Fund');

  // Games Sheet
  const gamesData = games.map(game => ({
    'Name': game.name,
    'Organizer': game.organizer,
    'Reference Link': game.referenceLink || '',
    'Participants Count': game.participants ? game.participants.length : 0,
    'Created Date': game.created ? new Date(game.created).toLocaleDateString() : ''
  }));
  const gamesSheet = XLSX.utils.json_to_sheet(gamesData);
  XLSX.utils.book_append_sheet(wb, gamesSheet, 'Games');

  // Games Winners Sheet - flatten the winners object
  const winnersData = [];
  Object.entries(winners).forEach(([gameId, gameWinners]) => {
    const game = games.find(g => g.id === gameId);
    const gameName = game ? game.name : `Game ${gameId}`;

    gameWinners.forEach(winner => {
      winnersData.push({
        'Game Name': gameName,
        'Winner Name': winner.name,
        'Position': winner.position,
        'Prize Given': winner.prize_given ? 'Yes' : 'No',
        'Prize Given Date': winner.prize_given_date ? new Date(winner.prize_given_date).toLocaleDateString() : ''
      });
    });
  });
  const winnersSheet = XLSX.utils.json_to_sheet(winnersData);
  XLSX.utils.book_append_sheet(wb, winnersSheet, 'Games Winners');

  // Download file
  const fileName = `pongal-${currentYear}-data.xlsx`;
  XLSX.writeFile(wb, fileName);
}
