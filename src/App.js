import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import MainMenu from './components/MainMenu';
import GameOver from './components/GameOver';

function App() {
  const [gameState, setGameState] = useState('menu');
  const [mode, setMode] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));

  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const boardGroupRef = useRef(null);
  const cellsRef = useRef([]);
  const gameObjectsRef = useRef([]);

  const checkWinner = useCallback((currentBoard) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const [a, b, c] of lines) {
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return currentBoard[a];
      }
    }

    if (currentBoard.every(cell => cell !== null)) {
      return 'draw';
    }

    return null;
  }, []);

  const findBestMove = useCallback((currentBoard) => {
    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        const testBoard = [...currentBoard];
        testBoard[i] = 'O';
        if (checkWinner(testBoard) === 'O') return i;
      }
    }

    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        const testBoard = [...currentBoard];
        testBoard[i] = 'X';
        if (checkWinner(testBoard) === 'X') return i;
      }
    }

    if (!currentBoard[4]) return 4;

    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => !currentBoard[i]);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    const sides = [1, 3, 5, 7];
    const availableSides = sides.filter(i => !currentBoard[i]);
    if (availableSides.length > 0) {
      return availableSides[Math.floor(Math.random() * availableSides.length)];
    }

    return -1;
  }, [checkWinner]);const clearGameObjects = useCallback(() => {
    if (sceneRef.current) {
      gameObjectsRef.current.forEach(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
        sceneRef.current.remove(obj);
      });
      gameObjectsRef.current = [];

      if (boardGroupRef.current) {
        sceneRef.current.remove(boardGroupRef.current);
        boardGroupRef.current = null;
        cellsRef.current = [];
      }
    }
  }, []);

  const createBoard = useCallback(() => {
    const boardGroup = new THREE.Group();
    boardGroupRef.current = boardGroup;

    // Create smaller base board
    const baseGeometry = new THREE.BoxGeometry(4.5, 0.2, 4.5); // Reduced from 6 to 4.5
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x2196f3,
      opacity: 1,
      transparent: false,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.receiveShadow = true;
    boardGroup.add(base);

    // Create grid cells with adjusted size
    const cellGeometry = new THREE.BoxGeometry(1.35, 0.1, 1.35); // Adjusted cell size (4.5/3 * 0.9)
    const cellMaterial = new THREE.MeshPhongMaterial({
      color: 0x1976d2,
      opacity: 1,
      transparent: false,
    });

    cellsRef.current = [];
    const offset = 1.5; // New offset based on smaller board size (4.5/3)

    for (let i = 0; i < 9; i++) {
      const x = (i % 3 - 1) * offset;
      const z = (Math.floor(i / 3) - 1) * offset;
      
      const cell = new THREE.Mesh(cellGeometry, cellMaterial);
      cell.position.set(x, 0.1, z);
      cell.userData.cellIndex = i;
      cellsRef.current.push(cell);
      boardGroup.add(cell);
    }

    sceneRef.current.add(boardGroup);
  }, []);

  const setupScene = useCallback(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Position camera directly above board for straight view
    camera.position.set(0, 7, 0);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current?.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 4; // Reduced min distance
    controls.maxDistance = 10; // Reduced max distance
    controls.maxPolarAngle = Math.PI / 2;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);const createX = useCallback((position) => {
    const group = new THREE.Group();
    
    // Adjusted X size for smaller board
    const xSize = 1.1;        // Reduced from 1.5
    const thickness = 0.2;    // Reduced from 0.3

    const xMaterial = new THREE.MeshPhongMaterial({
      color: 0xff4444,
      shininess: 100,
    });

    const bar1Geometry = new THREE.BoxGeometry(xSize, thickness, thickness);
    const bar1 = new THREE.Mesh(bar1Geometry, xMaterial);
    bar1.rotation.y = Math.PI / 4;
    bar1.castShadow = true;

    const bar2 = new THREE.Mesh(bar1Geometry, xMaterial);
    bar2.rotation.y = -Math.PI / 4;
    bar2.castShadow = true;

    group.add(bar1);
    group.add(bar2);
    group.position.copy(position);
    group.position.y = 0.25; // Slightly lowered height

    sceneRef.current.add(group);
    gameObjectsRef.current.push(group);
  }, []);

  const createO = useCallback((position) => {
    // Adjusted O size for smaller board
    const radius = 0.45;      // Reduced from 0.6
    const thickness = 0.15;   // Reduced from 0.2
    
    const torusGeometry = new THREE.TorusGeometry(radius, thickness, 16, 32);
    const oMaterial = new THREE.MeshPhongMaterial({
      color: 0x44ff44,
      shininess: 100,
    });

    const torus = new THREE.Mesh(torusGeometry, oMaterial);
    torus.position.copy(position);
    torus.position.y = 0.25; // Slightly lowered height
    torus.rotation.x = Math.PI / 2;
    torus.castShadow = true;

    sceneRef.current.add(torus);
    gameObjectsRef.current.push(torus);
  }, []);

  const makeMove = useCallback((index) => {
    if (board[index] || gameState !== 'playing') return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const position = cellsRef.current[index].position.clone();
    
    if (currentPlayer === 'X') {
      createX(position);
    } else {
      createO(position);
    }

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      setGameState('gameOver');
      return;
    }

    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  }, [board, currentPlayer, gameState, checkWinner, createX, createO]);

  const makeCPUMove = useCallback(() => {
    if (mode !== 'cpu' || currentPlayer === 'X' || gameState !== 'playing') return;

    const moveIndex = findBestMove(board);
    if (moveIndex !== -1) {
      setTimeout(() => makeMove(moveIndex), 500);
    }
  }, [mode, currentPlayer, gameState, board, findBestMove, makeMove]);const handleStartGame = useCallback((selectedMode) => {
    setMode(selectedMode);
    setGameState('playing');
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    
    clearGameObjects();
    createBoard();
  }, [createBoard, clearGameObjects]);

  const handleQuitToMenu = useCallback(() => {
    clearGameObjects();
    setGameState('menu');
    setMode(null);
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
  }, [clearGameObjects]);

  const handleClick = useCallback((event) => {
    if (gameState !== 'playing' || (mode === 'cpu' && currentPlayer === 'O')) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(cellsRef.current);

    if (intersects.length > 0) {
      const cellIndex = intersects[0].object.userData.cellIndex;
      makeMove(cellIndex);
    }
  }, [gameState, mode, currentPlayer, makeMove]);

  useEffect(() => {
    if (mode === 'cpu' && currentPlayer === 'O' && gameState === 'playing') {
      makeCPUMove();
    }
  }, [currentPlayer, mode, gameState, makeCPUMove]);

  useEffect(() => {
    const cleanup = setupScene();
    return () => {
      cleanup();
      clearGameObjects();
    };
  }, [setupScene, clearGameObjects]);

  return (
    <div className="w-full h-screen">
      <div 
        ref={mountRef} 
        className="w-full h-full"
        onClick={handleClick}
      />
      
      {gameState === 'menu' && (
        <MainMenu onStartGame={handleStartGame} />
      )}

      {gameState === 'playing' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 px-8 py-4 rounded-lg shadow-lg text-center">
          <div className="text-xl font-bold text-white">
            {mode === 'cpu' ? (
              currentPlayer === 'X' ? 
                <span className="text-red-400">Your Turn (X)</span> : 
                <span className="text-green-400">CPU's Turn (O)</span>
            ) : (
              <span>
                Player <span className={currentPlayer === 'X' ? 'text-red-400' : 'text-green-400'}>
                  {currentPlayer}
                </span>'s Turn
              </span>
            )}
          </div>
        </div>
      )}

      {gameState === 'gameOver' && (
        <GameOver 
          winner={winner === 'draw' ? 'draw' : mode === 'cpu' ? 
            (winner === 'X' ? 'You' : 'CPU') : winner}
          onRestart={() => handleStartGame(mode)}
          onQuit={handleQuitToMenu}
        />
      )}
    </div>
  );
}

export default App;