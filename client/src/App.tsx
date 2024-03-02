import React from "react";
import MediaControls from "./lib/mediaControls";
import { useMediasoup } from "./lib/hooks/useMediasoup";
import VideoPlayer from "./lib/videoPlayer";
import SocketDetails from "./lib/socketDetails";

const App: React.FC = () => {
  const { remoteVideoRef, localVideoRef, goProduce, goConsume } =
    useMediasoup();

  return (
    <>
      <SocketDetails />
      <MediaControls goProduce={goProduce} goConsume={goConsume} />
      <VideoPlayer
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
      />
    </>
  );
};

export default App;
