import { useState, useEffect, useCallback } from "react";
import { socket } from "../../components/socket";

export const useSocket = () => {
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [selfSocketId, setSelfSocketId] = useState<string | null>(null);

  const handleConnected = useCallback((id: string) => {
    setSocketConnected(true);
    setSelfSocketId(id);
  }, []);

  const handleDisconnect = useCallback(() => {
    setSocketConnected(false);
    setSelfSocketId(null);
  }, []);

  useEffect(() => {
    socket.on("connected", handleConnected);
    socket.on("disconnect", handleDisconnect);
    return () => {
      socket.off("connected", handleConnected);
      socket.off("disconnect", handleDisconnect);
    };
  }, [handleConnected, handleDisconnect]);

  return { socketConnected, selfSocketId };
};
