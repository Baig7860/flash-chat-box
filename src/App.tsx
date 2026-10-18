import { useState } from "react";
import Welcome from "./components/Welcome";
import Chat from "./components/Chat";
import { DEFAULT_ROOM } from "./lib/api";

const STORAGE_NICKNAME = "flashbox:nickname";

export default function App() {
  const savedNickname = localStorage.getItem(STORAGE_NICKNAME);
  const [joined, setJoined] = useState<{ nickname: string } | null>(
    savedNickname ? { nickname: savedNickname } : null,
  );

  return joined ? (
    <Chat room={DEFAULT_ROOM} nickname={joined.nickname} />
  ) : (
    <Welcome
      onJoin={(nickname) => {
        localStorage.setItem(STORAGE_NICKNAME, nickname);
        setJoined({ nickname });
      }}
    />
  );
}
