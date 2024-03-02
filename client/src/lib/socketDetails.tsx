import React from "react";
import { useSocket } from "./hooks/useSocket";

const SocketDetails: React.FC = () => {
  const { socketConnected, selfSocketId } = useSocket();
  return (
    <>
      <div>{socketConnected ? "Socket connected" : "Socket not connected"}</div>
      {selfSocketId && <div>Socket ID - {selfSocketId}</div>}
    </>
  );
};

export default SocketDetails;
