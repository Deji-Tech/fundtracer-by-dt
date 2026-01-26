import { Composition } from 'remotion';
import { MainVideo } from './MainVideo';
import './style.css';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="MainVideo"
                component={MainVideo}
                durationInFrames={300}
                fps={30}
                width={1920}
                height={1080}
            />
        </>
    );
};
