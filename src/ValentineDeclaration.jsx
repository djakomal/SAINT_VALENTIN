import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Sparkles, Gift, Star, Zap, Trophy, Target, Flame } from 'lucide-react';
import './ValentineDeclaration.css';

export default function ValentineDeclaration() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [score, setScore] = useState(0);
  const [activeHearts, setActiveHearts] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [combo, setCombo] = useState(0);
  const [particles, setParticles] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [powerUps, setPowerUps] = useState([]);
  const [activePowerUp, setActivePowerUp] = useState(null);
  const [multiplier, setMultiplier] = useState(1);
  const [level, setLevel] = useState(1);
  const [achievements, setAchievements] = useState([]);
  const [explosions, setExplosions] = useState([]);
  const comboTimerRef = useRef(null);

  // Define endGame with useCallback FIRST, before any useEffect that uses it
  const endGame = useCallback(() => {
    if (score > 100) addAchievement('🏆 Score Exceptionnel!');
    if (combo > 10) addAchievement('🌟 Maître du Combo!');
  
    setTimeout(() => {
      setGameComplete(true);
      setGameStarted(false);
    }, 2000);
  }, [score, combo]); // Add dependencies here

  useEffect(() => {
    const heartArray = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 6 + Math.random() * 4,
      size: 15 + Math.random() * 35
    }));
    setHearts(heartArray);
  }, []);

  // Mouse trail effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (Math.random() > 0.7) {
        setParticles(prev => [...prev, {
          id: Date.now() + Math.random(),
          x: e.clientX,
          y: e.clientY
        }]);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (particles.length > 20) {
      setParticles(prev => prev.slice(-20));
    }
  }, [particles]);

  // Game timer with level progression - FIXED
  useEffect(() => {
    if (gameStarted && !gameComplete && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prevTime => {
          const newTime = prevTime - 1;
          
          // Increase difficulty every 10 seconds
          if (newTime > 0 && newTime % 10 === 0 && newTime !== 30) {
            setLevel(prev => {
              const newLevel = prev + 1;
              addAchievement(`🎯 Niveau ${newLevel} atteint!`);
              return newLevel;
            });
          }
          
          return newTime;
        });
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameStarted && !gameComplete) {
      endGame();
    }
  }, [timeLeft, gameStarted, gameComplete, endGame]);

  // Spawn hearts with increasing difficulty - FIXED (removed endGame from dependencies)
  useEffect(() => {
    if (gameStarted && !gameComplete) {
      const spawnRate = Math.max(400, 800 - (level * 100));
      const interval = setInterval(() => {
        const heartType = Math.random();
        const newHeart = {
          id: Date.now() + Math.random(),
          x: Math.random() * 80 + 10,
          y: Math.random() * 70 + 10,
          size: 35 + Math.random() * 25,
          color: heartType > 0.95 ? '#ffd700' : 
                 heartType > 0.85 ? '#ff1493' : 
                 heartType > 0.6 ? '#ff69b4' : 
                 '#ff6b9d',
          type: heartType > 0.95 ? 'golden' : 
                heartType > 0.85 ? 'special' : 'normal',
          points: heartType > 0.95 ? 10 : heartType > 0.85 ? 3 : 1
        };
        setActiveHearts(prev => [...prev, newHeart]);
        
        setTimeout(() => {
          setActiveHearts(prev => prev.filter(h => h.id !== newHeart.id));
        }, Math.max(1200, 2000 - (level * 100)));
      }, spawnRate);
      
      return () => clearInterval(interval);
    }
  }, [gameStarted, gameComplete, level]);

  // Spawn power-ups
  useEffect(() => {
    if (gameStarted && !gameComplete) {
      const powerUpInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          const types = ['2x', 'freeze', 'magnet', 'bonus'];
          const type = types[Math.floor(Math.random() * types.length)];
          const newPowerUp = {
            id: Date.now(),
            x: Math.random() * 80 + 10,
            y: Math.random() * 70 + 10,
            type: type
          };
          setPowerUps(prev => [...prev, newPowerUp]);
          
          setTimeout(() => {
            setPowerUps(prev => prev.filter(p => p.id !== newPowerUp.id));
          }, 4000);
        }
      }, 5000);
      
      return () => clearInterval(powerUpInterval);
    }
  }, [gameStarted, gameComplete]);

  // Remove the duplicate timer effect - I'm keeping the first one and removing this one
  // This entire useEffect was duplicated, so I'm commenting it out
  /*
  useEffect(() => {
    if (!gameStarted || gameComplete) return;
  
    if (timeLeft <= 0) {
      endGame();
      return;
    }
  
    const timer = setTimeout(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
  
        if (newTime > 0 && newTime % 10 === 0) {
          setLevel(lvl => {
            const newLevel = lvl + 1;
            addAchievement(`🎯 Niveau ${newLevel} atteint!`);
            return newLevel;
          });
        }
  
        return newTime;
      });
    }, 1000);
  
    return () => clearTimeout(timer);
  }, [gameStarted, gameComplete, timeLeft, endGame]);
  */

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setCombo(0);
    setLevel(1);
    setTimeLeft(30);
    setActiveHearts([]);
    setPowerUps([]);
    setActivePowerUp(null);
    setMultiplier(1);
    setAchievements([]);
    setExplosions([]);
  };

  const createExplosion = (x, y, color) => {
    const explosion = { id: Date.now() + Math.random(), x, y, color };
    setExplosions(prev => [...prev, explosion]);
    setTimeout(() => {
      setExplosions(prev => prev.filter(e => e.id !== explosion.id));
    }, 600);
  };

  const catchHeart = (heart, x, y) => {
    const points = heart.points * multiplier;
    setScore(prev => prev + points);
    setCombo(prev => {
      const newCombo = prev + 1;
      
      if (newCombo === 5) addAchievement('🔥 Combo x5!');
      if (newCombo === 10) addAchievement('⚡ Combo x10! Incroyable!');
      if (newCombo === 15) addAchievement('💫 Combo x15! LÉGENDAIRE!');
      
      return newCombo;
    });
    
    setActiveHearts(prev => prev.filter(h => h.id !== heart.id));
    
    createExplosion(x, y, heart.color);
    
    for (let i = 0; i < (heart.type === 'golden' ? 20 : 10); i++) {
      setParticles(prev => [...prev, {
        id: Date.now() + i + Math.random(),
        x: x,
        y: y,
        angle: (Math.PI * 2 * i) / (heart.type === 'golden' ? 20 : 10),
        color: heart.color
      }]);
    }

    if (heart.type === 'golden') {
      addAchievement('⭐ Cœur d\'or attrapé! +10 points!');
      setTimeLeft(prev => prev + 3);
    }

    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => {
      setCombo(0);
    }, 1500);
  };

  const catchPowerUp = (powerUp, x, y) => {
    setPowerUps(prev => prev.filter(p => p.id !== powerUp.id));
    setActivePowerUp(powerUp.type);
    createExplosion(x, y, '#ffd700');
    
    switch(powerUp.type) {
      case '2x':
        setMultiplier(2);
        addAchievement('⚡ Double Points activé!');
        setTimeout(() => setMultiplier(1), 5000);
        break;
      case 'freeze':
        setTimeLeft(prev => prev + 5);
        addAchievement('❄️ +5 secondes bonus!');
        break;
      case 'magnet':
        addAchievement('🧲 Aimant activé!');
        const heartsToCatch = [...activeHearts].slice(0, 5);
        heartsToCatch.forEach(heart => {
          setActiveHearts(prev => prev.filter(h => h.id !== heart.id));
          setScore(prev => prev + heart.points);
        });
        break;
      case 'bonus':
        setScore(prev => prev + 20);
        addAchievement('💰 +20 points bonus!');
        break;
      default:
        break;
    }
  };

  const addAchievement = (text) => {
    const achievement = { id: Date.now() + Math.random(), text };
    setAchievements(prev => [...prev, achievement]);
    setTimeout(() => {
      setAchievements(prev => prev.filter(a => a.id !== achievement.id));
    }, 3000);
  };

  const getRank = () => {
    if (score >= 150) return { emoji: '👑', text: 'REINE DE MON CŒUR', color: '#ffd700' };
    if (score >= 100) return { emoji: '💎', text: 'DIAMANT', color: '#b9f2ff' };
    if (score >= 70) return { emoji: '🌟', text: 'SUPERSTAR', color: '#ffd700' };
    if (score >= 40) return { emoji: '⭐', text: 'CHAMPION', color: '#ff69b4' };
    return { emoji: '❤️', text: 'MON AMOUR', color: '#ff6b9d' };
  };

  return (
    <div className="valentine-container">
      {/* Custom cursor */}
      <div 
        className="custom-cursor" 
        style={{ 
          left: mousePos.x, 
          top: mousePos.y 
        }}
      />

      {/* Particle trail */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: particle.x,
            top: particle.y,
            '--particle-color': particle.color || '#ff69b4',
            '--tx': particle.angle ? `${Math.cos(particle.angle) * 60}px` : '0px',
            '--ty': particle.angle ? `${Math.sin(particle.angle) * 60}px` : '0px'
          }}
        />
      ))}

      {/* Floating hearts background */}
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="floating-heart"
          style={{
            left: `${heart.left}%`,
            animationDelay: `${heart.delay}s`,
            animationDuration: `${heart.duration}s`,
            fontSize: `${heart.size}px`,
            color: ['#ff6b9d', '#ff1493', '#ff69b4'][Math.floor(Math.random() * 3)]
          }}
        >
          <Heart fill="currentColor" />
        </div>
      ))}

      {/* Achievements */}
      {achievements.map((achievement, index) => (
        <div 
          key={achievement.id} 
          className="achievement"
          style={{ top: `${100 + index * 70}px` }}
        >
          {achievement.text}
        </div>
      ))}

      <div className="content-wrapper">
        {!gameStarted && !gameComplete && !isRevealed ? (
          <>
            <h1 className="title">Pour Toi, Aseye Amandine Lucide</h1>
            <p className="subtitle">Une Aventure Magique pour la Saint-Valentin ✨</p>
            
            <div className="game-container">
              <div className="game-intro">
                <h2 className="game-title">Le Jeu des Cœurs Magiques 💕</h2>
                <p className="game-instruction">
                  <strong>Ma chérie Amandine,</strong><br/>
                  Attrape les cœurs pour gagner des points !<br/>
                  <br/>
                  ❤️ <strong>Cœurs roses</strong> = 1 point<br/>
                  💖 <strong>Cœurs fuchsia</strong> = 3 points<br/>
                  ⭐ <strong>Cœurs dorés</strong> = 10 points + 3 secondes bonus !<br/>
                  <br/>
                  🎁 Attrape les <strong>power-ups</strong> pour des bonus spéciaux !<br/>
                  🔥 Enchaîne les combos pour plus de points !<br/>
                  <br/>
                  <strong>30 secondes pour prouver ton amour ! 💝</strong>
                </p>
                <button className="start-game-button" onClick={startGame}>
                  <Heart fill="currentColor" size={30} />
                  COMMENCER !
                  <Zap fill="currentColor" size={30} />
                </button>
              </div>
            </div>
          </>
        ) : gameStarted && !gameComplete ? (
          <>
            <h1 className="title">Go Amandine ! 🎮</h1>
            <div className="game-container">
              {activePowerUp && (
                <div className="power-up-indicator">
                  {activePowerUp === '2x' && '⚡ DOUBLE POINTS !'}
                  {activePowerUp === 'freeze' && '❄️ TEMPS GELÉ !'}
                  {activePowerUp === 'magnet' && '🧲 AIMANT ACTIF !'}
                  {activePowerUp === 'bonus' && '💰 BONUS +20 !'}
                </div>
              )}
              
              <div className="game-header">
                <div className="game-stat">
                  <Trophy size={24} />
                  {score}
                </div>
                <div className="game-stat level">
                  <Star size={24} />
                  Niv. {level}
                </div>
                {combo > 2 && (
                  <div className="game-stat combo">
                    <Flame size={24} />
                    x{combo}
                  </div>
                )}
                <div className="game-stat">
                  <Zap size={24} />
                  {timeLeft}s
                </div>
              </div>
              
              <div className="game-area">
                {activeHearts.map(heart => (
                  <div
                    key={heart.id}
                    className={`clickable-heart ${heart.type === 'golden' ? 'golden' : ''}`}
                    style={{
                      left: `${heart.x}%`,
                      top: `${heart.y}%`,
                      color: heart.color
                    }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      catchHeart(heart, rect.left + rect.width / 2, rect.top + rect.height / 2);
                    }}
                  >
                    <Heart fill="currentColor" size={heart.size} />
                  </div>
                ))}

                {powerUps.map(powerUp => (
                  <div
                    key={powerUp.id}
                    className="power-up"
                    style={{
                      left: `${powerUp.x}%`,
                      top: `${powerUp.y}%`,
                    }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      catchPowerUp(powerUp, rect.left + rect.width / 2, rect.top + rect.height / 2);
                    }}
                  >
                    {powerUp.type === '2x' && <Zap size={40} color="#ffd700" />}
                    {powerUp.type === 'freeze' && <Star size={40} color="#00bfff" />}
                    {powerUp.type === 'magnet' && <Target size={40} color="#ff69b4" />}
                    {powerUp.type === 'bonus' && <Gift size={40} color="#32cd32" />}
                  </div>
                ))}

                {explosions.map(explosion => (
                  <div
                    key={explosion.id}
                    className="explosion"
                    style={{
                      left: explosion.x,
                      top: explosion.y,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <Sparkles size={60} color={explosion.color} />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : gameComplete && !isRevealed ? (
          <>
            <h1 className="title">Résultats ! 🎉</h1>
            <div className="game-container">
              <div className="game-over-screen">
                <div className="rank-badge">{getRank().emoji}</div>
                <h2 className="game-over-title" style={{ color: getRank().color }}>
                  {getRank().text}
                </h2>
                <p className="final-score">
                  {score} POINTS ! 🏆
                </p>
                
                <div className="gift-box">
                  <Gift size={130} color="#ff6b9d" />
                </div>
                
                <p className="personal-message">
                  Tu as été extraordinaire, mon amour !<br/>
                  Ton cadeau t'attend... 💝
                </p>
                
                <button className="continue-button" onClick={() => setIsRevealed(true)}>
                  <Gift fill="currentColor" size={30} />
                  DÉCOUVRIR MON CADEAU
                  <Sparkles size={30} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="message-card">
            <div className="sparkle-container">
              <Sparkles className="sparkle" size={35} />
              <Sparkles className="sparkle" size={30} />
              <Sparkles className="sparkle" size={32} />
              <Sparkles className="sparkle" size={38} />
              <Sparkles className="sparkle" size={30} />
              <Sparkles className="sparkle" size={35} />
            </div>
            
            <div className="message-content">
              <div className="big-heart">
                <Heart fill="#ff6b9d" size={100} />
              </div>
              
              <h2 className="love-message">
                Aseye Amandine Lucide AMAGLO
              </h2>
              
              <h2 className="love-message">
                Je t'aime de tout mon cœur
              </h2>
              
              <p className="love-text">
                Chaque instant passé à tes côtés est un trésor précieux que je chéris. 
                Tu illumines ma vie de ton sourire radieux, de ta douceur infinie et de ton amour merveilleux.
                Tu es la plus belle chose qui me soit arrivée.
              </p>
              
              <p className="love-text">
                En cette Saint-Valentin magique, je veux que tu saches à quel point tu es exceptionnelle.
                Tu es mon bonheur, ma joie, mon inspiration, mon amour éternel.
                Avec toi, chaque jour est une célébration de l'amour véritable.
              </p>

              <p className="love-text">
                <strong>🎁 Ton Cadeau Spécial :</strong><br/>
                Un bijou gravé avec nos initiales
              </p>
              
              <p className="signature">
                Avec tout mon amour, pour toujours et à jamais ❤️✨
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}