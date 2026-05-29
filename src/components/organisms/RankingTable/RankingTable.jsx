import React from "react";
import { Trophy, Medal, TrendingUp, Zap } from "lucide-react";
import { Avatar, Badge, ProgressBar } from "../../atoms";
import { getRank } from "../../molecules/ExpCard/ExpCard";
import "./RankingTable.css";

const RankingTable = ({ users = [], currentUserId }) => {
  const sorted = [...users].sort((a, b) => b.totalExp - a.totalExp);
  const maxExp = sorted[0]?.totalExp || 1;

  const MEDALS = {
    0: { icon: Trophy, color: "#ffd700", label: "1위" },
    1: { icon: Medal, color: "#c0c0c0", label: "2위" },
    2: { icon: Medal, color: "#cd7f32", label: "3위" },
  };

  return (
    <div className="ranking-table">
      <div className="ranking-table__header">
        <span className="ranking-table__col ranking-table__col--rank">
          순위
        </span>
        <span className="ranking-table__col ranking-table__col--user">
          유저
        </span>
        <span className="ranking-table__col ranking-table__col--level">
          등급
        </span>
        <span className="ranking-table__col ranking-table__col--xp">XP</span>
      </div>

      <div className="ranking-table__body">
        {sorted.map((user, index) => {
          const rank = getRank(user.totalExp);
          const medal = MEDALS[index];
          const isMe = user.id === currentUserId;

          return (
            <div
              key={user.id}
              className={`ranking-table__row ${isMe ? "ranking-table__row--me" : ""} ${index < 3 ? `ranking-table__row--top${index + 1}` : ""}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="ranking-table__col ranking-table__col--rank">
                {medal ? (
                  <div
                    className="ranking-table__medal"
                    style={{ color: medal.color }}
                  >
                    <medal.icon size={20} fill="currentColor" />
                  </div>
                ) : (
                  <span className="ranking-table__rank-num">#{index + 1}</span>
                )}
              </div>

              <div className="ranking-table__col ranking-table__col--user">
                <Avatar name={user.name} size="sm" />
                <div className="ranking-table__user-info">
                  <span className="ranking-table__username">
                    {user.name}
                    {isMe && <span className="ranking-table__me-tag">나</span>}
                  </span>
                  <span className="ranking-table__lv">Lv. {user.level}</span>
                </div>
              </div>

              <div className="ranking-table__col ranking-table__col--level">
                <Badge variant={rank.badge} size="sm">
                  {rank.name}
                </Badge>
              </div>

              <div className="ranking-table__col ranking-table__col--xp">
                <div className="ranking-table__xp-wrap">
                  <Zap size={12} style={{ color: rank.color }} />
                  <span className="ranking-table__xp-val">
                    {user.totalExp.toLocaleString()}
                  </span>
                </div>
                <ProgressBar
                  value={user.totalExp}
                  max={maxExp}
                  variant="gold"
                  size="xs"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RankingTable;
