import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const Problem = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const opacity = interpolate(frame, [0, 15], [0, 1]);

    // Pulsing effect
    const pulse = Math.sin(frame / 5) * 0.1 + 1;

    return (
        <AbsoluteFill style={{
            backgroundColor: '#1a0000',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily
        }}>
            <div style={{
                border: '10px solid #ff3333',
                borderRadius: '50%',
                width: 300,
                height: 300,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transform: `scale(${pulse})`,
                boxShadow: `0 0 ${pulse * 30}px #ff0000`
            }}>
                <span style={{ fontSize: 100 }}>⚠️</span>
            </div>

            <h1 style={{
                color: '#ff3333',
                fontSize: 80,
                marginTop: 60,
                fontWeight: 900,
                textTransform: 'uppercase',
                opacity
            }}>
                Suspicious Activity
            </h1>
        </AbsoluteFill>
    );
};
