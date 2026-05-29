import React, { useState, useEffect } from "react";
import { RankingTable } from "../../components/organisms";
import { useApp } from "../../context/AppContext";
import { Card } from "../../components/molecules";
import { Loader2 } from "lucide-react";
import { userService } from "../../services/userService";
import "./RankingPage.css";

const RankingPage = () => {
  const { user } = useApp();
  const [rankings, setRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setIsLoading(true);
        const data = await userService.getRanking();
        
        const mapped = (data.rankings || []).map(item => ({
          id: item.userId,
          name: item.name || item.userName || item.userId.split('@')[0],
          level: item.level,
          totalExp: item.totalExp,
        }));
        setRankings(mapped);
      } catch (err) {
        console.error("랭킹 정보를 불러오는데 실패했습니다:", err);
        setError("랭킹 정보를 불러올 수 없습니다. 나중에 다시 시도해주세요.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, []);

  return (
    <div className="ranking-page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">글로벌 랭킹 보드</h1>
        <p className="page-desc">
          학습량(XP)과 레벨을 바탕으로 산정된 실시간 글로벌 랭킹입니다.
        </p>
      </header>

      <div className="ranking-page__content">
        {isLoading ? (
          <div className="ranking-page__loading">
            <Loader2
              className="animate-spin"
              size={48}
              color="var(--color-primary)"
            />
            <p>랭킹 정보를 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="ranking-page__error">
            <p>{error}</p>
          </div>
        ) : (
          <RankingTable users={rankings} currentUserId={user.userId} />
        )}
      </div>
    </div>
  );
};

export default RankingPage;
