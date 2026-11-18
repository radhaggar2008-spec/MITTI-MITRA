import React, { useMemo } from 'react';
import { Check, RotateCcw, Trophy } from 'lucide-react';
import { BASE_LEADERBOARD, ECO_TASKS } from '../data/soilData';
import { LeaderboardMember } from '../types';

interface EcoActionsProps {
  completedTaskIds: string[];
  onToggleTask: (taskId: string) => void;
  onResetTasks: () => void;
  userName: string;
  onChangeUserName: (name: string) => void;
  userPoints: number;
}

export const EcoActions: React.FC<EcoActionsProps> = ({
  completedTaskIds,
  onToggleTask,
  onResetTasks,
  userName,
  onChangeUserName,
  userPoints,
}) => {
  const maxDailyPoints = useMemo(
    () => ECO_TASKS.reduce((sum, task) => sum + task.points, 0),
    []
  );

  const leaderboard = useMemo(() => {
    const userEntry: LeaderboardMember = {
      id: 'user-self',
      name: userName.trim() || 'You (MittiMitra)',
      city: 'Your Neighbourhood',
      points: userPoints,
      streakDays: completedTaskIds.length > 0 ? 1 : 0,
      isUser: true,
    };

    return [...BASE_LEADERBOARD, userEntry].sort((a, b) => b.points - a.points);
  }, [userName, userPoints, completedTaskIds.length]);

  const progressPct = Math.min(100, Math.round((userPoints / maxDailyPoints) * 100));

  return (
    <section id="eco" className="py-12 sm:py-16 border-t border-[#E2D9C8] bg-[#F5EFE2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm font-medium text-[#5D4037]">
              Daily Habit Tracker · रोज़ाना हरित कदम
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#2C1E18]">
              Eco Actions &amp; Leaderboard
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#5C473D]">
              Tick off soil-friendly daily actions to earn SoilGuard points and climb the community
              leaderboard. 🌿
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono-num text-sm font-bold text-[#1B5E20]">
              {userPoints} / {maxDailyPoints} pts today
            </span>
            <button
              type="button"
              onClick={onResetTasks}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#D4C7AE] text-xs font-semibold text-[#4E342E] hover:bg-[#FAF7F0] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Day</span>
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Daily Checklist */}
          <div className="lg:col-span-7 space-y-3">
            {/* Progress bar */}
            <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="font-semibold text-[#2C1E18]">
                  Today’s SoilGuard Progress ({completedTaskIds.length}/{ECO_TASKS.length} done)
                </span>
                <span className="font-mono-num font-bold text-[#1B5E20]">{progressPct}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#EFE7D6] overflow-hidden">
                <div
                  className="h-full bg-[#2E7D32] rounded-full transition-all duration-200"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {ECO_TASKS.map((task) => {
              const checked = completedTaskIds.includes(task.id);
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  aria-pressed={checked}
                  className={`w-full text-left rounded-2xl border p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                    checked
                      ? 'bg-[#EEF7EE] border-[#A5D6A7]'
                      : 'bg-[#FFFFFF] border-[#E2D9C8] hover:bg-[#FAF7F0]'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      checked
                        ? 'bg-[#2E7D32] border-[#1B5E20] text-[#FAF7F0]'
                        : 'bg-[#FAF7F0] border-[#BFA98E] text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-display text-base font-bold text-[#2C1E18]">
                        {task.emoji} {task.title}
                      </p>
                      <span
                        className={`font-mono-num text-xs font-bold ${
                          checked ? 'text-[#1B5E20]' : 'text-[#5D4037]'
                        }`}
                      >
                        +{task.points} pts
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#5D4037] mt-0.5">{task.hindiTitle}</p>
                    <p className="text-sm text-[#5C473D] mt-1 leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Community Leaderboard */}
          <div className="lg:col-span-5 rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-[#2C1E18] flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#8D5A1B]" />
                <span>MittiMitra Leaderboard</span>
              </h3>
              <span className="text-xs text-[#6E584D]">NCR &amp; Haryana</span>
            </div>

            <div className="mt-4">
              <label htmlFor="eco-username" className="block text-xs font-semibold text-[#5C473D] mb-1">
                Your Leaderboard Name
              </label>
              <input
                id="eco-username"
                type="text"
                value={userName}
                onChange={(e) => onChangeUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-[#D4C7AE] bg-[#FAF7F0] text-sm text-[#2C1E18] focus:outline-none focus:border-[#2E7D32]"
              />
            </div>

            <div className="mt-5 divide-y divide-[#EFE7D6]">
              {leaderboard.map((member, index) => (
                <div
                  key={member.id}
                  className={`py-3 px-2.5 flex items-center justify-between gap-3 rounded-xl ${
                    member.isUser ? 'bg-[#EEF7EE]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono-num text-sm font-bold text-[#5D4037] w-6 shrink-0">
                      #{index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#2C1E18] truncate">
                        {member.name}
                        {member.isUser ? ' (You)' : ''}
                      </p>
                      <p className="text-xs text-[#6E584D] truncate">{member.city}</p>
                    </div>
                  </div>

                  <span className="font-mono-num text-sm font-bold text-[#1B5E20] shrink-0">
                    {member.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
