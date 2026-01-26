import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { Intro } from './scenes/Intro';
import { Problem } from './scenes/Problem';
import { Solution } from './scenes/Solution';
import { Outro } from './scenes/Outro';

export const MainVideo = () => {
    return (
        <div style={{ flex: 1, backgroundColor: 'black', width: '100%', height: '100%', display: 'flex' }}>
            <TransitionSeries>
                <TransitionSeries.Sequence durationInFrames={90}>
                    <Intro />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={slide({ direction: 'from-bottom' })}
                    timing={linearTiming({ durationInFrames: 30 })}
                />

                <TransitionSeries.Sequence durationInFrames={90}>
                    <Problem />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: 30 })}
                />

                <TransitionSeries.Sequence durationInFrames={120}>
                    <Solution />
                </TransitionSeries.Sequence>

                <TransitionSeries.Transition
                    presentation={slide({ direction: 'from-right' })}
                    timing={linearTiming({ durationInFrames: 30 })}
                />

                <TransitionSeries.Sequence durationInFrames={90}>
                    <Outro />
                </TransitionSeries.Sequence>
            </TransitionSeries>
        </div>
    );
};
