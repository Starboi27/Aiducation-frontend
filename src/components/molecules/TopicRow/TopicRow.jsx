import React from 'react';
import { ChevronRight, HelpCircle } from 'lucide-react';
import { Badge } from '../../atoms';
import './TopicRow.css';

/**
 * Molecule: TopicRow
 * 과목(Subject) 안에 속하는 단일 주제(Topic) 행.
 * 토픽 색상 dot, 이름, 문제 수 badge, 퀴즈 시작 버튼으로 구성.
 */
const TopicRow = ({ topic, onStart }) => (
  <div className="topic-row">
    <div className="topic-row__left">
      <span className="topic-row__dot" style={{ background: topic.color }} />
      <span className="topic-row__name">{topic.name}</span>
      <Badge variant="default" size="sm">
        <HelpCircle size={11} style={{ marginRight: 3 }} />
        {topic.quizCount}문제
      </Badge>
    </div>
    <button className="topic-row__start" onClick={onStart}>
      퀴즈 시작 <ChevronRight size={13} />
    </button>
  </div>
);

export default TopicRow;
