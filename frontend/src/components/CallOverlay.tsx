import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Phone } from "lucide-react";
import { Avatar } from "./Avatar";

type Props = {
  active: boolean;
  peerName: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  muted: boolean;
  cameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEnd: () => void;
};

export function CallOverlay({
  active,
  peerName,
  localStream,
  remoteStream,
  muted,
  cameraOff,
  onToggleMute,
  onToggleCamera,
  onEnd,
}: Props) {
  const remoteRef = useRef<HTMLVideoElement>(null);
  const localRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (remoteRef.current && remoteStream) {
      remoteRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localRef.current && localStream) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  if (!active) return null;

  return (
    <div className="call-overlay">
      <motion.div
        className="glass call-stage"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="call-videos">
          <video ref={remoteRef} autoPlay playsInline />
          {!remoteStream ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: "#fff",
                textAlign: "center",
                padding: "1rem",
              }}
            >
              <div>
                <Avatar name={peerName} size="xl" />
                <h3 style={{ margin: "1rem 0 0.25rem", fontFamily: "Syne" }}>
                  Calling {peerName}
                </h3>
                <p style={{ opacity: 0.7, margin: 0 }}>Connecting liquid link…</p>
              </div>
            </div>
          ) : null}
          <div className="local-video">
            <video ref={localRef} autoPlay playsInline muted />
          </div>
        </div>

        <div className="call-bar">
          <button className="glass-btn glass-btn--icon" onClick={onToggleMute}>
            {muted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button className="glass-btn glass-btn--icon" onClick={onToggleCamera}>
            {cameraOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>
          <button className="glass-btn glass-btn--danger glass-btn--icon" onClick={onEnd}>
            <PhoneOff size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

type IncomingProps = {
  name: string;
  avatar?: string | null;
  onAccept: () => void;
  onReject: () => void;
};

export function IncomingCallBanner({
  name,
  avatar,
  onAccept,
  onReject,
}: IncomingProps) {
  return (
    <motion.div
      className="glass incoming-banner"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <Avatar name={name} avatar={avatar} size="lg" />
      <div>
        <strong>{name}</strong>
        <div style={{ fontSize: "0.8rem", color: "var(--ink-mute)" }}>
          Incoming video call
        </div>
      </div>
      <div className="incoming-banner__actions">
        <button className="glass-btn glass-btn--danger glass-btn--icon" onClick={onReject}>
          <PhoneOff size={16} />
        </button>
        <button className="glass-btn glass-btn--primary glass-btn--icon" onClick={onAccept}>
          <Phone size={16} />
        </button>
      </div>
    </motion.div>
  );
}
