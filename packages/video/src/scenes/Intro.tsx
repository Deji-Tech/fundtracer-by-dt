import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const Intro = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
    const scale = interpolate(frame, [0, 60], [0.8, 1], { extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill style={{
            backgroundColor: '#0A0A0A',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily
        }}>
            <h1 style={{
                color: 'white',
                fontSize: 120,
                fontWeight: 800,
                opacity,
                transform: `scale(${scale})`,
                margin: 0,
                background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                FundTracer
            </h1>
            <h2 style={{
                color: '#aaaaaa',
                marginTop: 20,
                fontSize: 40,
                opacity: interpolate(frame, [20, 50], [0, 1])
            }}>
                Follow the Money.
            </h2>
        </AbsoluteFill>
    );
};
