import React from "react";
import { RankingTable } from "../../components/organisms";
import { useApp } from "../../context/AppContext";
import { Card } from "../../components/molecules";
import "./RankingPage.css";

// Mock Users
const MOCK_USERS = [
  {
    id: "u1",
    name: "권기범",
    level: 14,
    totalExp: 24500,
    streak: 32,
    accuracy: 88,
    nextRankExp: 35000,
  },
  {
    id: "u2",
    name: "오상준",
    level: 9,
    totalExp: 13200,
    streak: 15,
    accuracy: 76,
    nextRankExp: 15000,
  },
  {
    id: "u3",
    name: "강원모",
    level: 8,
    totalExp: 9800,
    streak: 21,
    accuracy: 82,
    nextRankExp: 15000,
  },
  {
    id: "u4",
    name: "송영준",
    level: 5,
    totalExp: 4200,
    streak: 7,
    accuracy: 68,
    nextRankExp: 7000,
  },
  {
    id: "user_001",
    name: "이창현",
    level: 1,
    totalExp: 2450,
    streak: 5,
    accuracy: 78,
    nextRankExp: 3000,
  },
];

const RankingPage = () => {
  const { user } = useApp();

  return (
    <div className="ranking-page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">글로벌 랭킹 보드</h1>
        <p className="page-desc">
          학습량, 정답률, 연속 학습일을 종합하여 산정된 실시간 랭킹입니다.
        </p>
      </header>

      <div className="ranking-page__content">
        <RankingTable users={MOCK_USERS} currentUserId={user.id} />
      </div>
    </div>
  );
};

export default RankingPage;
