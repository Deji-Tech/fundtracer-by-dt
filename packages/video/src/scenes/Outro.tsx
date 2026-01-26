import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const Outro = () => {
    const frame = useCurrentFrame();

    const opacity = interpolate(frame, [0, 30], [0, 1]);
    const scale = interpolate(frame, [0, 90], [1, 1.2]);

    return (
        <AbsoluteFill style={{
            backgroundColor: '#000000',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily
        }}>
            <h1 style={{
                color: 'white',
                fontSize: 100,
                transform: `scale(${scale})`,
                opacity
            }}>
                Start Tracing Today.
            </h1>
            <h2 style={{
                color: '#4facfe',
                marginTop: 30,
                fontSize: 40,
                opacity: interpolate(frame, [30, 60], [0, 1])
            }}>
                fundtracer.com
            </h2>
        </AbsoluteFill>
    );
};
