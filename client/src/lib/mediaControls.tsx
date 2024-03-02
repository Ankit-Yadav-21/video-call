import React from "react";

interface MediaControlsProps {
  goProduce: () => void;
  goConsume: () => void;
}

const MediaControls: React.FC<MediaControlsProps> = ({
  goProduce,
  goConsume,
}) => {
  return (
    <div>
      <button onClick={goProduce}>Produce</button>
      <button onClick={goConsume}>Consume</button>
    </div>
  );
};

export default MediaControls;
