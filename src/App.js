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

  const findBestMove = useCallback((currentBoard) => {
    // Check for winning move
    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        const testBoard = [...currentBoard];
        testBoard[i] = 'O';
        if (checkWinner(testBoard) === 'O') return i;
      }
    }

    // Block player's winning move
    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        const testBoard = [...currentBoard];
        testBoard[i] = 'X';
        if (checkWinner(testBoard) === 'X') return i;
      }
    }

    // Take center if available
    if (!currentBoard[4]) return 4;

    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => !currentBoard[i]);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Take sides
    const sides = [1, 3, 5, 7];
    const availableSides = sides.filter(i => !currentBoard[i]);
    if (availableSides.length > 0) {
      return availableSides[Math.floor(Math.random() * availableSides.length)];
    }

    return -1;
  }, []);

  const checkWinner = (currentBoard) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
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
  };useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 5);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
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

    createBoard();

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  const createBoard = () => {
    const boardGroup = new THREE.Group();
    boardGroupRef.current = boardGroup;

    // Create base board
    const baseGeometry = new THREE.BoxGeometry(6, 0.2, 6);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x2196f3,
      opacity: 0.9,
      transparent: true,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.receiveShadow = true;
    boardGroup.add(base);

    // Create grid cells
    const cellGeometry = new THREE.BoxGeometry(1.8, 0.1, 1.8);
    const cellMaterial = new THREE.MeshPhongMaterial({
      color: 0x1976d2,
      opacity: 0.5,
      transparent: true,
    });

    for (let i = 0; i < 9; i++) {
      const x = (i % 3) - 1;
      const z = Math.floor(i / 3) - 1;
      
      const cell = new THREE.Mesh(cellGeometry, cellMaterial);
      cell.position.set(x * 2, 0.1, z * 2);
      cell.userData.cellIndex = i;
      cellsRef.current.push(cell);
      boardGroup.add(cell);
    }

    sceneRef.current.add(boardGroup);
  };const createX = (position) => {
    const group = new THREE.Group();

    // Create X using boxes
    const xMaterial = new THREE.MeshPhongMaterial({
      color: 0xff4444,
      shininess: 100,
    });

    const bar1Geometry = new THREE.BoxGeometry(1.5, 0.3, 0.3);
    const bar1 = new THREE.Mesh(bar1Geometry, xMaterial);
    bar1.rotation.y = Math.PI / 4;
    bar1.castShadow = true;

    const bar2 = new THREE.Mesh(bar1Geometry, xMaterial);
    bar2.rotation.y = -Math.PI / 4;
    bar2.castShadow = true;

    group.add(bar1);
    group.add(bar2);
    group.position.copy(position);
    group.position.y = 0.3;

    sceneRef.current.add(group);
  };

  const createO = (position) => {
    const torusGeometry = new THREE.TorusGeometry(0.6, 0.2, 16, 32);
    const oMaterial = new THREE.MeshPhongMaterial({
      color: 0x44ff44,
      shininess: 100,
    });

    const torus = new THREE.Mesh(torusGeometry, oMaterial);
    torus.position.copy(position);
    torus.position.y = 0.3;
    torus.rotation.x = Math.PI / 2;
    torus.castShadow = true;

    sceneRef.current.add(torus);
  };

  const makeCPUMove = useCallback(() => {
    if (mode !== 'cpu' || currentPlayer === 'X' || gameState !== 'playing') return;

    const moveIndex = findBestMove(board);
    if (moveIndex !== -1) {
      setTimeout(() => makeMove(moveIndex), 500);
    }
  }, [mode, currentPlayer, gameState, board, findBestMove]);

  useEffect(() => {
    if (mode === 'cpu' && currentPlayer === 'O' && gameState === 'playing') {
      makeCPUMove();
    }
  }, [currentPlayer, mode, gameState, makeCPUMove]);

  const handleStartGame = useCallback((selectedMode) => {
    setMode(selectedMode);
    setGameState('playing');
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);

    // Clear the board
    if (sceneRef.current) {
      const objectsToRemove = [];
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh && 
            (object.material.color.getHex() === 0xff4444 || 
             object.material.color.getHex() === 0x44ff44)) {
          objectsToRemove.push(object);
        }
      });
      objectsToRemove.forEach(obj => {
        obj.geometry.dispose();
        obj.material.dispose();
        sceneRef.current.remove(obj);
      });
    }
  }, []);const handleClick = (event) => {
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
  };

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
  }, [board, currentPlayer, gameState]);

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
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 p-4 rounded text-white">
          Current Player: {currentPlayer}
          {mode === 'cpu' && currentPlayer === 'O' && ' (CPU)'}
        </div>
      )}

      {gameState === 'gameOver' && (
        <GameOver 
          winner={winner === 'draw' ? 'draw' : mode === 'cpu' ? 
            (winner === 'X' ? 'You' : 'CPU') : winner}
          onRestart={() => handleStartGame(mode)}
        />
      )}
    </div>
  );
}

export default App;