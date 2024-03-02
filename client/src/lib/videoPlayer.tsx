import React, { RefObject } from "react";

interface VideoPlayerProps {
  localVideoRef: RefObject<HTMLVideoElement>;
  remoteVideoRef: RefObject<HTMLVideoElement>;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  localVideoRef,
  remoteVideoRef,
}) => {
  return (
    <div style={{ display: "flex" }}>
      <div style={{ marginRight: "20px" }}>
        <div>Local Video</div>
        <video
          className="w-full"
          playsInline
          muted
          ref={localVideoRef}
          autoPlay
        />
      </div>
      <div>
        <div>Remote Video</div>
        <video
          className="w-full"
          playsInline
          muted
          ref={remoteVideoRef}
          autoPlay
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
