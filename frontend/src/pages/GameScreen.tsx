import { useEffect, useRef, useState } from "react";
import crosshair from './../assets/images/crosshair.png';
import { EventsEmit, EventsOn } from "../../wailsjs/runtime";

function GameScreen() {

    type Circle = {
        x: number;
        y: number;
        radius: number;
        color: string;
        vx: number;
        vy: number;
    };

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const crosshairRef = useRef<HTMLImageElement>(null);
    const [gameStart, setGameStart] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [gamePause, setGamePause] = useState(false);
    const [level, setLevel] = useState(1);
    const [points, setPoints] = useState(0);
    const [gameState, setGameState] = useState<Circle[]>([]);

    useEffect(() => {

        EventsOn('game-pause', (..._data: any) => {
            setGamePause(true)
        })

        EventsOn('game-resume', (..._data: any) => {
            setGamePause(false)
        })

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let fps = 0;
        let lastTimestamp = performance.now();

        const getRandom = (min: number, max: number) => Math.random() * (max - min) + min;
        const getRandomColor = () => {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            return `rgb(${r}, ${g}, ${b})`;
        };

        let circles: Circle[] = gameState;
        const mouse = { x: 0, y: 0 };

        const createCircles = () => {
            let num_circles = 10 * level;

            circles = Array.from({ length: num_circles }).map(() => ({
                x: getRandom(50, canvas.width - 50),
                y: getRandom(50, canvas.height - 50),
                radius: getRandom(15, 40),
                color: getRandomColor(),
                vx: getRandom(-0.1, 0.1),
                vy: getRandom(-0.1, 0.1),
            }));

            setGameState(circles);
        };

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        if (gameState.length == 0) {
            createCircles();
        }

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        canvas.addEventListener("mousemove", handleMouseMove);

        const handleClick = (event: MouseEvent) => {
            if (gamePause) {
                return;
            }

            if (!gameStart || gameOver) {
                EventsEmit('game-started');
                setGameStart(true);
                setGameOver(false);

                return;
            }

            const rect = canvas.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;

            for (let i = circles.length - 1; i >= 0; i--) {
                const c = circles[i];
                const dist = Math.hypot(c.x - clickX, c.y - clickY);
                if (dist <= c.radius) {
                    circles.splice(i, 1);
                }
            }

            if (circles.length === 0 && level < 100) {
                setPoints(points + (level * 10));
                setLevel(level + 1);
            }

            if (circles.length === 0 && level == 100) {
                setGameOver(true);
            }
        };

        canvas.addEventListener("click", handleClick);

        const animationFrameCallback = (timestamp: number) => {
            if (gamePause) {
                return;
            }

            let delta = timestamp - lastTimestamp;
            if (delta > 100) delta = 16.67;
            fps = 1000 / delta;
            lastTimestamp = timestamp;

            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (!gameStart) {
                ctx.fillStyle = "#ffffff";
                ctx.font = "28px monospace";
                ctx.fillText("Press anywhere to start the game", canvas.width / 2 - 250, canvas.height / 2);
            }

            if (!gameOver && gameStart) {
                for (const circle of circles) {
                    circle.x += circle.vx * delta;
                    circle.y += circle.vy * delta;

                    if (circle.x - circle.radius < 0 || circle.x + circle.radius > canvas.width) {
                        circle.vx *= -1;
                        circle.color = getRandomColor();
                    }
                    if (circle.y - circle.radius < 0 || circle.y + circle.radius > canvas.height) {
                        circle.vy *= -1;
                        circle.color = getRandomColor();
                    }

                    ctx.beginPath();
                    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
                    ctx.fillStyle = circle.color;
                    ctx.fill();
                    ctx.stroke();
                }

                ctx.fillStyle = "#ffffff";
                ctx.font = "16px monospace";
                ctx.fillText(`FPS: ${fps.toFixed(1)}`, 10, 20);
                ctx.fillText(`Bubbles: ${circles.length}`, 10, 40);
                ctx.fillText(`Level: ${level}`, 10, 60);
                ctx.fillText(`Points: ${points}`, 10, 80);
            }

            if (crosshairRef.current) {
                const crosshairSize = 30;
                ctx.drawImage(
                    crosshairRef.current,
                    mouse.x - crosshairSize / 2,
                    mouse.y - crosshairSize / 2,
                    crosshairSize,
                    crosshairSize
                );
            }

            if (gameOver) {
                ctx.fillStyle = "#ffffff";
                ctx.font = "48px monospace";
                ctx.fillText("Game Over", canvas.width / 2 - 120, canvas.height / 2);
                EventsEmit('game-over');
            }

            requestAnimationFrame(animationFrameCallback);
        };

        requestAnimationFrame(animationFrameCallback);

        return () => {
            canvas.removeEventListener("click", handleClick);
            canvas.removeEventListener("mousemove", handleMouseMove);
        };
    }, [gameStart, gamePause, gameOver, level, points, gameState]);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ cursor: "none" }}
            />
            <img
                ref={crosshairRef}
                src={crosshair}
                alt="crosshair"
                style={{ display: "none" }}
            />
        </>
    );
}

export default GameScreen;
