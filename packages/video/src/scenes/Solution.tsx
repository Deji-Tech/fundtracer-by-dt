import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

export const Solution = () => {
    const frame = useCurrentFrame();
    const { width } = useVideoConfig();

    // Staggered entry from left
    const progress1 = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
    const progress2 = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' });
    const progress3 = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });

    const x1 = interpolate(progress1, [0, 1], [-width, 0]);
    const x2 = interpolate(progress2, [0, 1], [-width, 0]);
    const x3 = interpolate(progress3, [0, 1], [-width, 0]);


    return (
        <AbsoluteFill style={{
            backgroundColor: '#001a09',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily,
            gap: 40
        }}>
            <div style={{
                transform: `translateX(${x1}px)`,
                backgroundColor: '#00ff66',
                color: 'black',
                padding: '30px 60px',
                borderRadius: 20,
                fontSize: 50,
                fontWeight: 'bold',
                width: 800,
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,255,100,0.3)'
            }}>
                Real-time Tracking
            </div>

            <div style={{
                transform: `translateX(${x2}px)`,
                backgroundColor: '#00cc52',
                color: 'black',
                padding: '30px 60px',
                borderRadius: 20,
                fontSize: 50,
                fontWeight: 'bold',
                width: 800,
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,204,82,0.3)'
            }}>
                Sybil Detection
            </div>

            <div style={{
                transform: `translateX(${x3}px)`,
                backgroundColor: '#00993d',
                color: 'white',
                padding: '30px 60px',
                borderRadius: 20,
                fontSize: 50,
                fontWeight: 'bold',
                width: 800,
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(0,153,61,0.3)'
            }}>
                Instant Analysis
            </div>
        </AbsoluteFill>
    );
};
