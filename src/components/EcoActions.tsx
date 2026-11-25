import React, { useMemo, useState } from 'react';
import { Camera, Check, CheckCircle2, RotateCcw, Trash2, Trophy, Upload } from 'lucide-react';
import { BASE_LEADERBOARD, ECO_TASKS } from '../data/soilData';
import { EcoActionPhoto, LeaderboardMember } from '../types';

interface EcoActionsProps {
  completedTaskIds: string[];
  onToggleTask: (taskId: string) => void;
  onResetTasks: () => void;
  userName: string;
  onChangeUserName: (name: string) => void;
  userPoints: number;
  ecoPhotos: EcoActionPhoto[];
  onAddEcoPhoto: (photo: EcoActionPhoto) => void;
  onDeleteEcoPhoto: (id: string) => void;
}

function compressEcoImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 720;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export const EcoActions: React.FC<EcoActionsProps> = ({
  completedTaskIds,
  onToggleTask,
  onResetTasks,
  userName,
  onChangeUserName,
  userPoints,
  ecoPhotos,
  onAddEcoPhoto,
  onDeleteEcoPhoto,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(ECO_TASKS[0].id);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState('');

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

  const checklistPoints = useMemo(
    () =>
      ECO_TASKS.reduce(
        (sum, task) => (completedTaskIds.includes(task.id) ? sum + task.points : sum),
        0
      ),
    [completedTaskIds]
  );

  const progressPct = Math.min(100, Math.round((checklistPoints / maxDailyPoints) * 100));

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    setPhotoSuccess('');
    try {
      const compressed = await compressEcoImage(file);
      setPreviewUrl(compressed);
      setFileName(file.name);
    } catch {
      setPhotoError('Could not load this image. Please choose a valid JPG, PNG, or WebP file.');
    }
  };

  const handleSaveEcoPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    setPhotoError('');
    setPhotoSuccess('');

    if (!previewUrl) {
      setPhotoError('Please select or upload an image of your eco action first.');
      return;
    }

    const taskMeta = ECO_TASKS.find((t) => t.id === selectedTaskId) || ECO_TASKS[0];
    const newEntry: EcoActionPhoto = {
      id: `eco-photo-${Date.now()}`,
      taskId: taskMeta.id,
      taskTitle: `${taskMeta.emoji} ${taskMeta.title}`,
      caption: caption.trim() || `Completed: ${taskMeta.title}`,
      photoDataUrl: previewUrl,
      uploadedAt: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };

    onAddEcoPhoto(newEntry);
    if (!completedTaskIds.includes(taskMeta.id)) {
      onToggleTask(taskMeta.id);
    }
    setCaption('');
    setPreviewUrl('');
    setFileName('');
    setPhotoSuccess('Eco action photo uploaded! (+10 bonus photo pts added)');
  };

  return (
    <section id="eco" className="py-12 sm:py-16 bg-[#F5EFE2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm font-medium text-[#5D4037]">
              Daily Habit Tracker &amp; Photo Proof · रोज़ाना हरित कदम
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#2C1E18]">
              Eco Actions &amp; Leaderboard
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#5C473D]">
              Tick off soil-friendly daily actions, upload photos of the eco actions you took, and
              climb the community leaderboard. 🌿
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono-num text-sm font-bold text-[#1B5E20]">
              {userPoints} total pts
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
          {/* Left Column: Daily Checklist + Eco Action Image Upload Box */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              {/* Progress bar */}
              <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-4 sm:p-5">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <span className="font-semibold text-[#2C1E18]">
                    Today’s Checklist ({completedTaskIds.length}/{ECO_TASKS.length} done ·{' '}
                    {checklistPoints}/{maxDailyPoints} pts)
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
                      <p className="text-xs font-medium text-[#5D4037] mt-0.5">
                        {task.hindiTitle}
                      </p>
                      <p className="text-sm text-[#5C473D] mt-1 leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Eco Action Photo Upload Box */}
            <form
              onSubmit={handleSaveEcoPhoto}
              className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-5 sm:p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#2C1E18] flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#2E7D32]" />
                    <span>Upload Image of Eco Action Taken</span>
                  </h3>
                  <p className="text-xs text-[#6E584D] mt-0.5">
                    Share a photo of your compost bin, planted sapling, waste segregation, or cloth
                    bag (+10 bonus pts per photo). 📸
                  </p>
                </div>
              </div>

              {photoSuccess && (
                <div
                  role="status"
                  className="rounded-xl bg-[#E8F5E9] border border-[#A5D6A7] p-3 text-xs sm:text-sm text-[#1B5E20] flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{photoSuccess}</span>
                </div>
              )}

              {photoError && (
                <div
                  role="alert"
                  className="rounded-xl bg-[#FDECEA] border border-[#F5C2C0] p-3 text-xs sm:text-sm text-[#8D1E1E]"
                >
                  {photoError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="eco-photo-task"
                    className="block text-xs font-semibold text-[#2C1E18] mb-1.5"
                  >
                    Which Eco Action did you take?
                  </label>
                  <select
                    id="eco-photo-task"
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#D4C7AE] bg-[#FAF7F0] text-sm text-[#2C1E18] focus:outline-none focus:border-[#2E7D32]"
                  >
                    {ECO_TASKS.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.emoji} {task.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="eco-photo-caption"
                    className="block text-xs font-semibold text-[#2C1E18] mb-1.5"
                  >
                    Short Caption / Note (Optional)
                  </label>
                  <input
                    id="eco-photo-caption"
                    type="text"
                    maxLength={120}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="e.g., Planted Neem sapling in school park"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#D4C7AE] bg-[#FAF7F0] text-sm text-[#2C1E18] focus:outline-none focus:border-[#2E7D32]"
                  />
                </div>
              </div>

              {/* Upload Dropzone Box */}
              <label
                htmlFor="eco-photo-file"
                className="flex flex-col items-center justify-center gap-2 min-h-[112px] px-4 py-5 rounded-xl border-2 border-dashed border-[#B9DFBA] bg-[#EEF7EE]/60 hover:bg-[#EEF7EE] transition-colors cursor-pointer text-center"
              >
                <Upload className="w-6 h-6 text-[#1B5E20]" />
                <p className="text-sm font-semibold text-[#1B5E20]">
                  {fileName ? `Selected: ${fileName}` : 'Click to upload Eco Action photo'}
                </p>
                <p className="text-xs text-[#4E342E]">
                  Supports JPG, PNG, WebP · Saved locally on your device
                </p>
                <input
                  id="eco-photo-file"
                  type="file"
                  accept="image/*"
                  onChange={handleImagePick}
                  className="sr-only"
                />
              </label>

              {previewUrl && (
                <div className="relative rounded-xl overflow-hidden border border-[#E2D9C8] h-44 bg-[#FAF7F0]">
                  <img
                    src={previewUrl}
                    alt="Preview of eco action taken"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl('');
                      setFileName('');
                    }}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-[#2C1E18]/80 text-[#FAF7F0] text-xs font-medium cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-[#FAF7F0] text-sm font-semibold cursor-pointer transition-colors"
              >
                Save Eco Action Photo (+10 pts)
              </button>

              {/* Gallery of Uploaded Eco Action Images */}
              {ecoPhotos.length > 0 && (
                <div className="pt-4 border-t border-[#EFE7D6] space-y-3">
                  <p className="text-xs font-bold text-[#5D4037]">
                    My Eco Action Photos ({ecoPhotos.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ecoPhotos.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[#E2D9C8] bg-[#FAF7F0] overflow-hidden flex flex-col"
                      >
                        <div className="h-32 bg-[#EFE7D6] overflow-hidden">
                          <img
                            src={item.photoDataUrl}
                            alt={item.caption}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-[#1B5E20]">{item.taskTitle}</p>
                            <p className="text-xs text-[#2C1E18] mt-0.5 line-clamp-2">
                              {item.caption}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[#6E584D]">
                            <span>{item.uploadedAt}</span>
                            <button
                              type="button"
                              onClick={() => onDeleteEcoPhoto(item.id)}
                              className="inline-flex items-center gap-1 text-[#8D3B1B] font-medium hover:underline cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Column: Community Leaderboard */}
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
