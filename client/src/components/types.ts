export type Params = {
    encodings: { rid: string; maxBitrate: number; scalabilityMode: string }[];
    codecOptions: { videoGoogleStartBitrate: number };
    track?: any;
};