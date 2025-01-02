import React from 'react';

const MainMenu = ({ onStartGame }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl transform transition-all">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Tic Tac Toe 3D
        </h1>
        <div className="space-y-4">
          <button
            onClick={() => onStartGame('2player')}
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Play Multiplayer
          </button>
          <button
            onClick={() => onStartGame('cpu')}
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            Play with CPU
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;