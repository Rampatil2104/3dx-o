import React from 'react';

const GameOver = ({ winner, onRestart, onQuit }) => {
  const getMessage = () => {
    if (winner === 'draw') return "It's a Draw!";
    return `${winner} Wins!`;
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl transform transition-all text-center">
        <h2 className="text-4xl font-bold text-white mb-6">{getMessage()}</h2>
        <div className="space-y-4">
          <button
            onClick={onRestart}
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            Play Again
          </button>
          <button
            onClick={onQuit}
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Quit to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;