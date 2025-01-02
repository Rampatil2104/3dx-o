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

  const getResponsiveScale = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;
    
    // Base scale for desktop
    let scale = 1;
    
    // Adjust for mobile
    if (width <= 768) {
      if (aspectRatio < 0.75) { // Tall phones (like iPhone 12 Pro)
        scale = 1.8;
      } else if (aspectRatio < 1) { // Regular phones
        scale = 1.5;
      } else { // Landscape phones
        scale = 1.3;
      }
    }
    
    return scale;
  }, []);

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
  }, [checkWinner]);const setupScene = useCallback(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Camera setup with responsive positioning
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    // Adjust camera position based on screen size
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      const aspectRatio = window.innerWidth / window.innerHeight;
      if (aspectRatio < 0.75) { // Tall phones
        camera.position.set(0, 7, 4);
      } else { // Wide phones
        camera.position.set(0, 6, 5);
      }
    } else {
      camera.position.set(0, 5, 5);
    }
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Controls with responsive constraints
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = isMobile ? 4 : 5;
    controls.maxDistance = isMobile ? 10 : 15;
    controls.maxPolarAngle = Math.PI / 2;

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

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Enhanced resize handler for responsiveness
    const handleResize = () => {
      const newScale = getResponsiveScale();
      camera.aspect = window.innerWidth / window.innerHeight;
      
      // Adjust camera position on resize
      const isMobile = window.innerWidth <= 768;
      const aspectRatio = window.innerWidth / window.innerHeight;
      
      if (isMobile) {
        if (aspectRatio < 0.75) {
          camera.position.set(0, 7, 4);
        } else {
          camera.position.set(0, 6, 5);
        }
        controls.minDistance = 4;
        controls.maxDistance = 10;
      } else {
        camera.position.set(0, 5, 5);
        controls.minDistance = 5;
        controls.maxDistance = 15;
      }
      
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      // Update board scale if it exists
      if (boardGroupRef.current) {
        boardGroupRef.current.scale.set(1/newScale, 1/newScale, 1/newScale);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [getResponsiveScale]);

  const createBoard = useCallback(() => {
    const boardGroup = new THREE.Group();
    boardGroupRef.current = boardGroup;

    const scale = getResponsiveScale();
    boardGroup.scale.set(1/scale, 1/scale, 1/scale);

    // Create base board
    const baseGeometry = new THREE.BoxGeometry(6, 0.2, 6);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x2196f3,
      opacity: 1,
      transparent: false,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.receiveShadow = true;
    boardGroup.add(base);

    // Create grid cells
    const cellGeometry = new THREE.BoxGeometry(1.8, 0.1, 1.8);
    const cellMaterial = new THREE.MeshPhongMaterial({
      color: 0x1976d2,
      opacity: 1,
      transparent: false,
    });

    cellsRef.current = [];
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
  }, [getResponsiveScale]);

  const clearGameObjects = useCallback(() => {
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
  }, []);const createX = useCallback((position) => {
    const group = new THREE.Group();
    const scale = getResponsiveScale();
    
    // Adjust size for mobile
    const isMobile = window.innerWidth <= 768;
    const size = isMobile ? 1.2 : 1.5;
    const thickness = isMobile ? 0.2 : 0.3;

    const xMaterial = new THREE.MeshPhongMaterial({
      color: 0xff4444,
      shininess: 100,
    });

    const bar1Geometry = new THREE.BoxGeometry(size, thickness, thickness);
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
    
    // Apply device-specific scaling
    const finalScale = 1 / (scale * (isMobile ? 1.2 : 1));
    group.scale.set(finalScale, finalScale, finalScale);

    sceneRef.current.add(group);
    gameObjectsRef.current.push(group);
  }, [getResponsiveScale]);

  const createO = useCallback((position) => {
    const scale = getResponsiveScale();
    const isMobile = window.innerWidth <= 768;
    
    // Adjust size for mobile
    const radius = isMobile ? 0.5 : 0.6;
    const thickness = isMobile ? 0.15 : 0.2;
    
    const torusGeometry = new THREE.TorusGeometry(radius, thickness, 16, 32);
    const oMaterial = new THREE.MeshPhongMaterial({
      color: 0x44ff44,
      shininess: 100,
    });

    const torus = new THREE.Mesh(torusGeometry, oMaterial);
    torus.position.copy(position);
    torus.position.y = 0.3;
    torus.rotation.x = Math.PI / 2;
    torus.castShadow = true;
    
    // Apply device-specific scaling
    const finalScale = 1 / (scale * (isMobile ? 1.2 : 1));
    torus.scale.set(finalScale, finalScale, finalScale);

    sceneRef.current.add(torus);
    gameObjectsRef.current.push(torus);
  }, [getResponsiveScale]);

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
  }, [mode, currentPlayer, gameState, board, findBestMove, makeMove]);

  useEffect(() => {
    if (mode === 'cpu' && currentPlayer === 'O' && gameState === 'playing') {
      makeCPUMove();
    }
  }, [currentPlayer, mode, gameState, makeCPUMove]);const handleStartGame = useCallback((selectedMode) => {
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

    // Calculate mouse position accounting for device pixel ratio
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