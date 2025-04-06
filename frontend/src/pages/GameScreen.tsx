import { useEffect, useRef, useState } from "react";
import crosshair from './../assets/images/crosshair.png';
import { EventsEmit } from "../../wailsjs/runtime";

function GameScreen() {

    type Circle = {
        x: number;
        y: number;
        radius: number;
        color: string;
        vx: number;
        vy: number;
    };

    const LEVEL_DURATION_STEP = 30000;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const crosshairRef = useRef<HTMLImageElement>(null);
    const [gameStart, setGameStart] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [level, setLevel] = useState(1);
    const [points, setPoints] = useState(0);
    const [gameState, setGameState] = useState<Circle[]>([]);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [startLevelTime, setStartLevelTime] = useState<Date | null>(null);
    const [levelDuration, setLevelDuration] = useState<number>(LEVEL_DURATION_STEP);

    useEffect(() => {
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

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        canvas.addEventListener("mousemove", handleMouseMove);

        const handleClick = (event: MouseEvent) => {
            if (gameOver) {
                return;
            }

            if (!gameStart) {
                EventsEmit('game-started');
                setGameStart(true);
                setPoints(0);
                setLevel(1);
                let now = new Date();
                setStartTime(now);
                setStartLevelTime(now);
                setLevelDuration(LEVEL_DURATION_STEP);
                setGameOver(false);
                createCircles();

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
                let now = new Date();
                setStartLevelTime(now);
                setLevelDuration((level + 1) * LEVEL_DURATION_STEP);
                createCircles();
            }

            if (circles.length === 0 && level == 100) {
                setGameOver(true);
            }
        };

        canvas.addEventListener("click", handleClick);

        let myReq: number;

        const animationFrameCallback = (timestamp: number) => {
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

                let currentTime: Date = new Date()
                let totalDurationTime: number = currentTime.getTime() - (startTime?.getTime() || 0);
                let levelDurationTime: number = currentTime.getTime() - (startLevelTime?.getTime() || 0);
                let levelRemainingTime: number = levelDuration - levelDurationTime + 1000;

                if (levelRemainingTime <= 0) {
                    levelRemainingTime = 0;
                    setGameOver(true);
                }

                const timer = (d: number): string => {
                    const timeObj = new Date(d);
                    let h = timeObj.getUTCHours(), m = timeObj.getUTCMinutes(), s = timeObj.getUTCSeconds()

                    const timeFormatter = (x: number): string => {
                        return `${(x < 10) ? '0' + x : x}`;
                    }

                    return `${timeFormatter(h)}:${timeFormatter(m)}:${timeFormatter(s)}`;
                }

                ctx.fillStyle = "#ffffff";
                ctx.font = "16px monospace";
                ctx.fillText(`FPS: ${fps.toFixed(1)}`, 10, 20);
                ctx.fillText(`Bubbles: ${circles.length}`, 10, 40);
                ctx.fillText(`Points: ${points}`, 10, 60);
                ctx.fillText(`Level: ${level}`, 10, 80);
                ctx.fillText(`Duration: ${timer(totalDurationTime)}`, 10, 100);
                ctx.fillText(`Remaining: ${timer(levelRemainingTime)}`, 10, 120);
            }

            if (crosshairRef.current && !gameOver) {
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

            myReq = requestAnimationFrame(animationFrameCallback);
        };

        myReq = requestAnimationFrame(animationFrameCallback);

        return () => {
            canvas.removeEventListener("click", handleClick);
            canvas.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(myReq);
        };
    }, [gameStart, gameOver, level, points, gameState, startTime, startLevelTime, levelDuration]);

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
